export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done'

export interface Project {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  project_id: string | null
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

export interface Metrics {
  sessionCount: number
  tasksCompletedThisWeek: number
  activeProjectsCount: number
  totalSpend: number
  spendByProject: { project: string; amount: number; color: string }[]
}
