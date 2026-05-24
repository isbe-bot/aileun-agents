import path from 'node:path';
import { loadConfig } from '../config.js';
import { printResult, fail } from '../output.js';
import { ensureRuntimeDirs, openDatabase, applyMigrations } from '../db.js';
import { importAgent, importAgentsFromDir } from '../agents/import.js';
import { getAgent, getStats, listAgentFiles, listAgents } from '../agents/store.js';

function parseArgs(argv) {
  const args = [...argv];
  const flags = { json: false };
  const positionals = [];

  while (args.length) {
    const token = args.shift();
    if (token === '--json') {
      flags.json = true;
    } else if (token === '--help' || token === '-h') {
      flags.help = true;
    } else if (token === '--from') {
      flags.from = args.shift();
    } else if (token === '--root') {
      flags.root = args.shift();
    } else {
      positionals.push(token);
    }
  }

  return { flags, positionals };
}

function migrationsDirFromHere() {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../migrations');
}

function ensureDb(config) {
  ensureRuntimeDirs(config);
  const db = openDatabase(config.dbPath);
  const migrationResult = applyMigrations(db, migrationsDirFromHere());
  return { db, migrationResult };
}

function usage() {
  return [
    'agentctl init [--from <agents_dir>] [--json]',
    'agentctl status [--json]',
    'agentctl list [--json]',
    'agentctl show <agent_id> [--json]',
    'agentctl files <agent_id> [--json]',
    'agentctl import <agent_root> [--json]',
  ].join('\n');
}

export async function main(argv) {
  const { flags, positionals } = parseArgs(argv);
  const command = positionals[0];

  if (flags.help || command === 'help') {
    printResult(usage());
    return;
  }

  if (!command) {
    fail(`missing command\n${usage()}`, 2, flags.json);
  }

  const config = loadConfig();

  if (command === 'init') {
    const { db, migrationResult } = ensureDb(config);

    let imported = [];
    if (flags.from) {
      imported = importAgentsFromDir(db, flags.from, 'filesystem');
    }

    const stats = getStats(db);
    db.close();

    printResult(
      {
        ok: true,
        command: 'init',
        runtime_dir: config.runtimeDir,
        db_path: config.dbPath,
        migrations: migrationResult,
        imported: {
          count: imported.length,
          agent_ids: imported.map((entry) => entry.agent.agent_id),
        },
        stats,
      },
      flags.json,
    );
    return;
  }

  const { db } = ensureDb(config);

  if (command === 'status') {
    const migrations = db.prepare('SELECT COUNT(1) AS c FROM schema_migrations').get().c;
    const stats = getStats(db);

    printResult(
      {
        ok: true,
        command: 'status',
        runtime_dir: config.runtimeDir,
        db_path: config.dbPath,
        schema_migrations: migrations,
        stats,
      },
      flags.json,
    );
    db.close();
    return;
  }

  if (command === 'list') {
    const agents = listAgents(db);
    if (flags.json) {
      printResult(
        {
          ok: true,
          command: 'list',
          count: agents.length,
          agents,
        },
        true,
      );
    } else if (agents.length === 0) {
      printResult('No agents registered. Run agentctl init --from <agents_dir> or agentctl import <agent_root>.');
    } else {
      for (const agent of agents) {
        printResult(`${agent.agent_id}\t${agent.status}\t${agent.source_type}\t${agent.root_path}`);
      }
    }
    db.close();
    return;
  }

  if (command === 'show') {
    const agentId = positionals[1];
    if (!agentId) fail('show requires <agent_id>', 2, flags.json);

    const agent = getAgent(db, agentId);
    if (!agent) fail(`agent not found: ${agentId}`, 3, flags.json);

    const files = listAgentFiles(db, agentId);
    if (flags.json) {
      printResult({ ok: true, command: 'show', agent, files }, true);
    } else {
      printResult(`agent_id: ${agent.agent_id}`);
      printResult(`status: ${agent.status}`);
      printResult(`source_type: ${agent.source_type}`);
      printResult(`root_path: ${agent.root_path}`);
      printResult(`last_indexed_at: ${agent.last_indexed_at}`);
      printResult(`files: ${files.length}`);
    }

    db.close();
    return;
  }

  if (command === 'files') {
    const agentId = positionals[1];
    if (!agentId) fail('files requires <agent_id>', 2, flags.json);

    const agent = getAgent(db, agentId);
    if (!agent) fail(`agent not found: ${agentId}`, 3, flags.json);

    const files = listAgentFiles(db, agentId);

    if (flags.json) {
      printResult({ ok: true, command: 'files', agent_id: agentId, count: files.length, files }, true);
    } else if (files.length === 0) {
      printResult('No files tracked for this agent.');
    } else {
      for (const file of files) {
        printResult(
          `${file.file_kind}\t${file.exists_on_disk ? 'present' : 'missing'}\t${file.bytes}\t${file.hash_sha256 || '-'}`,
        );
      }
    }

    db.close();
    return;
  }

  if (command === 'import') {
    const inputRoot = flags.root || positionals[1];
    if (!inputRoot) fail('import requires <agent_root> or --root <agent_root>', 2, flags.json);

    const result = importAgent(db, inputRoot, 'filesystem');
    db.close();

    printResult(
      {
        ok: true,
        command: 'import',
        agent: result.agent,
        files_indexed: result.files.length,
      },
      flags.json,
    );
    return;
  }

  db.close();
  fail(`unknown command: ${command}\n${usage()}`, 2, flags.json);
}
