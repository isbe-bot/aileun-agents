# AILEUN Agents

> Local-first agent profile ledger with canonical file hashing.

AILEUN Agents is part of the AILEUN local resource management suite: small, auditable tools that sit between OpenClaw, Mission Control, and a VPS runtime.

## Why it exists

Make AI employee/agent identity files inspectable, auditable, and ready for future safe edit/rollback flows.

The design is deliberately local-first:

- **SQLite is the operational ledger** for state, history, and relationships.
- **Canonical files stay portable** for humans, backups, Git, and Mission Control.
- **CLI output can be JSON** so OpenClaw and automation can call it safely.
- **No fake telemetry**: reports come from real local state.
- **No hidden external service dependency**: Phase 1 runs with Node.js 22 and built-in `node:sqlite`.

## Current status

This repository is a **Phase 1 baseline**. It is useful for local VPS bootstrap, validation, and ledger inspection, but the daemon/API/systemd/OpenClaw-plugin phases are intentionally still ahead.

Safety note: **Phase 1 is read-only indexing and hashing. It does not edit agent files.**

## Requirements

- Linux/macOS VPS or workstation
- Node.js `>=22.0.0`
- No npm dependencies required in Phase 1

`node:sqlite` is still marked experimental by Node.js, so commands may print an experimental warning on stderr. The test suite accounts for that.

## Install from source

```bash
git clone git@github-isbe:isbe-bot/aileun-agents.git
cd aileun-agents
npm test
npm run build
```

Optional local symlink:

```bash
mkdir -p ~/.local/bin
ln -sf "$PWD/bin/agentctl.js" ~/.local/bin/agentctl
agentctl --help
```

## VPS runtime layout

By default, runtime data is written to `./runtime` inside the repo for development. For VPS deployment, point the runtime at `/srv/aileun`: 

```bash
export AILEUN_AGENTS_RUNTIME=/srv/aileun/runtime/agents
node bin/agentctl.js init --json
```

Runtime data is intentionally ignored by Git. Back it up separately.

## CLI commands

- `init [--from <agents_dir>]`
- `status`
- `list`
- `show <agent_id>`
- `files <agent_id>`
- `import <agent_root>`

Every operational command supports `--json` for automation. Human-readable output is the default.

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

## SQLite ledger tables

Phase 1 creates the baseline tables needed for future daemon/API and Mission Control integration:

- `agents`
- `agent_files`
- `agent_revisions`
- `agent_events`
- `agent_permissions`
- `agent_skill_bindings`
- `agent_plugin_bindings`
- `agent_model_policies`
- `agent_heartbeat_policies`
- `agent_health_snapshots`

All schemas are applied through deterministic migrations in `migrations/`.

## Repository map

```text
.
├── bin/                 # executable CLI entrypoint
├── migrations/          # SQLite migrations
├── src/                 # CLI, config, DB, resource logic
├── test/                # node:test coverage
├── testdata/            # valid/invalid fixtures where applicable
├── scripts/             # format/build/smoke gates
├── docs/                # deployment/security/phase docs
└── packaging/           # VPS install helper
```

## Deployment posture

Phase 1 is ready to deploy as a CLI/ledger bootstrap tool on a VPS. It is **not yet** a long-running daemon. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Recommended VPS path:

```text
/opt/aileun/aileun-agents/        # source checkout
/srv/aileun/runtime/agents/            # runtime DB/files
/usr/local/bin/agentctl  # symlink to CLI
```

## Testing and quality gates

```bash
npm run format
npm test
npm run build
npm run smoke
```

CI runs the same gates on GitHub Actions.

## Security model

- Do not commit runtime DBs, `.env`, secrets, private keys, or generated logs.
- Runtime directories are ignored by Git.
- Phase 1 only records metadata/definitions; risky mutating behavior is deferred to later phases with explicit approval/audit design.
- See [`docs/SECURITY.md`](docs/SECURITY.md).

## Roadmap

- Phase 2: revision snapshots, diff/propose/apply, rollback.
- Phase 3: permissions, skill/plugin bindings, heartbeat/model policies.
- Phase 4+: daemon/API, Mission Control reports, OpenClaw plugin, packaging.

## License

MIT. See [`LICENSE`](LICENSE).
