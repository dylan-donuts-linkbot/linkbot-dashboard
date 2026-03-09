export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done'

export interface Project {
  id: string
  name: string
  color: string
  context?: string | null
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  project_id: string | null
  agent_name?: string | null
  created_at: string
  updated_at: string
  project?: Project
}

export interface ActivityLog {
  id: string
  action: string
  detail: string | null
  project_id: string | null
  created_at: string
  project?: Project
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

export interface TokenUsage {
  id: string
  session_id: string | null
  input_tokens: number
  output_tokens: number
  model: string | null
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
