import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const CANONICAL_FILES = [
  { kind: 'agent_json', relativePath: 'agent.json' },
  { kind: 'soul_md', relativePath: 'SOUL.md' },
  { kind: 'identity_md', relativePath: 'IDENTITY.md' },
  { kind: 'tools_md', relativePath: 'TOOLS.md' },
  { kind: 'memory_md', relativePath: 'MEMORY.md' },
  { kind: 'heartbeat_json', relativePath: 'heartbeat.json' },
  { kind: 'permissions_json', relativePath: 'permissions.json' },
  { kind: 'skills_json', relativePath: 'skills.json' },
  { kind: 'plugins_json', relativePath: 'plugins.json' },
  { kind: 'models_json', relativePath: 'models.json' },
];

export function sha256File(absPath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(absPath));
  return hash.digest('hex');
}

export function collectCanonicalFiles(agentRoot) {
  return CANONICAL_FILES.map((def) => {
    const absolutePath = path.join(agentRoot, def.relativePath);
    if (!fs.existsSync(absolutePath)) {
      return {
        kind: def.kind,
        relativePath: def.relativePath,
        absolutePath,
        hash: null,
        bytes: 0,
        exists: false,
      };
    }

    const stat = fs.statSync(absolutePath);
    return {
      kind: def.kind,
      relativePath: def.relativePath,
      absolutePath,
      hash: sha256File(absolutePath),
      bytes: stat.size,
      exists: true,
    };
  });
}
