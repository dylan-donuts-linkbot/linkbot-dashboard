'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, Project, TaskStatus, Priority } from '@/types'
import { supabase } from '@/lib/supabase'
import { updateTask, deleteTask } from '@/lib/actions'
import TaskCard from '@/components/tasks/TaskCard'
import TaskModal from '@/components/tasks/TaskModal'
import QuickAddTask from '@/components/tasks/QuickAddTask'
import DailyPriorityStack from '@/components/tasks/DailyPriorityStack'
import EmptyState from '@/components/shared/EmptyState'
import StatusBadge from '@/components/shared/StatusBadge'
import { useRouter } from 'next/navigation'

type FilterStatus = 'all' | TaskStatus
type SortBy = 'priority_rank' | 'due_date' | 'created_at' | 'priority'

export default function MyTasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null | undefined>(undefined)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterProject, setFilterProject] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortBy>('priority_rank')

  const loadData = useCallback(async () => {
    setLoadError(null)
    try {
      const [{ data: tasksData }, { data: projectsData }] = await Promise.all([
        supabase.from('tasks')
          .select('*, project:projects(*)')
          .eq('assignee', 'dylan')
          .order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
      ])
      setTasks((tasksData as Task[]) ?? [])
      setProjects((projectsData as Project[]) ?? [])
    } catch (error) {
      console.error('Failed to load tasks:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const priorityTasks = tasks
    .filter(t => t.status !== 'done' && t.priority_rank != null)
    .sort((a, b) => (a.priority_rank ?? 999) - (b.priority_rank ?? 999))
    .slice(0, 3)

  let filtered = tasks
  if (filterStatus !== 'all') {
    filtered = filtered.filter(t => t.status === filterStatus)
  }
  if (filterProject !== 'all') {
    filtered = filtered.filter(t => t.project_id === filterProject)
  }

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'priority_rank') {
      const aRank = a.priority_rank ?? 9999
      const bRank = b.priority_rank ?? 9999
      return aRank - bRank
    }
    if (sortBy === 'due_date') {
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    }
    if (sortBy === 'priority') {
      const order: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
      return (order[a.priority] ?? 4) - (order[b.priority] ?? 4)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const statusCounts: Record<string, number> = {
    all: tasks.length,
    backlog: tasks.filter(t => t.status === 'backlog').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    in_review: tasks.filter(t => t.status === 'in_review').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  async function handleSaveTask(data: Partial<Task>) {
    setMutationError(null)
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data)
      }
      await loadData()
      router.refresh()
    } catch (error) {
      console.error('Failed to save task:', error)
      setMutationError(error instanceof Error ? error.message : 'Failed to save task')
    }
  }

  async function handleDeleteTask() {
    if (!editingTask) return
    setMutationError(null)
    try {
      await deleteTask(editingTask.id)
      await loadData()
      router.refresh()
    } catch (error) {
      console.error('Failed to delete task:', error)
      setMutationError(error instanceof Error ? error.message : 'Failed to delete task')
    }
  }

  async function handleMarkComplete(task: Task) {
    setMutationError(null)
    try {
      const newStatus: TaskStatus = task.status === 'done' ? 'backlog' : 'done'
      await updateTask(task.id, { status: newStatus })
      await loadData()
      router.refresh()
    } catch (error) {
      console.error('Failed to update task status:', error)
      setMutationError(error instanceof Error ? error.message : 'Failed to update task')
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading tasks...</div>
      </div>
    )
  }

  return (
    <div>
      {loadError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', marginBottom: '16px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '7px', fontSize: '13px', color: '#f87171',
        }}>
          <span>⚠</span>
          <span style={{ flex: 1 }}>{loadError}</span>
          <button onClick={loadData} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
            Retry
          </button>
        </div>
      )}
      {mutationError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', marginBottom: '16px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '7px', fontSize: '13px', color: '#f87171',
        }}>
          <span>⚠</span>
          <span style={{ flex: 1 }}>{mutationError}</span>
          <button onClick={() => setMutationError(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '16px', padding: 0 }}>
            ×
          </button>
        </div>
      )}
      {/* Header */}
      <div className="page-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>My Tasks</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>{tasks.filter(t => t.status !== 'done').length} open tasks</p>
        </div>
        <QuickAddTask projects={projects} onAdded={loadData} />
      </div>

      {/* Daily priority stack */}
      {priorityTasks.length > 0 && (
        <DailyPriorityStack
          tasks={priorityTasks}
          onTaskClick={setEditingTask}
        />
      )}

      {/* Filters */}
      <div className="tasks-filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Status filter */}
        <div className="tasks-status-pills" style={{ display: 'flex', gap: '4px' }}>
          {(['all', 'backlog', 'in_progress', 'in_review', 'done'] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 500,
                background: filterStatus === f ? 'var(--bg-active)' : 'transparent',
                color: filterStatus === f ? 'var(--text-primary)' : 'var(--text-muted)',
                border: filterStatus === f ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                textTransform: f === 'all' ? 'capitalize' : 'none',
              }}
            >
              {f === 'all' ? 'All' : <StatusBadge status={f} size="sm" />}
              <span style={{ marginLeft: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                {statusCounts[f] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '20px', background: 'var(--bg-active)' }} />

        {/* Project filter */}
        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '12px',
            color: 'var(--text-light)',
            outline: 'none',
          }}
        >
          <option value="all">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortBy)}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '12px',
            color: 'var(--text-light)',
            outline: 'none',
          }}
        >
          <option value="priority_rank">Sort: Priority Rank</option>
          <option value="due_date">Sort: Due Date</option>
          <option value="priority">Sort: Priority Level</option>
          <option value="created_at">Sort: Created</option>
        </select>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="✅"
          title="No tasks found"
          description={filterStatus !== 'all' || filterProject !== 'all' ? 'Try adjusting your filters.' : 'Add your first task using the button above.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(task => (
            <div key={task.id} style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              {/* Quick complete toggle */}
              <button
                onClick={() => handleMarkComplete(task)}
                title={task.status === 'done' ? 'Mark as incomplete' : 'Mark as done'}
                className="task-complete-btn"
                style={{
                  background: task.status === 'done' ? '#22c55e22' : '#111118',
                  border: `1px solid ${task.status === 'done' ? '#22c55e' : '#1e1e2e'}`,
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: task.status === 'done' ? '#22c55e' : 'var(--text-muted)',
                }}
              >
                {task.status === 'done' ? '✓' : '○'}
              </button>

              <div style={{ flex: 1 }}>
                <TaskCard
                  task={task}
                  onClick={() => setEditingTask(task)}
                  showProject={true}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task modal */}
      {editingTask !== undefined && (
        <TaskModal
          task={editingTask}
          projects={projects}
          onSave={handleSaveTask}
          onDelete={editingTask ? handleDeleteTask : undefined}
          onClose={() => setEditingTask(undefined)}
        />
      )}
    </div>
  )
}
