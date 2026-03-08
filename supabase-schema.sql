-- LinkBot Dashboard - Supabase Schema
-- Run this in your Supabase SQL Editor (dashboard.supabase.com → SQL Editor)

-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────
create table if not exists projects (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  color      text not null default '#3b82f6',
  created_at timestamptz not null default now()
);

-- Seed with Dylan's active projects
insert into projects (name, color) values
  ('Coin Launch',    '#f59e0b'),
  ('E-commerce 1',  '#3b82f6')
on conflict do nothing;

-- ─────────────────────────────────────────
-- tasks
-- ─────────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  status      text not null default 'backlog'
              check (status in ('backlog', 'in_progress', 'in_review', 'done')),
  priority    text not null default 'medium'
              check (priority in ('low', 'medium', 'high', 'urgent')),
  project_id  uuid references projects(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists tasks_status_idx      on tasks(status);
create index if not exists tasks_project_id_idx  on tasks(project_id);

-- ─────────────────────────────────────────
-- activity_log
-- ─────────────────────────────────────────
create table if not exists activity_log (
  id         uuid primary key default uuid_generate_v4(),
  action     text not null,
  detail     text,
  project_id uuid references projects(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_idx on activity_log(created_at desc);

-- ─────────────────────────────────────────
-- sessions
-- ─────────────────────────────────────────
create table if not exists sessions (
  id         uuid primary key default uuid_generate_v4(),
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  model      text,
  notes      text
);

-- ─────────────────────────────────────────
-- spend_log
-- ─────────────────────────────────────────
create table if not exists spend_log (
  id          uuid primary key default uuid_generate_v4(),
  amount      numeric(10, 2) not null,
  description text,
  project_id  uuid references projects(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists spend_log_project_idx on spend_log(project_id);

-- ─────────────────────────────────────────
-- Row Level Security (RLS)
-- Enable RLS and allow anon key full access
-- (tighten this once you add auth)
-- ─────────────────────────────────────────
alter table projects     enable row level security;
alter table tasks        enable row level security;
alter table activity_log enable row level security;
alter table sessions     enable row level security;
alter table spend_log    enable row level security;

-- Allow all operations for anon (public dashboard, no auth yet)
create policy "Allow all for anon" on projects     for all using (true) with check (true);
create policy "Allow all for anon" on tasks        for all using (true) with check (true);
create policy "Allow all for anon" on activity_log for all using (true) with check (true);
create policy "Allow all for anon" on sessions     for all using (true) with check (true);
create policy "Allow all for anon" on spend_log    for all using (true) with check (true);
