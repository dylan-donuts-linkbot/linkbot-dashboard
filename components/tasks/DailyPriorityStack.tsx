'use client'

import { Task } from '@/types'

interface DailyPriorityStackProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  urgent: '#ef4444',
}

const RANK_LABELS = ['1st', '2nd', '3rd']

export default function DailyPriorityStack({ tasks, onTaskClick }: DailyPriorityStackProps) {
  const top = tasks.slice(0, 3)

  if (top.length === 0) {
    return (
      <div style={{
        background: '#111118',
        border: '1px solid #1e1e2e',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#e5e7eb' }}>No priority tasks</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
          All clear — or set <code style={{ fontSize: '11px', background: '#1e1e2e', padding: '1px 5px', borderRadius: '3px' }}>priority_rank</code> on tasks to prioritize them here.
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#111118',
      border: '1px solid #1e1e2e',
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '24px',
    }}>
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#f0f0f0' }}>
          Today&apos;s Priority
        </h2>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>Your top tasks to focus on</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {top.map((task, i) => {
          const priorityColor = PRIORITY_COLORS[task.priority] ?? '#9ca3af'
          return (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: '#0a0a0f',
                border: '1px solid #1e1e2e',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'border-color 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2e2e3e' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#1e1e2e' }}
            >
              {/* Rank bubble */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: i === 0 ? '#6366f1' : '#1e1e2e',
                border: `2px solid ${i === 0 ? '#6366f1' : '#2e2e3e'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: i === 0 ? '#fff' : '#9ca3af',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#f0f0f0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {task.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                  {task.project && (
                    <span style={{ fontSize: '11px', color: task.project.color }}>
                      {task.project.name}
                    </span>
                  )}
                  <span style={{ fontSize: '11px', color: priorityColor, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    {task.priority}
                  </span>
                  {task.estimated_minutes && (
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                      ~{task.estimated_minutes}m
                    </span>
                  )}
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#6b7280', flexShrink: 0 }}>
                {RANK_LABELS[i]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
