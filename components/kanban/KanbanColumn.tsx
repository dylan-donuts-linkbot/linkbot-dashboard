'use client'

import { Droppable } from '@hello-pangea/dnd'
import { Task, TaskStatus } from '@/types'
import KanbanCard from './KanbanCard'

interface KanbanColumnProps {
  id: TaskStatus
  label: string
  tasks: Task[]
  onAddTask: () => void
  onTaskClick: (task: Task) => void
}

const COLUMN_COLORS: Record<TaskStatus, string> = {
  backlog: 'var(--text-muted)',
  in_progress: '#3b82f6',
  in_review: '#eab308',
  done: '#22c55e',
}

export default function KanbanColumn({ id, label, tasks, onAddTask, onTaskClick }: KanbanColumnProps) {
  const color = COLUMN_COLORS[id]

  return (
    <div style={{
      background: 'var(--sidebar-bg)',
      border: '1px solid var(--border-card)',
      borderRadius: '9px',
      padding: '12px',
      minHeight: '300px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Column header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '10px',
        borderBottom: `2px solid ${color}33`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{
            fontSize: '12px',
            fontWeight: 700,
            color: color,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            {label}
          </span>
          <span style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            background: 'var(--bg-active)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '1px 7px',
          }}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          style={{
            background: 'none',
            border: '1px solid var(--border-card)',
            color: 'var(--text-muted)',
            borderRadius: '5px',
            width: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            lineHeight: 1,
            cursor: 'pointer',
            padding: 0,
          }}
          title={`Add task to ${label}`}
        >
          +
        </button>
      </div>

      {/* Drop zone */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              flex: 1,
              minHeight: '60px',
              background: snapshot.isDraggingOver ? 'rgba(99,102,241,0.05)' : 'transparent',
              borderRadius: '5px',
              transition: 'background 0.1s',
              padding: snapshot.isDraggingOver ? '4px' : '0',
            }}
          >
            {tasks.map((task, i) => (
              <KanbanCard
                key={task.id}
                task={task}
                index={i}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div style={{
                textAlign: 'center',
                color: '#2e2e3e',
                fontSize: '12px',
                padding: '20px 0',
                fontStyle: 'italic',
              }}>
                Drop here
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
