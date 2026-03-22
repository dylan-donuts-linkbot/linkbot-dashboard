import { createServerClient } from '@/lib/supabase-server'
import { Task, Project, ActivityLog, SpendLog, TokenUsage } from '@/types'
import QuickStats from '@/components/dashboard/QuickStats'
import ProjectHealthCard from '@/components/dashboard/ProjectHealthCard'
import ActivityFeed from '@/components/shared/ActivityFeed'
import EmptyState from '@/components/shared/EmptyState'
import DailyPriorityStack from '@/components/tasks/DailyPriorityStack'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

async function getDashboardData() {
  try {
    const supabase = await createServerClient()

    const [
      { data: projectsData },
      { data: tasksData },
      { data: activityData },
      { data: spendData },
      { data: tokenData },
    ] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: true }),
      supabase.from('tasks').select('*, project:projects(*)').order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*, project:projects(*)').order('created_at', { ascending: false }).limit(10),
      supabase.from('spend_log').select('*'),
      supabase.from('token_usage').select('*').order('created_at', { ascending: false }).limit(100),
    ])

    return {
      projects: (projectsData as Project[]) ?? [],
      tasks: (tasksData as Task[]) ?? [],
      activity: (activityData as ActivityLog[]) ?? [],
      spend: (spendData as SpendLog[]) ?? [],
      tokens: (tokenData as TokenUsage[]) ?? [],
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    return { projects: [], tasks: [], activity: [], spend: [], tokens: [] }
  }
}

export default async function DashboardPage() {
  const { projects, tasks, activity, spend, tokens } = await getDashboardData()

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const priorityTasks = tasks
    .filter(t => t.status !== 'done' && t.assignee === 'dylan' && t.priority_rank != null)
    .sort((a, b) => (a.priority_rank ?? 999) - (b.priority_rank ?? 999))
    .slice(0, 3)

  const doneThisWeek = tasks.filter(t => t.status === 'done' && t.updated_at >= weekAgo).length
  const activeTasks = tasks.filter(t => t.status !== 'done').length
  const activeProjects = projects.filter(p => p.status === 'active' || !p.status).length
  const totalSpend = spend.reduce((sum, s) => sum + Number(s.amount), 0)
  const totalTokenCost = tokens.reduce((sum, t) => sum + Number(t.cost_usd ?? 0), 0)

  const stats = [
    { label: 'Active Tasks', value: activeTasks, color: '#3b82f6' },
    { label: 'Done This Week', value: doneThisWeek, color: '#22c55e', subtext: 'last 7 days' },
    { label: 'Active Projects', value: activeProjects, color: '#6366f1' },
    { label: 'Total Spend', value: `$${totalSpend.toFixed(2)}`, color: '#f59e0b' },
    { label: 'Token Cost', value: `$${totalTokenCost.toFixed(4)}`, color: '#9ca3af', subtext: 'last 100 events' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: 700, color: '#f0f0f0' }}>
          {getGreeting()}, Dylan
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{formatDate()}</p>
      </div>

      {/* Quick Stats */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
        }}>
          {stats.map((stat, i) => (
            <div key={i} style={{
              background: '#111118',
              border: '1px solid #1e1e2e',
              borderRadius: '8px',
              padding: '16px 18px',
            }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color, lineHeight: 1.2, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>{stat.label}</div>
              {stat.subtext && (
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{stat.subtext}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Today's Priority */}
      <section style={{ marginBottom: '28px' }}>
        <DailyPriorityStackWrapper tasks={priorityTasks} />
      </section>

      {/* Main grid: Project Health + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        {/* Project Health */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f0f0f0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Project Health
            </h2>
            <Link href="/projects" style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {projects.length === 0 ? (
            <EmptyState
              icon="📁"
              title="No projects yet"
              description="Create your first project to get started."
              action={
                <Link href="/projects" style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: '#6366f1',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}>
                  Go to Projects
                </Link>
              }
            />
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '12px',
            }}>
              {projects.filter(p => p.status === 'active' || !p.status).map(project => (
                <ProjectHealthCard key={project.id} project={project} tasks={tasks} />
              ))}
            </div>
          )}
        </section>

        {/* Activity Feed */}
        <section style={{ position: 'sticky', top: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f0f0f0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Recent Activity
              </h2>
              <Link href="/activity" style={{ fontSize: '12px', color: '#6366f1', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>
          </div>
          <ActivityFeed logs={activity} maxHeight="480px" />
        </section>
      </div>
    </div>
  )
}

// Client wrapper for DailyPriorityStack (needs interactivity but data is server-fetched)
function DailyPriorityStackWrapper({ tasks }: { tasks: Task[] }) {
  return (
    <div>
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f0f0f0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Today&apos;s Priority
        </h2>
      </div>
      {tasks.length === 0 ? (
        <div style={{
          background: '#111118',
          border: '1px solid #1e1e2e',
          borderRadius: '10px',
          padding: '24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#e5e7eb' }}>No priority tasks</div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            Assign <code style={{ fontSize: '11px', background: '#1e1e2e', padding: '1px 5px', borderRadius: '3px' }}>priority_rank</code> and <code style={{ fontSize: '11px', background: '#1e1e2e', padding: '1px 5px', borderRadius: '3px' }}>assignee=dylan</code> to tasks to see them here.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tasks.map((task, i) => {
            const PRIORITY_COLORS: Record<string, string> = {
              low: '#22c55e', medium: '#eab308', high: '#f97316', urgent: '#ef4444',
            }
            const priorityColor = PRIORITY_COLORS[task.priority] ?? '#9ca3af'
            return (
              <Link
                key={task.id}
                href={`/my-tasks`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  background: '#111118',
                  border: '1px solid #1e1e2e',
                  borderRadius: '8px',
                  textDecoration: 'none',
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: i === 0 ? '#6366f1' : '#1e1e2e',
                  border: `2px solid ${i === 0 ? '#6366f1' : '#2e2e3e'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: i === 0 ? '#fff' : '#9ca3af',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                    {task.project && (
                      <span style={{ fontSize: '11px', color: task.project.color }}>{task.project.name}</span>
                    )}
                    <span style={{ fontSize: '11px', color: priorityColor, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
