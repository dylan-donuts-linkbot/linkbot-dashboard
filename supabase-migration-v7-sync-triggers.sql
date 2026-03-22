-- LinkBot Dashboard v7 Migration — Local sync triggers
-- Run this in your Supabase SQL Editor (dashboard.supabase.com → SQL Editor)
--
-- Creates Postgres triggers on tasks + projects that auto-populate sync_queue
-- whenever a record is mutated locally (source = 'local').
-- Skips writes that originated from OpenClaw (sync_source = 'openclaw')
-- to prevent echo loops.

-- ─── Trigger function (shared by both tables) ─────────────────────────────────

CREATE OR REPLACE FUNCTION sync_queue_local_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_record_id      UUID;
  v_payload        JSONB;
  v_operation      TEXT;
  v_sync_source    TEXT;
BEGIN
  v_operation := lower(TG_OP);  -- 'insert' | 'update' | 'delete'

  IF TG_OP = 'DELETE' THEN
    v_sync_source := OLD.sync_source;
    v_record_id   := OLD.id;
    v_payload     := to_jsonb(OLD);
  ELSE
    v_sync_source := NEW.sync_source;
    v_record_id   := NEW.id;
    v_payload     := to_jsonb(NEW);
  END IF;

  -- Skip writes that came from OpenClaw — prevents echo loops
  IF v_sync_source = 'openclaw' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO sync_queue (
    table_name,
    record_id,
    operation,
    payload,
    status,
    source,
    idempotency_key
  ) VALUES (
    TG_TABLE_NAME,
    v_record_id,
    v_operation,
    v_payload,
    'pending',
    'local',
    gen_random_uuid()::text
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Triggers ─────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS tasks_sync_queue_trigger ON tasks;
CREATE TRIGGER tasks_sync_queue_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION sync_queue_local_trigger();

DROP TRIGGER IF EXISTS projects_sync_queue_trigger ON projects;
CREATE TRIGGER projects_sync_queue_trigger
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION sync_queue_local_trigger();
