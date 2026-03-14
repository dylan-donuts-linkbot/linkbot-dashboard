import { ActivityLog } from '@/types'
import EmptyState from './EmptyState'

interface ActivityFeedProps {
  logs: ActivityLog[]
  maxHeight?: string
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
    <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid #1e1e2e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#f0f0f0' }}>
          Activity
        </h3>
        <span style={{ fontSize: '11px', color: '#6b7280' }}>{logs.length} events</span>
      </div>

      <div style={{ overflowY: 'auto', maxHeight }}>
        {logs.length === 0 ? (
          <EmptyState
            icon="⚡"
            title="No activity yet"
            description="Events will appear here as work gets done."
          />
        ) : (
          logs.map((log, i) => (
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
                <div style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: 500, marginBottom: '2px' }}>
                  {log.action}
                </div>
                {log.detail && (
                  <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {log.detail}
                  </div>
                )}
                {log.project && (
                  <div style={{ fontSize: '11px', color: log.project.color, marginTop: '2px' }}>
                    {log.project.name}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280', flexShrink: 0 }}>
                {timeAgo(log.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
