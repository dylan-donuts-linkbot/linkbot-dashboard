'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Project } from '@/types'
import ColorDot from '@/components/shared/ColorDot'
import ThemeToggle from '@/components/ThemeToggle'

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo / Brand */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--sidebar-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Project HQ
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dylan&apos;s ops center</div>
          </div>
          <ThemeToggle />
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects... ⌘K"
            style={{
              background: 'var(--bg-deep)',
              border: '1px solid var(--border-card)',
              borderRadius: '6px',
              padding: '7px 10px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              width: '100%',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '8px', flex: 1, overflowY: 'auto' }}>
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
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: active ? 'var(--bg-active)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.1s, color 0.1s',
                  marginBottom: '1px',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                {active && (
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '16px',
                    background: 'var(--accent)',
                    borderRadius: '0 2px 2px 0',
                  }} />
                )}
                <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {isProjectsItem && (
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    transform: projectsOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}>
                    ▶
                  </span>
                )}
              </Link>

              {/* Project sub-list */}
              {isProjectsItem && projectsOpen && (
                <div style={{ paddingLeft: '12px', marginBottom: '4px' }}>
                  {filteredProjects.length === 0 ? (
                    <div style={{ padding: '6px 10px', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
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
                            color: projActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            background: projActive ? 'var(--bg-active)' : 'transparent',
                            textDecoration: 'none',
                            marginBottom: '1px',
                            overflow: 'hidden',
                            transition: 'background 0.1s, color 0.1s',
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
                    <div style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
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
        borderTop: '1px solid var(--sidebar-border)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>{projects.length} projects</span>
        <button
          onClick={() => setCmdOpen(true)}
          style={{
            background: 'var(--bg-active)',
            border: '1px solid var(--border-card)',
            borderRadius: '4px',
            padding: '3px 7px',
            fontSize: '10px',
            color: 'var(--text-secondary)',
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
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          zIndex: 150,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-md)',
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
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '480px',
              margin: '0 16px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Quick navigate</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Command Palette ⌘K</div>
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
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
                >
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Projects</div>
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
                      background: 'var(--bg-hover)',
                      borderRadius: '5px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
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
