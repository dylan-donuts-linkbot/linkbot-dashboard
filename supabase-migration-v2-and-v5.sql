-- LinkBot Dashboard: v2 + v5 combined migration
-- Run this if you have NOT run v2 yet (token_usage table does not exist).
-- Safe to run multiple times — uses IF NOT EXISTS throughout.

-- v2: token_usage table
create table if not exists token_usage (
  id            uuid primary key default uuid_generate_v4(),
  session_id    text,
  input_tokens  integer not null default 0,
  output_tokens integer not null default 0,
  model         text,
  cost_usd      numeric(10, 6),
  created_at    timestamptz not null default now()
);

alter table token_usage enable row level security;

-- RLS: authenticated users only (matches v4 policy pattern)
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'token_usage' and policyname = 'Authenticated users only'
  ) then
    execute $p$
      create policy "Authenticated users only" on token_usage
        for all using (auth.uid() is not null) with check (auth.uid() is not null)
    $p$;
  end if;
end $$;

-- v5: add project attribution and provider columns
alter table token_usage
  add column if not exists project_id uuid references projects(id) on delete set null,
  add column if not exists provider   text;

create index if not exists token_usage_project_idx  on token_usage(project_id);
create index if not exists token_usage_provider_idx on token_usage(provider);
create index if not exists token_usage_created_idx  on token_usage(created_at desc);
