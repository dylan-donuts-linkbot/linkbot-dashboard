-- LinkBot Dashboard v6 Migration — Sync infrastructure
-- Run this in your Supabase SQL Editor (dashboard.supabase.com → SQL Editor)
--
-- Adds sync tracking columns to tasks + projects,
-- and creates sync_queue + agent_logs tables.

-- ─── tasks: sync columns ──────────────────────────────────────────────────────

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS external_id    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS sync_source    TEXT NOT NULL DEFAULT 'local',  -- 'local' | 'openclaw'
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status    TEXT NOT NULL DEFAULT 'local';  -- 'local' | 'synced' | 'pending' | 'conflict'

CREATE INDEX IF NOT EXISTS tasks_external_id_idx ON tasks(external_id);
CREATE INDEX IF NOT EXISTS tasks_sync_status_idx  ON tasks(sync_status);

-- ─── projects: sync columns ───────────────────────────────────────────────────

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS external_id    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS sync_source    TEXT NOT NULL DEFAULT 'local',  -- 'local' | 'openclaw'
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status    TEXT NOT NULL DEFAULT 'local';  -- 'local' | 'synced' | 'pending' | 'conflict'

CREATE INDEX IF NOT EXISTS projects_external_id_idx ON projects(external_id);
CREATE INDEX IF NOT EXISTS projects_sync_status_idx  ON projects(sync_status);

-- ─── sync_queue ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sync_queue (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name       TEXT        NOT NULL,
  record_id        UUID        NOT NULL,
  operation        TEXT        NOT NULL,         -- 'insert' | 'update' | 'delete'
  payload          JSONB,
  status           TEXT        NOT NULL DEFAULT 'pending', -- 'pending' | 'processed' | 'failed'
  source           TEXT        NOT NULL,         -- 'local' | 'openclaw'
  idempotency_key  TEXT        UNIQUE,
  retry_count      INT         NOT NULL DEFAULT 0,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS sync_queue_status_idx     ON sync_queue(status);
CREATE INDEX IF NOT EXISTS sync_queue_table_idx      ON sync_queue(table_name);
CREATE INDEX IF NOT EXISTS sync_queue_created_idx    ON sync_queue(created_at DESC);

ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users only" ON sync_queue
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ─── agent_logs ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID        REFERENCES projects(id) ON DELETE CASCADE,
  task_id    UUID        REFERENCES tasks(id) ON DELETE SET NULL,
  agent      TEXT        NOT NULL,  -- 'openclaw' | 'discovery' | 'design' | 'dev' | etc.
  action     TEXT        NOT NULL,
  summary    TEXT        NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_logs_project_idx  ON agent_logs(project_id);
CREATE INDEX IF NOT EXISTS agent_logs_task_idx     ON agent_logs(task_id);
CREATE INDEX IF NOT EXISTS agent_logs_agent_idx    ON agent_logs(agent);
CREATE INDEX IF NOT EXISTS agent_logs_created_idx  ON agent_logs(created_at DESC);

ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users only" ON agent_logs
  FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
