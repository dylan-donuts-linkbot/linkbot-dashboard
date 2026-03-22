-- LinkBot Dashboard v4 Migration — Auth-gated RLS
-- Run this in your Supabase SQL Editor (dashboard.supabase.com → SQL Editor)
--
-- Replaces the open "Allow all for anon" policies with policies that require
-- an authenticated session. Only a logged-in user (magic link auth) can read
-- or write any data.

-- ─── projects ────────────────────────────────────────────────────────────────
drop policy if exists "Allow all for anon" on projects;

create policy "Authenticated users only" on projects
  for all
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ─── tasks ───────────────────────────────────────────────────────────────────
drop policy if exists "Allow all for anon" on tasks;

create policy "Authenticated users only" on tasks
  for all
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ─── activity_log ────────────────────────────────────────────────────────────
drop policy if exists "Allow all for anon" on activity_log;

create policy "Authenticated users only" on activity_log
  for all
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ─── sessions ────────────────────────────────────────────────────────────────
drop policy if exists "Allow all for anon" on sessions;

create policy "Authenticated users only" on sessions
  for all
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ─── spend_log ───────────────────────────────────────────────────────────────
drop policy if exists "Allow all for anon" on spend_log;

create policy "Authenticated users only" on spend_log
  for all
  using  (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ─── token_usage (only exists if v2 migration was run) ───────────────────────
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'token_usage') then
    drop policy if exists "Allow all for anon" on token_usage;

    execute $policy$
      create policy "Authenticated users only" on token_usage
        for all
        using  (auth.uid() is not null)
        with check (auth.uid() is not null)
    $policy$;
  end if;
end;
$$;
