import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const cli = path.join(root, 'bin', 'agentctl.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aileun-agents-smoke-'));
const runtime = path.join(tmp, 'runtime');
const fixtures = path.join(tmp, 'fixtures', 'agents');
const demo = path.join(fixtures, 'demo');

fs.mkdirSync(demo, { recursive: true });
fs.writeFileSync(path.join(demo, 'agent.json'), JSON.stringify({ agent_id: 'demo' }, null, 2));
fs.writeFileSync(path.join(demo, 'SOUL.md'), '# demo soul\n');
fs.writeFileSync(path.join(demo, 'TOOLS.md'), '# demo tools\n');

function run(args, expect = 0) {
  const res = spawnSync('node', [cli, ...args], {
    cwd: root,
    env: { ...process.env, AILEUN_AGENTS_RUNTIME: runtime },
    encoding: 'utf8',
  });
  if (res.status !== expect) {
    throw new Error(
      `command failed: agentctl ${args.join(' ')}\nstatus=${res.status}\nstdout=${res.stdout}\nstderr=${res.stderr}`,
    );
  }
  return res;
}

try {
  run(['init', '--from', fixtures, '--json']);
  run(['status', '--json']);
  run(['list', '--json']);
  run(['show', 'demo', '--json']);
  run(['files', 'demo', '--json']);
  console.log('smoke: ok');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
