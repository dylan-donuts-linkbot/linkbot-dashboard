'use client'

import { ProjectStatus, TaskStatus } from '@/types'

type Status = ProjectStatus | TaskStatus | string

interface StatusBadgeProps {
  status: Status
  size?: 'sm' | 'md'
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  // Project statuses
  active:    { label: 'Active',    color: '#22c55e', bg: '#22c55e15' },
  paused:    { label: 'Paused',    color: '#eab308', bg: '#eab30815' },
  archived:  { label: 'Archived', color: 'var(--text-muted)', bg: '#6b728015' },
  complete:  { label: 'Complete', color: '#3b82f6', bg: '#3b82f615' },
  // Task statuses
  backlog:    { label: 'Backlog',     color: 'var(--text-muted)', bg: '#6b728015' },
  in_progress:{ label: 'In Progress', color: '#3b82f6', bg: '#3b82f615' },
  in_review:  { label: 'In Review',   color: '#eab308', bg: '#eab30815' },
  done:       { label: 'Done',        color: '#22c55e', bg: '#22c55e15' },
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: 'var(--text-secondary)', bg: '#9ca3af15' }
  const padding = size === 'sm' ? '2px 8px' : '4px 12px'
  const fontSize = size === 'sm' ? '11px' : '12px'

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding,
      fontSize,
      fontWeight: 600,
      color: config.color,
      background: config.bg,
      border: `1px solid ${config.color}33`,
      borderRadius: '4px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap',
    }}>
      {config.label}
    </span>
  )
}
