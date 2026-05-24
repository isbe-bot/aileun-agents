function asBool(v) {
  return v === 1;
}

export function registerOrUpdateAgent(db, input) {
  const now = new Date().toISOString();
  db.prepare(
    `
      INSERT INTO agents (agent_id, root_path, source_type, status, created_at, updated_at, last_indexed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(agent_id) DO UPDATE SET
        root_path=excluded.root_path,
        source_type=excluded.source_type,
        status=excluded.status,
        updated_at=excluded.updated_at,
        last_indexed_at=excluded.last_indexed_at
    `,
  ).run(input.agentId, input.rootPath, input.sourceType, 'active', now, now, now);

  return {
    agent_id: input.agentId,
    root_path: input.rootPath,
    source_type: input.sourceType,
    status: 'active',
    indexed_at: now,
  };
}

export function upsertAgentFiles(db, agentId, files) {
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `
      INSERT INTO agent_files (
        agent_id,
        file_kind,
        relative_path,
        absolute_path,
        hash_sha256,
        bytes,
        exists_on_disk,
        indexed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(agent_id, file_kind) DO UPDATE SET
        relative_path=excluded.relative_path,
        absolute_path=excluded.absolute_path,
        hash_sha256=excluded.hash_sha256,
        bytes=excluded.bytes,
        exists_on_disk=excluded.exists_on_disk,
        indexed_at=excluded.indexed_at
    `,
  );

  for (const file of files) {
    stmt.run(
      agentId,
      file.kind,
      file.relativePath,
      file.absolutePath,
      file.hash || '',
      file.bytes,
      file.exists ? 1 : 0,
      now,
    );
  }
}

export function listAgents(db) {
  return db
    .prepare(
      `
      SELECT
        agent_id,
        root_path,
        source_type,
        status,
        created_at,
        updated_at,
        last_indexed_at
      FROM agents
      ORDER BY agent_id ASC
    `,
    )
    .all();
}

export function getAgent(db, agentId) {
  return (
    db
      .prepare(
        `
      SELECT
        agent_id,
        root_path,
        source_type,
        status,
        created_at,
        updated_at,
        last_indexed_at
      FROM agents
      WHERE agent_id = ?
    `,
      )
      .get(agentId) || null
  );
}

export function listAgentFiles(db, agentId) {
  return db
    .prepare(
      `
      SELECT
        file_kind,
        relative_path,
        absolute_path,
        hash_sha256,
        bytes,
        exists_on_disk,
        indexed_at
      FROM agent_files
      WHERE agent_id = ?
      ORDER BY file_kind ASC
    `,
    )
    .all(agentId)
    .map((row) => ({
      ...row,
      exists_on_disk: asBool(row.exists_on_disk),
      hash_sha256: row.hash_sha256 || null,
    }));
}

export function getStats(db) {
  const row = db.prepare('SELECT COUNT(1) AS total_agents FROM agents').get();
  const files = db.prepare('SELECT COUNT(1) AS total_files FROM agent_files').get();

  return {
    total_agents: row.total_agents,
    total_files: files.total_files,
  };
}
