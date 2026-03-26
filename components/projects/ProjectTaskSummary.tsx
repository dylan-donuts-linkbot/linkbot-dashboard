import Link from 'next/link'
import { Task, Project } from '@/types'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'

interface ProjectTaskSummaryProps {
  project: Project
  tasks: Task[]
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  urgent: '#ef4444',
}

export default function ProjectTaskSummary({ project, tasks }: ProjectTaskSummaryProps) {
  const statusCounts = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    in_review: tasks.filter(t => t.status === 'in_review').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  const activeTasks = tasks.filter(t => t.status !== 'done').slice(0, 8)

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Tasks</h2>
        <Link
          href={`/kanban?project=${project.id}`}
          style={{
            fontSize: '12px',
            color: '#6366f1',
            textDecoration: 'none',
          }}
        >
          Open in Kanban →
        </Link>
      </div>

      {/* Status counts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
        {([
          { key: 'backlog', label: 'Backlog', color: 'var(--text-muted)' },
          { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
          { key: 'in_review', label: 'In Review', color: '#eab308' },
          { key: 'done', label: 'Done', color: '#22c55e' },
        ] as const).map(col => (
          <div key={col.key} style={{
            background: 'var(--bg-deep)',
            border: '1px solid var(--border-card)',
            borderRadius: '6px',
            padding: '10px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: col.color }}>
              {statusCounts[col.key]}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {col.label}
            </div>
          </div>
        ))}
      </div>

      {/* Task list */}
      {activeTasks.length === 0 ? (
        <EmptyState
          icon="✓"
          title="All clear!"
          description="No open tasks for this project."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {activeTasks.map(task => (
            <div key={task.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              background: 'var(--bg-deep)',
              border: '1px solid var(--border-card)',
              borderRadius: '6px',
            }}>
              <div style={{
                width: '3px',
                height: '18px',
                background: PRIORITY_COLORS[task.priority] ?? 'var(--text-muted)',
                borderRadius: '2px',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-light)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {task.title}
                </div>
                {task.assignee && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {task.assignee}
                  </div>
                )}
              </div>
              <StatusBadge status={task.status} size="sm" />
            </div>
          ))}
          {tasks.length > 8 && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '6px' }}>
              +{tasks.length - 8} more tasks
            </div>
          )}
        </div>
      )}
    </div>
  )
}
