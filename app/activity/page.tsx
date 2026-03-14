import { createServerClient } from '@/lib/supabase'
import { ActivityLog, Project } from '@/types'
import EmptyState from '@/components/shared/EmptyState'

export const dynamic = 'force-dynamic'

async function getActivityData() {
  try {
    const supabase = createServerClient()
    const [{ data: activityData }, { data: projectsData }] = await Promise.all([
      supabase
        .from('activity_log')
        .select('*, project:projects(*)')
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('projects').select('id, name, color').order('created_at', { ascending: true }),
    ])
    return {
      activity: (activityData as ActivityLog[]) ?? [],
      projects: (projectsData as Project[]) ?? [],
    }
  } catch {
    return { activity: [], projects: [] }
  }
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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Group by date
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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date >= today) return 'Today'
  if (date >= yesterday) return 'Yesterday'
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default async function ActivityPage() {
  const { activity, projects } = await getActivityData()
  const grouped = groupByDate(activity)
  const dateKeys = Object.keys(grouped).sort().reverse()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: '#f0f0f0' }}>Activity Log</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            {activity.length} events · {projects.length} projects
          </p>
        </div>
      </div>

      {activity.length === 0 ? (
        <EmptyState
          icon="⚡"
          title="No activity yet"
          description="Activity events will appear here as work is done via LinkBot."
        />
      ) : (
        <div style={{ maxWidth: '720px' }}>
          {dateKeys.map(date => (
            <div key={date} style={{ marginBottom: '32px' }}>
              {/* Date header */}
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                {formatGroupDate(date)}
                <div style={{ flex: 1, height: '1px', background: '#1e1e2e' }} />
                <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400, letterSpacing: '0' }}>
                  {grouped[date].length} events
                </span>
              </div>

              {/* Events */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {grouped[date].map((log, i) => {
                  const isLast = i === grouped[date].length - 1
                  return (
                    <div key={log.id} style={{ display: 'flex', gap: '0' }}>
                      {/* Timeline */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px', flexShrink: 0 }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: log.project?.color ?? '#6366f1',
                          border: '2px solid #0a0a0f',
                          marginTop: '14px',
                          zIndex: 1,
                          flexShrink: 0,
                        }} />
                        {!isLast && (
                          <div style={{ width: '1px', flex: 1, background: '#1e1e2e', marginTop: '2px' }} />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{
                        flex: 1,
                        padding: '10px 0 12px 12px',
                        borderBottom: !isLast ? '0' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#e5e7eb', marginBottom: '2px' }}>
                              {log.action}
                            </div>
                            {log.detail && (
                              <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.5, marginBottom: '4px' }}>
                                {log.detail}
                              </div>
                            )}
                            {log.project && (
                              <span style={{
                                fontSize: '11px',
                                color: log.project.color,
                                background: log.project.color + '15',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                fontWeight: 500,
                              }}>
                                {log.project.name}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', flexShrink: 0, marginTop: '2px' }} title={formatDateTime(log.created_at)}>
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

          {activity.length >= 200 && (
            <div style={{ textAlign: 'center', padding: '20px', fontSize: '13px', color: '#6b7280' }}>
              Showing latest 200 events
            </div>
          )}
        </div>
      )}
    </div>
  )
}
