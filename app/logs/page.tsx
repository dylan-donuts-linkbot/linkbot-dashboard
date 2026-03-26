'use client'

import { useState, useEffect, useCallback } from 'react'
import { ActivityLog, Project } from '@/types'
import { getSupabase } from '@/lib/supabase'

const AGENT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  openclaw:  { bg: '#451a03', text: '#fbbf24', label: 'OpenClaw' },
  discovery: { bg: '#172554', text: '#60a5fa', label: 'Discovery' },
  design:    { bg: '#2e1065', text: '#c084fc', label: 'Design' },
  dev:       { bg: '#042f2e', text: '#2dd4bf', label: 'Dev' },
  system:    { bg: '#1c1c2e', text: '#6b7280', label: 'System' },
}

function agentStyle(agent: string | undefined) {
  const key = (agent ?? 'system').toLowerCase()
  return AGENT_COLORS[key] ?? { bg: '#1c1c2e', text: '#9ca3af', label: agent ?? 'system' }
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterAgent, setFilterAgent] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const supabase = getSupabase()
      const [
        { data: logsData, error: logsError },
        { data: projectsData, error: projectsError },
      ] = await Promise.all([
        supabase
          .from('activity_log')
          .select('*, project:projects(id, name, color), task:tasks(id, title)')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('projects')
          .select('id, name, color')
          .order('name', { ascending: true }),
      ])

      if (logsError) throw new Error(logsError.message)
      if (projectsError) throw new Error(projectsError.message)

      setLogs((logsData as ActivityLog[]) ?? [])
      setProjects((projectsData as Project[]) ?? [])
    } catch (err) {
      console.error('Failed to load logs:', err)
      setLoadError(err instanceof Error ? err.message : 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const agentNames = Array.from(new Set(logs.map(l => l.agent ?? 'system'))).sort()

  const filtered = logs.filter(log => {
    if (filterProject !== 'all' && log.project_id !== filterProject) return false
    if (filterAgent !== 'all' && (log.agent ?? 'system') !== filterAgent) return false
    return true
  })

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Agent Logs</h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Activity from OpenClaw and sub-agents</p>
      </div>

      {loadError && (
        <div style={{ background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#fca5a5' }}>{loadError}</span>
          <button onClick={load} style={{ background: '#7f1d1d', border: 'none', borderRadius: '5px', padding: '4px 10px', fontSize: '12px', color: '#fca5a5', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: 'var(--text-light)', cursor: 'pointer' }}
        >
          <option value="all">All projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select
          value={filterAgent}
          onChange={e => setFilterAgent(e.target.value)}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '6px', padding: '7px 10px', fontSize: '13px', color: 'var(--text-light)', cursor: 'pointer' }}
        >
          <option value="all">All agents</option>
          {agentNames.map(a => <option key={a} value={a}>{agentStyle(a).label}</option>)}
        </select>

        {(filterProject !== 'all' || filterAgent !== 'all') && (
          <button
            onClick={() => { setFilterProject('all'); setFilterAgent('all') }}
            style={{ background: 'transparent', border: '1px solid var(--border-card)', borderRadius: '6px', padding: '7px 10px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Clear
          </button>
        )}

        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'center' }}>
          {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}`}
        </div>
      </div>

      {/* Log feed */}
      {!loading && filtered.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No activity yet</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {filtered.map((log, i) => {
            const isFirst = i === 0
            const isLast = i === filtered.length - 1
            const style = agentStyle(log.agent)

            return (
              <div
                key={log.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-card)',
                  borderRadius: isFirst && isLast ? '10px' : isFirst ? '10px 10px 3px 3px' : isLast ? '3px 3px 10px 10px' : '3px',
                  padding: '12px 16px',
                  display: 'grid',
                  gridTemplateColumns: '140px 90px 1fr',
                  gap: '12px',
                  alignItems: 'start',
                }}
              >
                {/* Timestamp */}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingTop: '1px', whiteSpace: 'nowrap' }}>
                  {formatTimestamp(log.created_at)}
                </div>

                {/* Agent badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                  background: style.bg, color: style.text, whiteSpace: 'nowrap',
                }}>
                  {style.label}
                </div>

                {/* Content */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-light)' }}>
                      {log.action}
                    </span>
                    {log.status && (
                      <span style={{ fontSize: '10px', color: '#6b7280', background: '#1c1c2e', padding: '1px 5px', borderRadius: '3px' }}>
                        {log.status}
                      </span>
                    )}
                    {log.project && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        · {log.project.name}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {log.summary ?? log.detail}
                  </div>
                  {log.task && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Task: {log.task.title}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
