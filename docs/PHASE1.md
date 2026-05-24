# Phase 1 Notes

This baseline intentionally stays read-only after index/import and focuses on stable local ledger initialization.

## Data model

- `agents`: one row per indexed agent root
- `agent_files`: canonical tracked files with hash, size, and disk presence
- `schema_migrations`: migration ledger

## Behavior

- `init --from <agents_dir>` scans each child directory as one agent root
- `import <agent_root>` indexes one specific agent root
- Agent id detection precedence:
  1. `agent.json` field `agent_id`
  2. `agent.json` field `id`
  3. directory basename

## Safety

No write-back to source agent directories in Phase 1.
