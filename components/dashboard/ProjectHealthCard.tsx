'use client'

import Link from 'next/link'
import { Project, Task } from '@/types'
import ColorDot from '@/components/shared/ColorDot'
import StatusBadge from '@/components/shared/StatusBadge'

interface ProjectHealthCardProps {
  project: Project
  tasks: Task[]
}

export default function ProjectHealthCard({ project, tasks }: ProjectHealthCardProps) {
  const projectTasks = tasks.filter(t => t.project_id === project.id)
  const doneTasks = projectTasks.filter(t => t.status === 'done').length
  const inProgressTasks = projectTasks.filter(t => t.status === 'in_progress').length
  const total = projectTasks.length
  const pct = total > 0 ? Math.round((doneTasks / total) * 100) : 0

  return (
    <Link
      href={`/projects/${project.id}`}
      style={{
        display: 'block',
        background: '#111118',
        border: '1px solid #1e1e2e',
        borderRadius: '8px',
        padding: '16px',
        textDecoration: 'none',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = project.color + '66' }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#1e1e2e' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <ColorDot color={project.color} size={9} />
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#f0f0f0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {project.name}
          </span>
        </div>
        <StatusBadge status={project.status ?? 'active'} size="sm" />
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{
          height: '4px',
          background: '#1e1e2e',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: project.color,
            borderRadius: '2px',
            transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          {pct}% complete ({doneTasks}/{total} tasks)
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          <span style={{ color: '#3b82f6', fontWeight: 600 }}>{inProgressTasks}</span> in progress
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>{doneTasks}</span> done
        </div>
        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
          <span style={{ fontWeight: 600 }}>{total}</span> total
        </div>
      </div>

      {project.stage && (
        <div style={{ marginTop: '8px' }}>
          <span style={{
            fontSize: '11px',
            color: '#9ca3af',
            background: '#1e1e2e',
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            {project.stage}
          </span>
        </div>
      )}
    </Link>
  )
}
