CREATE TABLE IF NOT EXISTS agents (
  agent_id TEXT PRIMARY KEY,
  root_path TEXT NOT NULL,
  source_type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_indexed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id TEXT NOT NULL,
  file_kind TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  absolute_path TEXT NOT NULL,
  hash_sha256 TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  exists_on_disk INTEGER NOT NULL,
  indexed_at TEXT NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE,
  UNIQUE (agent_id, file_kind)
);

CREATE INDEX IF NOT EXISTS idx_agent_files_agent ON agent_files(agent_id, file_kind);
