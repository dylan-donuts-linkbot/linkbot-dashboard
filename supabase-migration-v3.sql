-- LinkBot Dashboard v3 Migration — Project HQ
-- Run this in your Supabase SQL Editor (dashboard.supabase.com → SQL Editor)

-- Extended project fields
alter table projects add column if not exists status text not null default 'active' check (status in ('active','paused','archived','complete'));
alter table projects add column if not exists description text;
alter table projects add column if not exists github_repo text;
alter table projects add column if not exists vercel_project text;
alter table projects add column if not exists live_url text;
alter table projects add column if not exists stage text;
alter table projects add column if not exists prd_content text;
alter table projects add column if not exists prd_url text;
alter table projects add column if not exists assignees text[] default '{}';
alter table projects add column if not exists updated_at timestamptz not null default now();
alter table projects add column if not exists is_system boolean not null default false;

-- Extended task fields
alter table tasks add column if not exists assignee text default 'linkbot';
alter table tasks add column if not exists estimated_minutes integer;
alter table tasks add column if not exists due_date date;
alter table tasks add column if not exists instructions text;
alter table tasks add column if not exists priority_rank integer;

-- Seed system projects
insert into projects (name, color, status, is_system, description) values
  ('LinkBot Enhancements', '#8b5cf6', 'active', true, 'Improvements to LinkBot, dashboard, tooling, and automation'),
  ('General / Maintenance', '#6b7280', 'active', true, 'Admin, housekeeping, one-offs with no better home')
on conflict do nothing;

-- RLS for any new tables (token_usage already has it from v2)
