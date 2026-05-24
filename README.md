# aileun-agents

Phase 1 baseline for AILEUN Agents Manager.

## Scope (Phase 1)

- repo scaffold and local runtime layout
- config model with safe defaults
- SQLite schema migrations
- agent registration/import from existing folder
- canonical profile file hash tracking
- `agentctl` commands:
  - `init [--from <agents_dir>]`
  - `status`
  - `list`
  - `show <agent_id>`
  - `files <agent_id>`
  - `import <agent_root>`
- JSON output (`--json`) for automation
- tests for migration idempotency and file hashing

## Runtime defaults

By default runtime data is stored in `./runtime`.
Override with:

```bash
AILEUN_AGENTS_RUNTIME=/srv/aileun/runtime/agents node bin/agentctl.js init
```

Runtime directory model:

```text
runtime/
├── agents.d/
├── revisions/
├── exports/
├── audit/
└── health/
```

## Quickstart

```bash
npm run format
npm test
npm run build
npm run smoke
```

Try the CLI:

```bash
node bin/agentctl.js init --from /home/rico/.openclaw/agents --json
node bin/agentctl.js status --json
node bin/agentctl.js list --json
node bin/agentctl.js show carmack --json
node bin/agentctl.js files carmack --json
```

## Canonical files tracked in Phase 1

- `agent.json`
- `SOUL.md`
- `IDENTITY.md`
- `TOOLS.md`
- `MEMORY.md`
- `heartbeat.json`
- `permissions.json`
- `skills.json`
- `plugins.json`
- `models.json`

## Out of scope in Phase 1

- revision edit/apply/rollback flows
- daemon/API and Mission Control report API
- systemd packaging
- remote sync/import-export flows
- OpenClaw plugin integration
