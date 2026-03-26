import { ActivityLog } from '@/types'
import Link from 'next/link'
import EmptyState from './EmptyState'

interface ActivityFeedProps {
  logs: ActivityLog[]
  maxHeight?: string
}

const AGENT_COLORS: Record<string, { bg: string; text: string }> = {
  openclaw:  { bg: '#451a03', text: '#fbbf24' },
  discovery: { bg: '#172554', text: '#60a5fa' },
  design:    { bg: '#2e1065', text: '#c084fc' },
  dev:       { bg: '#042f2e', text: '#2dd4bf' },
  system:    { bg: '#1c1c2e', text: '#6b7280' },
}

function agentStyle(agent: string | undefined) {
  const key = (agent ?? 'system').toLowerCase()
  return AGENT_COLORS[key] ?? { bg: '#1c1c2e', text: '#9ca3af' }
}

const STATUS_COLORS: Record<string, string> = {
  complete:    '#22c55e',
  in_progress: '#3b82f6',
  blocked:     '#ef4444',
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
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ActivityFeed({ logs, maxHeight = '400px' }: ActivityFeedProps) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Activity
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{logs.length} events</span>
      </div>

      <div style={{ overflowY: 'auto', maxHeight }}>
        {logs.length === 0 ? (
          <EmptyState
            icon="⚡"
            title="No activity yet"
            description="Events will appear here as work gets done."
          />
        ) : (
          logs.map((log, i) => {
            const style = agentStyle(log.agent)
            const statusColor = log.status ? (STATUS_COLORS[log.status] ?? '#6b7280') : null
            const text = log.summary ?? log.detail

            return (
              <div
                key={log.id}
                style={{
                  padding: '10px 16px',
                  borderBottom: i < logs.length - 1 ? '1px solid #1a1a28' : 'none',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: log.project?.color || '#6366f1',
                  marginTop: '6px',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Action row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 600,
                      background: style.bg, color: style.text,
                      padding: '1px 5px', borderRadius: '3px',
                    }}>
                      {log.agent ?? 'system'}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: 500 }}>
                      {log.action}
                    </span>
                    {statusColor && (
                      <span style={{
                        fontSize: '10px', fontWeight: 600,
                        color: statusColor, background: statusColor + '20',
                        padding: '1px 5px', borderRadius: '3px',
                      }}>
                        {log.status}
                      </span>
                    )}
                  </div>
                  {/* Summary */}
                  {text && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {text}
                    </div>
                  )}
                  {/* Task link */}
                  {log.task && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      Task: <span style={{ color: 'var(--text-secondary)' }}>{log.task.title}</span>
                    </div>
                  )}
                  {log.project && (
                    <div style={{ fontSize: '11px', color: log.project.color, marginTop: '2px' }}>
                      {log.project.name}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {timeAgo(log.created_at)}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
