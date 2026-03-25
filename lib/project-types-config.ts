/**
 * Project Types Configuration
 * Defines all supported project types, their agents, and default configurations
 */

import { ProjectType } from '@/types'

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  web_app: 'Web App',
  ios_app: 'iOS Mobile App',
  macos_app: 'MacOS App',
  ecommerce: 'E-commerce Site',
  pipeline: 'Data Pipeline / Scraper',
  content: 'Content / Marketing Site',
}

export const PROJECT_TYPE_DESCRIPTIONS: Record<ProjectType, string> = {
  web_app: 'SaaS products, customer-facing web applications (Next.js + Supabase + Vercel)',
  ios_app: 'Native iOS applications for iPhone/iPad (Swift + SwiftUI)',
  macos_app: 'Native macOS desktop applications (Swift + SwiftUI)',
  ecommerce: 'Product catalogs, shopping carts, payments, inventory management',
  pipeline: 'ETL workflows, periodic data collection, scraping, transformations',
  content: 'Blogs, documentation, landing pages, static and dynamic content sites',
}

export const PROJECT_TYPE_COLORS: Record<ProjectType, string> = {
  web_app: '#3b82f6',     // blue
  ios_app: '#000000',     // black (Apple color)
  macos_app: '#666666',   // gray (Apple color)
  ecommerce: '#10b981',   // emerald
  pipeline: '#8b5cf6',    // violet
  content: '#f59e0b',     // amber
}

export const PROJECT_TYPE_AGENTS: Record<
  ProjectType,
  { default: string; suggested: string[]; purpose: string }
> = {
  web_app: {
    default: 'claude_code',
    suggested: ['claude_code', 'codex'],
    purpose: 'Building UI, features, API routes',
  },
  ios_app: {
    default: 'claude_code',
    suggested: ['claude_code'],
    purpose: 'Swift/SwiftUI development, iOS-specific features',
  },
  macos_app: {
    default: 'claude_code',
    suggested: ['claude_code'],
    purpose: 'Swift/SwiftUI macOS development, desktop features',
  },
  ecommerce: {
    default: 'claude_code',
    suggested: ['claude_code', 'codex'],
    purpose: 'Product pages, checkout flow, admin dashboard',
  },
  pipeline: {
    default: 'claude_code',
    suggested: ['claude_code'],
    purpose: 'Scraper logic, ETL, job scheduling',
  },
  content: {
    default: 'claude_code',
    suggested: ['claude_code'],
    purpose: 'Content management, page creation, SEO',
  },
}

export const DEFAULT_TYPE_CONFIGS: Record<ProjectType, Record<string, unknown>> = {
  web_app: {
    ui_library: 'tailwind_shadcn',
    auth_method: 'supabase',
    database: 'supabase',
    deployment: 'vercel',
    analytics_enabled: true,
    api_rate_limiting: true,
  },
  ios_app: {
    ui_framework: 'swiftui',
    backend: 'supabase',
    auth_method: 'supabase',
    local_persistence: 'core_data',
    push_notifications: false,
    app_store_distribution: true,
    ipad_support: false,
  },
  macos_app: {
    ui_framework: 'swiftui',
    backend: 'supabase',
    distribution: 'direct_download',
    file_handling: 'none',
    menu_bar_app: false,
    code_signing: false,
  },
  ecommerce: {
    backend: 'supabase_stripe',
    payment: 'stripe',
    shipping: 'none',
    multi_currency: false,
    cms: 'supabase',
  },
  pipeline: {
    scheduler: 'vercel_cron',
    data_sources: ['api'],
    frequency: 'daily',
    retry_policy: 'exponential_backoff',
    alerting: 'dashboard',
  },
  content: {
    cms: 'markdown',
    blog_enabled: true,
    search_enabled: false,
    comments: 'none',
    newsletter: false,
  },
}

export const DEFAULT_STACK_INFO: Record<ProjectType, Record<string, unknown>> = {
  web_app: {
    frontend: 'Next.js 16 + React 19 + Tailwind + shadcn/ui',
    backend: 'Supabase (postgres + realtime)',
    hosting: 'Vercel',
    ci_cd: 'GitHub Actions',
  },
  ios_app: {
    language: 'Swift 6',
    ui: 'SwiftUI',
    backend: 'Supabase SDK',
    local_storage: 'Core Data',
    distribution: 'Apple App Store',
  },
  macos_app: {
    language: 'Swift 6',
    ui: 'SwiftUI',
    backend: 'Supabase SDK (optional)',
    distribution: 'Direct download + notarization',
    code_signing: 'Apple Developer certificate',
  },
  ecommerce: {
    frontend: 'Next.js 16 + Tailwind CSS',
    backend: 'Supabase + Stripe',
    payments: 'Stripe',
    hosting: 'Vercel',
  },
  pipeline: {
    runtime: 'Node.js + TypeScript',
    scheduler: 'Vercel Cron or AWS Lambda',
    storage: 'Supabase + S3',
    monitoring: 'Logging to Supabase + alerts',
  },
  content: {
    framework: 'Next.js 16 (static + dynamic)',
    cms: 'Markdown + Supabase',
    styling: 'Tailwind CSS v4',
    hosting: 'Vercel (with ISR)',
  },
}

/**
 * Get the human-friendly label for a project type
 */
export function getProjectTypeLabel(type: ProjectType): string {
  return PROJECT_TYPE_LABELS[type] || 'Unknown'
}

/**
 * Get all available project types
 */
export function getAllProjectTypes(): ProjectType[] {
  return Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]
}

/**
 * Get default configuration for a project type
 */
export function getDefaultTypeConfig(type: ProjectType): Record<string, unknown> {
  return { ...DEFAULT_TYPE_CONFIGS[type] }
}

/**
 * Get default stack info for a project type
 */
export function getDefaultStackInfo(type: ProjectType): Record<string, unknown> {
  return { ...DEFAULT_STACK_INFO[type] }
}
