import fs from 'node:fs';
import path from 'node:path';
import { collectCanonicalFiles } from './files.js';
import { registerOrUpdateAgent, upsertAgentFiles } from './store.js';

function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function detectAgentId(agentRoot) {
  const agentJsonPath = path.join(agentRoot, 'agent.json');
  if (fs.existsSync(agentJsonPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(agentJsonPath, 'utf8'));
      if (parsed?.agent_id && typeof parsed.agent_id === 'string') {
        return parsed.agent_id;
      }
      if (parsed?.id && typeof parsed.id === 'string') {
        return parsed.id;
      }
    } catch {
      // fall through to dir basename
    }
  }

  return path.basename(agentRoot);
}

export function importAgent(db, agentRoot, sourceType = 'filesystem') {
  const absRoot = path.resolve(agentRoot);
  if (!isDirectory(absRoot)) {
    throw new Error(`agent path is not a directory: ${absRoot}`);
  }

  const agentId = detectAgentId(absRoot);
  const files = collectCanonicalFiles(absRoot);

  db.exec('BEGIN');
  try {
    const agent = registerOrUpdateAgent(db, {
      agentId,
      rootPath: absRoot,
      sourceType,
    });
    upsertAgentFiles(db, agentId, files);
    db.exec('COMMIT');

    return {
      agent,
      files,
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function importAgentsFromDir(db, agentsDir, sourceType = 'filesystem') {
  const absDir = path.resolve(agentsDir);
  if (!isDirectory(absDir)) {
    throw new Error(`agents dir is not a directory: ${absDir}`);
  }

  const entries = fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const imported = [];
  for (const entry of entries) {
    const full = path.join(absDir, entry);
    imported.push(importAgent(db, full, sourceType));
  }

  return imported;
}
