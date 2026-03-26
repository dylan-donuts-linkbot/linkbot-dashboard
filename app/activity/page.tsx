'use client'

import { useState, useEffect, useCallback } from 'react'
import { ActivityLog, Project } from '@/types'
import { getSupabase } from '@/lib/supabase'
import EmptyState from '@/components/shared/EmptyState'

const AGENT_COLORS: Record<string, { bg: string; text: string }> = {
  openclaw:  { bg: '#451a03', text: '#fbbf24' },
  discovery: { bg: '#172554', text: '#60a5fa' },
  design:    { bg: '#2e1065', text: '#c084fc' },
  dev:       { bg: '#042f2e', text: '#2dd4bf' },
  system:    { bg: '#1c1c2e', text: '#6b7280' },
}

const STATUS_COLORS: Record<string, string> = {
  complete:    '#22c55e',
  in_progress: '#3b82f6',
  blocked:     '#ef4444',
}

function agentStyle(agent: string) {
  const key = agent.toLowerCase()
  return AGENT_COLORS[key] ?? { bg: '#1c1c2e', text: '#9ca3af' }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function groupByDate(logs: ActivityLog[]): Record<string, ActivityLog[]> {
  const groups: Record<string, ActivityLog[]> = {}
  logs.forEach(log => {
    const date = log.created_at.slice(0, 10)
    if (!groups[date]) groups[date] = []
    groups[date].push(log)
  })
  return groups
}

function formatGroupDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  if (date >= today) return 'Today'
  if (date >= yesterday) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-card)',
  borderRadius: '6px',
  padding: '7px 10px',
  fontSize: '13px',
  color: 'var(--text-light)',
  cursor: 'pointer',
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [filterAgent, setFilterAgent] = useState('all')
  const [filterProject, setFilterProject] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterAction, setFilterAction] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const supabase = getSupabase()
      const [{ data: activityData, error: activityError }, { data: projectsData }] = await Promise.all([
        supabase
          .from('activity_log')
          .select('id, agent, action, summary, detail, status, task_id, project_id, metadata, created_at, projects!project_id(id, name, color), tasks!task_id(id, title)')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase.from('projects').select('id, name, color').order('name', { ascending: true }),
      ])
      if (activityError) throw new Error(activityError.message)
      setActivity((activityData as ActivityLog[]) ?? [])
      setProjects((projectsData as Project[]) ?? [])
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Derived filter options
  const agents = Array.from(new Set(activity.map(l => l.agent ?? 'system'))).sort()
  const actions = Array.from(new Set(activity.map(l => l.action))).sort()
  const statuses = Array.from(new Set(activity.map(l => l.status).filter(Boolean))).sort() as string[]

  const filtered = activity.filter(log => {
    if (filterAgent !== 'all' && (log.agent ?? 'system') !== filterAgent) return false
    if (filterProject !== 'all' && log.project_id !== filterProject) return false
    if (filterStatus !== 'all' && log.status !== filterStatus) return false
    if (filterAction !== 'all' && log.action !== filterAction) return false
    return true
  })

  const hasFilters = filterAgent !== 'all' || filterProject !== 'all' || filterStatus !== 'all' || filterAction !== 'all'
  const grouped = groupByDate(filtered)
  const dateKeys = Object.keys(grouped).sort().reverse()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Activity Log</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            {loading ? 'Loading…' : `${filtered.length} of ${activity.length} events`}
          </p>
        </div>
        <button
          onClick={load}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '6px', padding: '7px 12px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>

      {loadError && (
        <div style={{ background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#fca5a5' }}>{loadError}</span>
          <button onClick={load} style={{ background: '#7f1d1d', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '12px', color: '#fca5a5', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} style={selectStyle}>
          <option value="all">All agents</option>
          {agents.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={selectStyle}>
          <option value="all">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={selectStyle}>
          <option value="all">All actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="all">All statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setFilterAgent('all'); setFilterProject('all'); setFilterStatus('all'); setFilterAction('all') }}
            style={{ background: 'transparent', border: '1px solid var(--border-card)', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
      </div>

      {!loading && filtered.length === 0 ? (
        <EmptyState icon="⚡" title="No activity yet" description="Activity events will appear here as work is done via LinkBot." />
      ) : (
        <div style={{ maxWidth: '760px' }}>
          {dateKeys.map(date => (
            <div key={date} style={{ marginBottom: '32px' }}>
              {/* Date header */}
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {formatGroupDate(date)}
                <div style={{ flex: 1, height: '1px', background: 'var(--bg-active)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, letterSpacing: 0 }}>
                  {grouped[date].length} events
                </span>
              </div>

              {/* Events */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {grouped[date].map((log, i) => {
                  const isLast = i === grouped[date].length - 1
                  const aStyle = agentStyle(log.agent ?? 'system')
                  const statusColor = log.status ? (STATUS_COLORS[log.status] ?? '#6b7280') : null
                  const text = log.summary ?? log.detail

                  return (
                    <div key={log.id} style={{ display: 'flex', gap: 0 }}>
                      {/* Timeline */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px', flexShrink: 0 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: (log as any).project_id ? ((log as any).project_id as any).color : '#6366f1', border: '2px solid #0a0a0f', marginTop: '14px', zIndex: 1, flexShrink: 0 }} />
                        {!isLast && <div style={{ width: '1px', flex: 1, background: 'var(--bg-active)', marginTop: '2px' }} />}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, padding: '10px 0 12px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Agent + action + status */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '10px', fontWeight: 600, background: aStyle.bg, color: aStyle.text, padding: '1px 6px', borderRadius: '3px' }}>
                                {log.agent ?? 'system'}
                              </span>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-light)' }}>
                                {log.action}
                              </span>
                              {statusColor && (
                                <span style={{ fontSize: '10px', fontWeight: 600, color: statusColor, background: statusColor + '20', padding: '1px 5px', borderRadius: '3px' }}>
                                  {log.status}
                                </span>
                              )}
                            </div>
                            {/* Summary */}
                            {text && (
                              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '4px' }}>
                                {text}
                              </div>
                            )}
                            {/* Task link */}
                            {(log as any).task_id && (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                Task: <span style={{ color: 'var(--text-secondary)' }}>{((log as any).task_id as any).title}</span>
                              </div>
                            )}
                            {/* Project badge */}
                            {(log as any).project_id && (
                              <span style={{ fontSize: '11px', color: ((log as any).project_id as any).color, background: ((log as any).project_id as any).color + '15', padding: '2px 7px', borderRadius: '4px', fontWeight: 500 }}>
                                {((log as any).project_id as any).name}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} title={formatDateTime(log.created_at)}>
                            {timeAgo(log.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {activity.length >= 500 && (
            <div style={{ textAlign: 'center', padding: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing latest 500 events
            </div>
          )}
        </div>
      )}
    </div>
  )
}
