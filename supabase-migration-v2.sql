-- LinkBot Dashboard v2 Migration
-- Run this in your Supabase SQL editor

-- Add agent_name to tasks
alter table tasks add column if not exists agent_name text;

-- Add context/PRD to projects
alter table projects add column if not exists context text;

-- New token_usage table
create table if not exists token_usage (
  id           uuid primary key default uuid_generate_v4(),
  session_id   text,
  input_tokens  integer not null default 0,
  output_tokens integer not null default 0,
  model        text,
  cost_usd     numeric(10, 6),
  created_at   timestamptz not null default now()
);

alter table token_usage enable row level security;

create policy "Allow all for anon" on token_usage
  for all using (true) with check (true);
