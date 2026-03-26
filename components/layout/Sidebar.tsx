'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Project } from '@/types'
import ColorDot from '@/components/shared/ColorDot'

interface SidebarProps {
  projects: Project[]
}

interface NavItem {
  href: string
  label: string
  icon: string
  exactMatch?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',          label: 'Dashboard',  icon: '⬛', exactMatch: true },
  { href: '/projects',  label: 'Projects',   icon: '📁' },
  { href: '/my-tasks',  label: 'My Tasks',   icon: '✅' },
  { href: '/kanban',    label: 'Kanban',     icon: '⬜' },
  { href: '/metrics',   label: 'Metrics',    icon: '📊' },
  { href: '/activity',  label: 'Activity',   icon: '⚡' },
  { href: '/logs',      label: 'Agent Logs', icon: '🤖' },
  { href: '/settings',  label: 'Settings',   icon: '⚙️' },
]

export default function Sidebar({ projects }: SidebarProps) {
  const pathname = usePathname()
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [cmdOpen, setCmdOpen] = useState(false)

  const filteredProjects = search
    ? projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects

  function isActive(item: NavItem): boolean {
    if (item.exactMatch) return pathname === item.href
    return pathname.startsWith(item.href)
  }

  // Cmd+K command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setCmdOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const sidebarContent = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '0',
    }}>
      {/* Logo / Brand */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid #1e1e2e',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            flexShrink: 0,
          }}>
            🔗
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0f0f0', lineHeight: 1.2 }}>
              Project HQ
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>Dylan&apos;s ops center</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginTop: '12px', position: 'relative' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects... ⌘K"
            style={{
              background: '#0a0a0f',
              border: '1px solid #1e1e2e',
              borderRadius: '6px',
              padding: '7px 10px',
              fontSize: '12px',
              color: '#e5e7eb',
              width: '100%',
              outline: 'none',
            }}
            onFocus={() => search === '' && setCmdOpen(false)}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '8px 8px', flex: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => {
          const active = isActive(item)
          const isProjectsItem = item.href === '/projects'

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={() => {
                  if (isProjectsItem) setProjectsOpen(p => !p)
                  setMobileOpen(false)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#f0f0f0' : '#9ca3af',
                  background: active ? '#1e1e2e' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.1s, color 0.1s',
                  marginBottom: '1px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {isProjectsItem && (
                  <span style={{
                    fontSize: '10px',
                    color: '#6b7280',
                    transform: projectsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}>
                    ▶
                  </span>
                )}
                {active && !isProjectsItem && (
                  <span style={{
                    width: '3px',
                    height: '14px',
                    background: '#6366f1',
                    borderRadius: '2px',
                    flexShrink: 0,
                  }} />
                )}
              </Link>

              {/* Project sub-list */}
              {isProjectsItem && projectsOpen && (
                <div style={{ paddingLeft: '12px', marginBottom: '4px' }}>
                  {filteredProjects.length === 0 ? (
                    <div style={{ padding: '6px 10px', fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>
                      No projects
                    </div>
                  ) : (
                    filteredProjects.slice(0, 12).map(project => {
                      const projActive = pathname === `/projects/${project.id}` || pathname.startsWith(`/projects/${project.id}/`)
                      return (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}`}
                          onClick={() => setMobileOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            fontSize: '12px',
                            color: projActive ? '#f0f0f0' : '#9ca3af',
                            background: projActive ? '#1e1e2e' : 'transparent',
                            textDecoration: 'none',
                            marginBottom: '1px',
                            overflow: 'hidden',
                          }}
                        >
                          <ColorDot color={project.color} size={6} />
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}>
                            {project.name}
                          </span>
                        </Link>
                      )
                    })
                  )}
                  {filteredProjects.length > 12 && (
                    <div style={{ padding: '4px 10px', fontSize: '11px', color: '#6b7280' }}>
                      +{filteredProjects.length - 12} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #1e1e2e',
        fontSize: '11px',
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>{projects.length} projects</span>
        <button
          onClick={() => setCmdOpen(true)}
          style={{
            background: '#1e1e2e',
            border: '1px solid #2e2e3e',
            borderRadius: '4px',
            padding: '3px 7px',
            fontSize: '10px',
            color: '#9ca3af',
            cursor: 'pointer',
          }}
          title="Command palette (⌘K)"
        >
          ⌘K
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(p => !p)}
        className="mobile-menu-btn"
        aria-label="Open navigation menu"
        style={{ fontSize: '18px' }}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-drawer${mobileOpen ? ' open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '240px',
          background: '#0d0d14',
          borderRight: '1px solid #1e1e2e',
          zIndex: 150,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Command Palette Modal */}
      {cmdOpen && (
        <div
          onClick={() => setCmdOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '120px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111118',
              border: '1px solid #1e1e2e',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '480px',
              margin: '0 16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e2e' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>Quick navigate</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f0' }}>Command Palette ⌘K</div>
            </div>
            <div style={{ padding: '8px' }}>
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setCmdOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#e5e7eb',
                    textDecoration: 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#1e1e2e' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
                >
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #1e1e2e' }}>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Projects</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {projects.slice(0, 8).map(p => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    onClick={() => setCmdOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px',
                      background: '#1e1e2e',
                      borderRadius: '5px',
                      fontSize: '12px',
                      color: '#e5e7eb',
                      textDecoration: 'none',
                    }}
                  >
                    <ColorDot color={p.color} size={6} />
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
