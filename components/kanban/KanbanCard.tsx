'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Task } from '@/types'

interface KanbanCardProps {
  task: Task
  index: number
  onClick: () => void
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

export default function KanbanCard({ task, index, onClick }: KanbanCardProps) {
  const priorityColor = PRIORITY_COLORS[task.priority] ?? 'var(--text-secondary)'

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={{
            background: snapshot.isDragging ? 'var(--bg-hover)' : 'var(--bg-card)',
            border: `1px solid ${snapshot.isDragging ? '#6366f1' : '#1e1e2e'}`,
            borderRadius: '7px',
            padding: '11px 12px',
            marginBottom: '7px',
            cursor: 'pointer',
            userSelect: 'none',
            boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.4)' : 'none',
            ...provided.draggableProps.style,
          }}
        >
          {/* Priority top bar */}
          <div style={{
            height: '2px',
            background: priorityColor,
            borderRadius: '1px',
            marginBottom: '8px',
            opacity: 0.8,
          }} />

          {/* Project label */}
          {task.project && (
            <div style={{
              fontSize: '10px',
              color: task.project.color,
              fontWeight: 700,
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
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
            marginBottom: task.description ? '6px' : '8px',
          }}>
            {task.title}
          </div>

          {/* Description preview */}
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

          {/* Agent badge */}
          {task.agent_name && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{
                fontSize: '10px',
                color: '#a78bfa',
                background: '#a78bfa15',
                border: '1px solid #a78bfa33',
                padding: '2px 5px',
                borderRadius: '3px',
                fontFamily: 'monospace',
              }}>
                {task.agent_name}
              </span>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              color: priorityColor,
              background: priorityColor + '15',
              padding: '2px 5px',
              borderRadius: '3px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {task.priority}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
              {formatDate(task.created_at)}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  )
}
