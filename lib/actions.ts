'use server'

import { createServerClient } from '@/lib/supabase-server'
import { Task, Project, TaskStatus, Priority, ProjectStatus } from '@/types'

// ─── Project Actions ───────────────────────────────────────────────────────

export async function createProject(data: {
  name: string
  color: string
  description?: string | null
  status?: ProjectStatus
  github_repo?: string | null
  vercel_project?: string | null
  live_url?: string | null
  stage?: string | null
  prd_content?: string | null
  prd_url?: string | null
  assignees?: string[]
  project_type?: string
  type_config?: Record<string, unknown> | null
  stack_info?: Record<string, unknown> | null
}) {
  const supabase = await createServerClient()
  const { data: project, error } = await supabase
    .from('projects')
    .insert([{
      ...data,
      status: data.status ?? 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return project as Project
}

export async function updateProject(id: string, data: Partial<Omit<Project, 'id' | 'created_at'>>) {
  const supabase = await createServerClient()
  const { data: project, error } = await supabase
    .from('projects')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return project as Project
}

export async function deleteProject(id: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── Task Actions ───────────────────────────────────────────────────────────

export async function createTask(data: {
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: Priority
  project_id?: string | null
  agent_name?: string | null
  assignee?: string | null
  estimated_minutes?: number | null
  due_date?: string | null
  instructions?: string | null
  priority_rank?: number | null
}) {
  const supabase = await createServerClient()
  const { data: task, error } = await supabase
    .from('tasks')
    .insert([{
      ...data,
      status: data.status ?? 'backlog',
      priority: data.priority ?? 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select('*, project:projects(*)')
    .single()

  if (error) throw new Error(error.message)
  return task as Task
}

export async function updateTask(id: string, data: Partial<Omit<Task, 'id' | 'created_at' | 'project'>>) {
  const supabase = await createServerClient()
  const { data: task, error } = await supabase
    .from('tasks')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, project:projects(*)')
    .single()

  if (error) throw new Error(error.message)
  return task as Task
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteTask(id: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function reorderTasks(tasks: { id: string; priority_rank: number }[]) {
  const supabase = await createServerClient()
  const updates = tasks.map(({ id, priority_rank }) =>
    supabase.from('tasks').update({ priority_rank, updated_at: new Date().toISOString() }).eq('id', id)
  )
  await Promise.all(updates)
}
