export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done'
export type ProjectStatus = 'active' | 'paused' | 'archived' | 'complete'
export type ProjectType = 'web_app' | 'ios_app' | 'macos_app' | 'ecommerce' | 'pipeline' | 'content'

export interface Project {
  id: string
  name: string
  color: string
  context?: string | null
  // v3 fields
  status?: ProjectStatus
  description?: string | null
  github_repo?: string | null
  vercel_project?: string | null
  live_url?: string | null
  stage?: string | null
  prd_content?: string | null
  prd_url?: string | null
  assignees?: string[]
  is_system?: boolean
  // v8 project type fields
  project_type?: ProjectType
  type_config?: Record<string, unknown> | null
  stack_info?: Record<string, unknown> | null
  // v6 sync fields
  external_id?: string | null
  sync_source?: string | null
  last_synced_at?: string | null
  sync_status?: string | null
  created_at: string
  updated_at?: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  project_id: string | null
  agent_name?: string | null
  // v3 fields
  assignee?: string | null
  estimated_minutes?: number | null
  due_date?: string | null
  instructions?: string | null
  priority_rank?: number | null
  // v6 sync fields
  external_id?: string | null
  sync_source?: string | null
  last_synced_at?: string | null
  sync_status?: string | null
  // v10 activity fields
  auto_created?: boolean
  last_activity_id?: string | null
  created_at: string
  updated_at: string
  project?: Project
}

export interface ActivityLog {
  id: string
  agent: string
  action: string
  summary: string | null
  detail: string | null           // legacy field — may be null on new entries
  status: string | null           // 'complete' | 'in_progress' | 'blocked'
  task_id: string | null
  project_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  project?: Project
  task?: Task
}

export interface Session {
  id: string
  started_at: string
  ended_at: string | null
  model: string | null
  notes: string | null
}

export interface SpendLog {
  id: string
  amount: number
  description: string | null
  project_id: string | null
  created_at: string
  project?: Project
}

export type SyncOperation = 'insert' | 'update' | 'delete'
export type SyncStatus = 'pending' | 'processed' | 'failed'
export type SyncSource = 'local' | 'openclaw'

export interface SyncQueueItem {
  id: string
  table_name: string
  record_id: string
  operation: SyncOperation
  payload: Record<string, unknown> | null
  status: SyncStatus
  source: SyncSource
  idempotency_key: string | null
  retry_count: number
  error_message: string | null
  created_at: string
  processed_at: string | null
}

export interface AgentLog {
  id: string
  project_id: string | null
  task_id: string | null
  agent: string
  action: string
  summary: string
  metadata: Record<string, unknown> | null
  created_at: string
  project?: Project
  task?: Task
}

export interface TokenUsage {
  id: string
  session_id: string | null
  input_tokens: number
  output_tokens: number
  model: string | null
  provider: string | null   // 'anthropic' | 'openrouter' — first segment of model string
  project_id: string | null
  cost_usd: number | null
  created_at: string
}

export interface TokenUsageStats {
  totalInput: number
  totalOutput: number
  totalCost: number
  model: string | null
  dailyBars: { date: string; input: number; output: number }[]
}

export interface Metrics {
  sessionCount: number
  tasksCompletedThisWeek: number
  activeProjectsCount: number
  totalSpend: number
  spendByProject: { project: string; amount: number; color: string }[]
  tokenUsage: TokenUsageStats
}
