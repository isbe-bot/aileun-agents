import path from 'node:path';

export function loadConfig(overrides = {}) {
  const cwd = process.cwd();
  const runtimeDir =
    overrides.runtimeDir || process.env.AILEUN_AGENTS_RUNTIME || path.join(cwd, 'runtime');

  return {
    runtimeDir,
    dbPath: path.join(runtimeDir, 'agents.sqlite'),
    agentsDir: path.join(runtimeDir, 'agents.d'),
    revisionsDir: path.join(runtimeDir, 'revisions'),
    exportsDir: path.join(runtimeDir, 'exports'),
    auditDir: path.join(runtimeDir, 'audit'),
    healthDir: path.join(runtimeDir, 'health'),
  };
}
