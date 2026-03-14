import Link from 'next/link'
import { Project } from '@/types'
import StatusBadge from '@/components/shared/StatusBadge'
import ColorDot from '@/components/shared/ColorDot'

interface ProjectCardProps {
  project: Project
  taskCount?: number
  doneCount?: number
}

export default function ProjectCard({ project, taskCount = 0, doneCount = 0 }: ProjectCardProps) {
  const pct = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0

  return (
    <Link
      href={`/projects/${project.id}`}
      style={{
        display: 'block',
        background: '#111118',
        border: '1px solid #1e1e2e',
        borderRadius: '10px',
        padding: '20px',
        textDecoration: 'none',
        transition: 'border-color 0.15s, transform 0.1s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = project.color + '66'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.borderColor = '#1e1e2e'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* Color accent bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: project.color,
      }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <ColorDot color={project.color} size={10} />
          <span style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#f0f0f0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {project.name}
          </span>
        </div>
        <StatusBadge status={project.status ?? 'active'} />
      </div>

      {/* Description */}
      {project.description && (
        <div style={{
          fontSize: '13px',
          color: '#9ca3af',
          lineHeight: 1.5,
          marginBottom: '14px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } as React.CSSProperties}>
          {project.description}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ marginBottom: '12px' }}>
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
          }} />
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
          {doneCount}/{taskCount} tasks done
        </div>
      </div>

      {/* Metadata row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {project.stage && (
          <span style={{
            fontSize: '11px',
            color: '#9ca3af',
            background: '#1e1e2e',
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            {project.stage}
          </span>
        )}
        {project.github_repo && (
          <span style={{
            fontSize: '11px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}>
            📦 GitHub
          </span>
        )}
        {project.live_url && (
          <span style={{
            fontSize: '11px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
          }}>
            🌐 Live
          </span>
        )}
        {project.is_system && (
          <span style={{
            fontSize: '11px',
            color: '#8b5cf6',
            background: '#8b5cf615',
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            System
          </span>
        )}
      </div>
    </Link>
  )
}
