'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Task } from '@/types'

interface TaskCardProps {
  task: Task
  index: number
  onClick: () => void
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TaskCard({ task, index, onClick }: TaskCardProps) {
  const priorityColor = PRIORITY_COLORS[task.priority] || '#888'

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={{
            background: snapshot.isDragging ? '#1f1f1f' : '#171717',
            border: `1px solid ${snapshot.isDragging ? '#3b82f6' : '#2a2a2a'}`,
            borderRadius: '7px',
            padding: '12px',
            marginBottom: '8px',
            cursor: 'pointer',
            userSelect: 'none',
            ...provided.draggableProps.style,
          }}
        >
          {/* Priority bar */}
          <div style={{
            height: '2px',
            background: priorityColor,
            borderRadius: '1px',
            marginBottom: '8px',
            opacity: 0.8,
          }} />

          {/* Title */}
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#e8e8e8', lineHeight: 1.4, marginBottom: '6px' }}>
            {task.title}
          </div>

          {/* Description preview */}
          {task.description && (
            <div style={{
              fontSize: '12px',
              color: '#666',
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
                padding: '2px 6px',
                borderRadius: '3px',
                fontFamily: 'monospace',
              }}>
                🤖 {task.agent_name}
              </span>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Priority badge */}
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
              {/* Project dot */}
              {task.project && (
                <span style={{
                  fontSize: '11px',
                  color: task.project.color,
                  maxWidth: '100px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {task.project.name}
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#444', flexShrink: 0 }}>
              {formatDate(task.created_at)}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  )
}
