import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { collectCanonicalFiles, sha256File } from '../src/agents/files.js';

function digest(text) {
  return crypto.createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
}

test('sha256File returns deterministic hash and collectCanonicalFiles marks missing/present', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aileun-agents-hash-'));

  try {
    const soul = path.join(tmp, 'SOUL.md');
    fs.writeFileSync(soul, 'hello soul\n');

    const hash = sha256File(soul);
    assert.equal(hash, digest('hello soul\n'));

    const files = collectCanonicalFiles(tmp);
    const soulEntry = files.find((f) => f.kind === 'soul_md');
    assert.ok(soulEntry);
    assert.equal(soulEntry.exists, true);
    assert.equal(soulEntry.hash, digest('hello soul\n'));

    const identity = files.find((f) => f.kind === 'identity_md');
    assert.ok(identity);
    assert.equal(identity.exists, false);
    assert.equal(identity.hash, null);
    assert.equal(identity.bytes, 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
