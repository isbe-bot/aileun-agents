import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadConfig } from '../src/config.js';
import { ensureRuntimeDirs, openDatabase, applyMigrations } from '../src/db.js';
import { importAgent } from '../src/agents/import.js';

const root = process.cwd();
const migrationsDir = path.join(root, 'migrations');

test('init applies migrations idempotently and importAgent indexes canonical files', () => {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'aileun-agents-test-'));
  const config = loadConfig({ runtimeDir: path.join(tmpBase, 'runtime') });
  const agentRoot = path.join(tmpBase, 'source', 'demo-agent');

  fs.mkdirSync(agentRoot, { recursive: true });
  fs.writeFileSync(path.join(agentRoot, 'agent.json'), JSON.stringify({ agent_id: 'demo-agent' }, null, 2));
  fs.writeFileSync(path.join(agentRoot, 'SOUL.md'), '# soul\n');
  fs.writeFileSync(path.join(agentRoot, 'IDENTITY.md'), '# identity\n');

  ensureRuntimeDirs(config);
  const db = openDatabase(config.dbPath);

  const first = applyMigrations(db, migrationsDir);
  assert.ok(first.appliedNow >= 1);

  const second = applyMigrations(db, migrationsDir);
  assert.equal(second.appliedNow, 0);

  const imported = importAgent(db, agentRoot);
  assert.equal(imported.agent.agent_id, 'demo-agent');
  assert.equal(imported.files.length, 10);

  const agents = db.prepare('SELECT COUNT(1) AS c FROM agents').get().c;
  const files = db.prepare('SELECT COUNT(1) AS c FROM agent_files WHERE agent_id = ?').get('demo-agent').c;
  assert.equal(agents, 1);
  assert.equal(files, 10);

  const missing = db
    .prepare('SELECT COUNT(1) AS c FROM agent_files WHERE agent_id = ? AND exists_on_disk = 0')
    .get('demo-agent').c;
  assert.ok(missing >= 1);

  db.close();
  fs.rmSync(tmpBase, { recursive: true, force: true });
});
