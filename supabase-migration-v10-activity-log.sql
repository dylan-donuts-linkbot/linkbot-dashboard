-- LinkBot Dashboard v10 Migration — Activity Log Enhancement
-- Run this in your Supabase SQL Editor (dashboard.supabase.com → SQL Editor)
--
-- Enhances activity_log with agent, task, status, summary, and metadata fields.
-- Adds auto_created + last_activity_id to tasks.
-- Adds last_activity_at + activity_count to projects.

-- ─────────────────────────────────────────
-- Alter activity_log — add new columns
-- ─────────────────────────────────────────
alter table activity_log add column if not exists agent text not null default 'system';
alter table activity_log add column if not exists task_id uuid references tasks(id) on delete set null;
alter table activity_log add column if not exists status text;      -- 'complete', 'in_progress', 'blocked'
alter table activity_log add column if not exists summary text;     -- one-liner (replaces 'detail' for new entries)
alter table activity_log add column if not exists metadata jsonb;   -- flexible: commit refs, URLs, errors, etc.

-- New indexes
create index if not exists idx_activity_log_task     on activity_log(task_id);
create index if not exists idx_activity_log_agent    on activity_log(agent);
create index if not exists idx_activity_log_created  on activity_log(created_at desc);

-- ─────────────────────────────────────────
-- Alter tasks — auto_created + last_activity_id
-- ─────────────────────────────────────────
alter table tasks add column if not exists auto_created boolean not null default false;
alter table tasks add column if not exists last_activity_id uuid references activity_log(id) on delete set null;

-- ─────────────────────────────────────────
-- Alter projects — activity stats
-- ─────────────────────────────────────────
alter table projects add column if not exists last_activity_at timestamptz;
alter table projects add column if not exists activity_count int not null default 0;

-- ─────────────────────────────────────────
-- Function: keep projects.last_activity_at + activity_count in sync
-- ─────────────────────────────────────────
create or replace function update_project_activity_stats()
returns trigger language plpgsql as $$
begin
  if (NEW.project_id is not null) then
    update projects
    set
      last_activity_at = now(),
      activity_count   = activity_count + 1
    where id = NEW.project_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_project_activity_stats on activity_log;
create trigger trg_project_activity_stats
  after insert on activity_log
  for each row execute function update_project_activity_stats();
