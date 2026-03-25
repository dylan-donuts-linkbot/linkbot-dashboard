-- LinkBot Dashboard v8 Migration — Project Types System
-- Run this in your Supabase SQL Editor (dashboard.supabase.com → SQL Editor)
--
-- Adds project_type and type_config columns to projects table
-- Supports: web_app, ios_app, macos_app, ecommerce, pipeline, content
-- Removes crypto project type support

-- ─────────────────────────────────────────
-- Create project_type enum
-- ─────────────────────────────────────────
do $$
begin
  create type project_type_enum as enum (
    'web_app',
    'ios_app', 
    'macos_app',
    'ecommerce',
    'pipeline',
    'content'
  );
exception when duplicate_object then
  null;
end $$;

-- ─────────────────────────────────────────
-- Add columns to projects table
-- ─────────────────────────────────────────
alter table projects add column if not exists project_type project_type_enum default 'web_app';
alter table projects add column if not exists type_config jsonb default '{}';
alter table projects add column if not exists stack_info jsonb default '{}';

-- ─────────────────────────────────────────
-- Default configurations for each type
-- ─────────────────────────────────────────

-- Web App defaults
alter table projects add column if not exists default_type_config_web_app jsonb 
  default '{
    "ui_library": "tailwind_shadcn",
    "auth_method": "supabase",
    "database": "supabase",
    "deployment": "vercel",
    "analytics_enabled": true,
    "api_rate_limiting": true
  }'::jsonb;

-- iOS App defaults
alter table projects add column if not exists default_type_config_ios_app jsonb
  default '{
    "ui_framework": "swiftui",
    "backend": "supabase",
    "auth_method": "supabase",
    "local_persistence": "core_data",
    "push_notifications": false,
    "app_store_distribution": true,
    "ipad_support": false
  }'::jsonb;

-- MacOS App defaults
alter table projects add column if not exists default_type_config_macos_app jsonb
  default '{
    "ui_framework": "swiftui",
    "backend": "supabase",
    "distribution": "direct_download",
    "file_handling": "none",
    "menu_bar_app": false,
    "code_signing": false
  }'::jsonb;

-- E-commerce defaults
alter table projects add column if not exists default_type_config_ecommerce jsonb
  default '{
    "backend": "supabase_stripe",
    "payment": "stripe",
    "shipping": "none",
    "multi_currency": false,
    "cms": "supabase"
  }'::jsonb;

-- Pipeline/Scraper defaults
alter table projects add column if not exists default_type_config_pipeline jsonb
  default '{
    "scheduler": "vercel_cron",
    "data_sources": ["api"],
    "frequency": "daily",
    "retry_policy": "exponential_backoff",
    "alerting": "dashboard"
  }'::jsonb;

-- Content/Marketing defaults
alter table projects add column if not exists default_type_config_content jsonb
  default '{
    "cms": "markdown",
    "blog_enabled": true,
    "search_enabled": false,
    "comments": "none",
    "newsletter": false
  }'::jsonb;

-- ─────────────────────────────────────────
-- Helpful function to get default config
-- ─────────────────────────────────────────
create or replace function get_project_type_defaults(ptype project_type_enum)
returns jsonb as $$
select case ptype
  when 'web_app'::project_type_enum then
    '{"ui_library":"tailwind_shadcn","auth_method":"supabase","database":"supabase","deployment":"vercel","analytics_enabled":true,"api_rate_limiting":true}'::jsonb
  when 'ios_app'::project_type_enum then
    '{"ui_framework":"swiftui","backend":"supabase","auth_method":"supabase","local_persistence":"core_data","push_notifications":false,"app_store_distribution":true,"ipad_support":false}'::jsonb
  when 'macos_app'::project_type_enum then
    '{"ui_framework":"swiftui","backend":"supabase","distribution":"direct_download","file_handling":"none","menu_bar_app":false,"code_signing":false}'::jsonb
  when 'ecommerce'::project_type_enum then
    '{"backend":"supabase_stripe","payment":"stripe","shipping":"none","multi_currency":false,"cms":"supabase"}'::jsonb
  when 'pipeline'::project_type_enum then
    '{"scheduler":"vercel_cron","data_sources":["api"],"frequency":"daily","retry_policy":"exponential_backoff","alerting":"dashboard"}'::jsonb
  when 'content'::project_type_enum then
    '{"cms":"markdown","blog_enabled":true,"search_enabled":false,"comments":"none","newsletter":false}'::jsonb
  else '{}'::jsonb
end;
$$ language sql immutable;

-- ─────────────────────────────────────────
-- Create project_type_agents lookup
-- ─────────────────────────────────────────
create table if not exists project_type_agents (
  type project_type_enum primary key,
  default_agent text not null,
  suggested_agents text[] not null,
  purpose text not null
);

-- Seed agent assignments
insert into project_type_agents (type, default_agent, suggested_agents, purpose) values
  ('web_app', 'claude_code', '{"claude_code","codex"}', 'Building UI, features, API routes'),
  ('ios_app', 'claude_code', '{"claude_code"}', 'Swift/SwiftUI development, iOS-specific features'),
  ('macos_app', 'claude_code', '{"claude_code"}', 'Swift/SwiftUI macOS development, desktop features'),
  ('ecommerce', 'claude_code', '{"claude_code","codex"}', 'Product pages, checkout flow, admin dashboard'),
  ('pipeline', 'claude_code', '{"claude_code"}', 'Scraper logic, ETL, job scheduling'),
  ('content', 'claude_code', '{"claude_code"}', 'Content management, page creation, SEO')
on conflict (type) do update set
  default_agent = excluded.default_agent,
  suggested_agents = excluded.suggested_agents,
  purpose = excluded.purpose;

-- ─────────────────────────────────────────
-- Update existing projects to web_app type
-- (safe default for current projects)
-- ─────────────────────────────────────────
-- update projects set project_type = 'web_app'::project_type_enum where project_type is null;
-- update projects set type_config = get_project_type_defaults('web_app'::project_type_enum) where type_config = '{}';
