-- LinkBot Dashboard v5 Migration — Token usage project attribution
-- Run this in your Supabase SQL Editor (dashboard.supabase.com → SQL Editor)
--
-- Adds project_id to token_usage so costs can be attributed per project,
-- and adds a provider column derived from the model string for easy grouping.

alter table token_usage
  add column if not exists project_id uuid references projects(id) on delete set null,
  add column if not exists provider   text; -- e.g. 'anthropic', 'openrouter', 'google'

create index if not exists token_usage_project_idx  on token_usage(project_id);
create index if not exists token_usage_provider_idx on token_usage(provider);
create index if not exists token_usage_created_idx  on token_usage(created_at desc);
