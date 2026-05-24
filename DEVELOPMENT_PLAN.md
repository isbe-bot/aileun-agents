# AILEUN Agents Manager Development Plan (Phase 1 Baseline)

Status: implemented baseline

## Delivered in this phase

- Repository scaffold with `agentctl` CLI
- Local-first runtime/config model with `AILEUN_AGENTS_RUNTIME` override
- SQLite migration framework and initial schema
- Agent import/index from existing filesystem directories
- Canonical profile file hash indexing (SHA-256)
- Read-only CLI surface: `init`, `status`, `list`, `show`, `files`, `import`
- Structured JSON output for automation with `--json`
- Tests covering migration idempotency, file hashing, and CLI lifecycle

## Deferred to later phases

- Propose/apply edit workflow
- Revision and rollback controls
- Daemon/API
- OpenClaw plugin
- systemd/package/deployment concerns
