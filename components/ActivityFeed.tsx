'use client'

import { ActivityLog } from '@/types'

interface ActivityFeedProps {
  logs: ActivityLog[]
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

export default function ActivityFeed({ logs }: ActivityFeedProps) {
  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Activity
        </h3>
        <span style={{ fontSize: '11px', color: '#555' }}>{logs.length} events</span>
      </div>

      <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
        {logs.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
            No activity yet
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={log.id}
              style={{
                padding: '10px 16px',
                borderBottom: i < logs.length - 1 ? '1px solid #1e1e1e' : 'none',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              {/* dot */}
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: log.project?.color || '#3b82f6',
                marginTop: '5px',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', color: '#d0d0d0', fontWeight: 500, marginBottom: '2px' }}>
                  {log.action}
                </div>
                {log.detail && (
                  <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.detail}
                  </div>
                )}
                {log.project && (
                  <div style={{ fontSize: '11px', color: log.project.color, marginTop: '2px' }}>
                    {log.project.name}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#555', flexShrink: 0 }}>
                {timeAgo(log.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
