'use client'

import { Task } from '@/types'

interface TaskCardProps {
  task: Task
  onClick: () => void
  showProject?: boolean
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  urgent: '#ef4444',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isDue(dueDateStr: string): boolean {
  const due = new Date(dueDateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due <= today
}

export default function TaskCard({ task, onClick, showProject = true }: TaskCardProps) {
  const priorityColor = PRIORITY_COLORS[task.priority] ?? 'var(--text-secondary)'
  const overdue = task.due_date && task.status !== 'done' && isDue(task.due_date)

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${overdue ? '#ef444444' : 'var(--border-card)'}`,
        borderRadius: '8px',
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.1s',
      }}
      onMouseEnter={e => {
        if (!overdue) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--text-muted)'
      }}
      onMouseLeave={e => {
        if (!overdue) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-card)'
      }}
    >
      {/* Priority bar */}
      <div style={{
        height: '2px',
        background: priorityColor,
        borderRadius: '1px',
        marginBottom: '9px',
        opacity: 0.9,
      }} />

      {/* Project label */}
      {showProject && task.project && (
        <div style={{
          fontSize: '11px',
          color: task.project.color,
          fontWeight: 600,
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {task.project.name}
        </div>
      )}

      {/* Title */}
      <div style={{
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--text-light)',
        lineHeight: 1.4,
        marginBottom: '6px',
      }}>
        {task.title}
      </div>

      {/* Description */}
      {task.description && (
        <div style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          lineHeight: 1.4,
          marginBottom: '8px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        } as React.CSSProperties}>
          {task.description}
        </div>
      )}

      {/* Badges row: auto_created + agent */}
      {(task.auto_created || task.agent_name) && (
        <div style={{ marginBottom: '6px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {task.auto_created && (
            <span style={{
              fontSize: '10px',
              color: '#fbbf24',
              background: '#fbbf2415',
              border: '1px solid #fbbf2433',
              padding: '2px 6px',
              borderRadius: '3px',
              fontWeight: 600,
            }}>
              Auto-created
            </span>
          )}
          {task.agent_name && (
            <span style={{
              fontSize: '10px',
              color: '#a78bfa',
              background: '#a78bfa15',
              border: '1px solid #a78bfa33',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'monospace',
            }}>
              {task.agent_name}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 600,
            color: priorityColor,
            background: priorityColor + '15',
            padding: '2px 6px',
            borderRadius: '3px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            {task.priority}
          </span>
          {task.estimated_minutes && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ~{task.estimated_minutes}m
            </span>
          )}
          {task.assignee && task.assignee !== 'linkbot' && (
            <span style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              background: 'var(--bg-active)',
              padding: '2px 6px',
              borderRadius: '3px',
            }}>
              {task.assignee}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {task.due_date && (
            <span style={{
              fontSize: '11px',
              color: overdue ? '#ef4444' : 'var(--text-muted)',
              fontWeight: overdue ? 600 : 400,
            }}>
              {overdue ? '⚠ ' : ''}{formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
