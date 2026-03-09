'use client'

import { Project } from '@/types'

interface HeaderProps {
  activeProject: string | null
  projects: Project[]
  onSelectProject: (id: string | null) => void
  onNewProject: () => void
  onViewContext: (project: Project) => void
}

export default function Header({ activeProject, projects, onSelectProject, onNewProject, onViewContext }: HeaderProps) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <header style={{
      background: '#0f0f0f',
      borderBottom: '1px solid #2a2a2a',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.3px' }}>
            🔗 LinkBot
          </span>
          <span style={{ color: '#555', fontSize: '13px' }}>Dashboard</span>
        </div>

        {/* Project filter pills */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onSelectProject(null)}
            style={{
              background: activeProject === null ? '#1d4ed8' : 'transparent',
              color: activeProject === null ? '#fff' : '#888',
              border: '1px solid',
              borderColor: activeProject === null ? '#1d4ed8' : '#2a2a2a',
              borderRadius: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            All
          </button>
          {projects.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                onClick={() => onSelectProject(p.id)}
                style={{
                  background: activeProject === p.id ? p.color + '22' : 'transparent',
                  color: activeProject === p.id ? p.color : '#888',
                  border: '1px solid',
                  borderColor: activeProject === p.id ? p.color : '#2a2a2a',
                  borderRadius: '5px 0 0 5px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {p.name}
              </button>
              {p.context && (
                <button
                  onClick={e => { e.stopPropagation(); onViewContext(p) }}
                  title="View project context / PRD"
                  style={{
                    background: 'transparent',
                    color: '#555',
                    border: '1px solid #2a2a2a',
                    borderLeft: 'none',
                    borderRadius: '0 5px 5px 0',
                    padding: '4px 6px',
                    fontSize: '11px',
                    lineHeight: 1,
                  }}
                >
                  📋
                </button>
              )}
              {!p.context && (
                <div style={{
                  width: '1px',
                  height: '20px',
                  background: '#2a2a2a',
                  display: 'none',
                }} />
              )}
            </div>
          ))}

          {/* New Project button */}
          <button
            onClick={onNewProject}
            style={{
              background: 'transparent',
              color: '#555',
              border: '1px dashed #333',
              borderRadius: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 500,
              marginLeft: '4px',
            }}
          >
            + New Project
          </button>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: '#555', fontSize: '12px' }}>{dateStr}</span>
        <span style={{ color: '#888', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
      </div>
    </header>
  )
}
