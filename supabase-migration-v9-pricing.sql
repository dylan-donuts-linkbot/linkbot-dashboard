-- LinkBot Dashboard v9 Migration — Model Pricing Sync System
-- Run this in your Supabase SQL Editor (dashboard.supabase.com → SQL Editor)
--
-- Stores current token pricing per model/provider
-- Enables accurate cost tracking for all AI models used

-- ─────────────────────────────────────────
-- model_pricing table
-- ─────────────────────────────────────────
create table if not exists model_pricing (
  id uuid primary key default uuid_generate_v4(),
  provider text not null, -- 'anthropic', 'openai', 'google', 'openrouter'
  model_id text not null, -- e.g., 'claude-haiku-4-5', 'gpt-4o', 'gemini-2.0-flash'
  model_name text not null, -- Human-readable, e.g., 'Claude 3.5 Haiku'
  input_cost_per_1m_tokens numeric(10, 8) not null, -- e.g., 0.80
  output_cost_per_1m_tokens numeric(10, 8) not null, -- e.g., 4.00
  pricing_version text, -- e.g., '2026-03' for tracking update batches
  last_verified_at timestamptz not null default now(),
  source_url text, -- Link to pricing page
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, model_id)
);

create index if not exists model_pricing_provider_idx on model_pricing(provider);
create index if not exists model_pricing_active_idx on model_pricing(is_active);
create index if not exists model_pricing_updated_idx on model_pricing(updated_at desc);

-- ─────────────────────────────────────────
-- pricing_sync_log table
-- Track when/how pricing updates occur
-- ─────────────────────────────────────────
create table if not exists pricing_sync_log (
  id uuid primary key default uuid_generate_v4(),
  sync_timestamp timestamptz not null default now(),
  status text not null check (status in ('success', 'partial', 'failed')),
  models_updated integer,
  providers_synced text[], -- array of provider names
  error_message text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pricing_sync_log_timestamp_idx on pricing_sync_log(sync_timestamp desc);
create index if not exists pricing_sync_log_status_idx on pricing_sync_log(status);

-- ─────────────────────────────────────────
-- Seed with current pricing (Mar 2026)
-- ─────────────────────────────────────────
insert into model_pricing (provider, model_id, model_name, input_cost_per_1m_tokens, output_cost_per_1m_tokens, pricing_version, source_url) values
  -- Anthropic
  ('anthropic', 'claude-haiku-4-5', 'Claude 3.5 Haiku', 0.80, 4.00, '2026-03', 'https://www.anthropic.com/pricing/claude'),
  ('anthropic', 'claude-sonnet-4-6', 'Claude 4 Sonnet', 3.00, 15.00, '2026-03', 'https://www.anthropic.com/pricing/claude'),
  ('anthropic', 'claude-opus-4-6', 'Claude 4 Opus', 15.00, 75.00, '2026-03', 'https://www.anthropic.com/pricing/claude'),
  
  -- OpenAI
  ('openai', 'gpt-4o', 'GPT-4o', 5.00, 15.00, '2026-03', 'https://openai.com/pricing/'),
  ('openai', 'gpt-4-turbo', 'GPT-4 Turbo', 10.00, 30.00, '2026-03', 'https://openai.com/pricing/'),
  ('openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 0.50, 1.50, '2026-03', 'https://openai.com/pricing/'),
  ('openai', 'o1', 'O1', 15.00, 60.00, '2026-03', 'https://openai.com/pricing/'),
  ('openai', 'o3-mini', 'O3 Mini', 1.00, 4.00, '2026-03', 'https://openai.com/pricing/'),
  
  -- Google
  ('google', 'gemini-2.0-flash', 'Gemini 2.0 Flash', 0.075, 0.30, '2026-03', 'https://cloud.google.com/vertex-ai/pricing'),
  ('google', 'gemini-2.5-pro', 'Gemini 2.5 Pro', 1.50, 6.00, '2026-03', 'https://cloud.google.com/vertex-ai/pricing'),
  
  -- Meta (via OpenRouter)
  ('openrouter', 'meta-llama/llama-3.3-70b-instruct:free', 'Llama 3.3 70B (Free)', 0, 0, '2026-03', 'https://openrouter.ai/docs/models'),
  ('openrouter', 'meta-llama/llama-3.1-70b-instruct', 'Llama 3.1 70B', 0.54, 0.81, '2026-03', 'https://openrouter.ai/docs/models'),
  
  -- DeepSeek
  ('openrouter', 'deepseek/deepseek-chat-v3-0324', 'DeepSeek Chat', 0.14, 0.28, '2026-03', 'https://openrouter.ai/docs/models'),
  
  -- Perplexity (Sonar)
  ('openrouter', 'perplexity/llama-3.1-sonar-large-128k-online', 'Perplexity Sonar', 1.00, 1.00, '2026-03', 'https://openrouter.ai/docs/models')
on conflict (provider, model_id) do update set
  model_name = excluded.model_name,
  input_cost_per_1m_tokens = excluded.input_cost_per_1m_tokens,
  output_cost_per_1m_tokens = excluded.output_cost_per_1m_tokens,
  pricing_version = excluded.pricing_version,
  last_verified_at = now(),
  updated_at = now();

-- ─────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────
alter table model_pricing enable row level security;
alter table pricing_sync_log enable row level security;

create policy "Allow all for anon" on model_pricing for all using (true) with check (true);
create policy "Allow all for anon" on pricing_sync_log for all using (true) with check (true);
