'use client'

import { Project } from '@/types'
import ColorDot from '@/components/shared/ColorDot'
import StatusBadge from '@/components/shared/StatusBadge'

interface ProjectHeaderProps {
  project: Project
}

export default function ProjectHeader({ project }: ProjectHeaderProps) {
  return (
    <div style={{
      background: '#111118',
      border: '1px solid #1e1e2e',
      borderRadius: '10px',
      padding: '24px 28px',
      marginBottom: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Left color bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '4px',
        background: project.color,
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', paddingLeft: '8px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          background: project.color + '22',
          border: `2px solid ${project.color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ColorDot color={project.color} size={14} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#f0f0f0' }}>
              {project.name}
            </h1>
            <StatusBadge status={project.status ?? 'active'} size="md" />
            {project.is_system && (
              <span style={{
                fontSize: '11px',
                color: '#8b5cf6',
                background: '#8b5cf615',
                border: '1px solid #8b5cf633',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                System
              </span>
            )}
          </div>

          {project.description && (
            <p style={{
              margin: '0 0 8px',
              fontSize: '14px',
              color: '#9ca3af',
              lineHeight: 1.6,
              maxWidth: '600px',
            }}>
              {project.description}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
            {project.stage && (
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                Stage: <strong style={{ color: '#e5e7eb' }}>{project.stage}</strong>
              </span>
            )}
            {project.github_repo && (
              <a
                href={`https://github.com/${project.github_repo}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#f0f0f0' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af' }}
              >
                📦 {project.github_repo}
              </a>
            )}
            {project.vercel_project && (
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                ▲ {project.vercel_project}
              </span>
            )}
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}
              >
                🌐 Live site ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
