import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const cli = path.join(root, 'bin', 'agentctl.js');

function run(runtime, args, expectStatus = 0) {
  const res = spawnSync('node', [cli, ...args], {
    cwd: root,
    env: { ...process.env, AILEUN_AGENTS_RUNTIME: runtime },
    encoding: 'utf8',
  });
  assert.equal(res.status, expectStatus, `agentctl ${args.join(' ')} failed: ${res.stderr}`);
  return res;
}

test('CLI lifecycle: init --from -> list/show/files/status', () => {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'aileun-agents-cli-test-'));
  const runtime = path.join(tmpBase, 'runtime');
  const source = path.join(tmpBase, 'source', 'agents');
  const demo = path.join(source, 'demo');

  fs.mkdirSync(demo, { recursive: true });
  fs.writeFileSync(path.join(demo, 'agent.json'), JSON.stringify({ agent_id: 'demo' }, null, 2));
  fs.writeFileSync(path.join(demo, 'SOUL.md'), '# demo soul\n');

  try {
    const init = run(runtime, ['init', '--from', source, '--json']);
    const initObj = JSON.parse(init.stdout);
    assert.equal(initObj.ok, true);
    assert.equal(initObj.imported.count, 1);
    assert.deepEqual(initObj.imported.agent_ids, ['demo']);

    const status = run(runtime, ['status', '--json']);
    const statusObj = JSON.parse(status.stdout);
    assert.equal(statusObj.stats.total_agents, 1);
    assert.ok(statusObj.stats.total_files >= 10);

    const list = run(runtime, ['list', '--json']);
    const listObj = JSON.parse(list.stdout);
    assert.equal(listObj.count, 1);
    assert.equal(listObj.agents[0].agent_id, 'demo');

    const show = run(runtime, ['show', 'demo', '--json']);
    const showObj = JSON.parse(show.stdout);
    assert.equal(showObj.agent.agent_id, 'demo');
    assert.equal(showObj.files.length, 10);

    const files = run(runtime, ['files', 'demo', '--json']);
    const filesObj = JSON.parse(files.stdout);
    assert.equal(filesObj.agent_id, 'demo');
    assert.equal(filesObj.count, 10);

    const miss = run(runtime, ['show', 'missing', '--json'], 3);
    const missObj = JSON.parse(miss.stderr);
    assert.equal(missObj.ok, false);
  } finally {
    fs.rmSync(tmpBase, { recursive: true, force: true });
  }
});
