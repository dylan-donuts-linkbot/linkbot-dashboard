'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, Project, ActivityLog, Metrics, SpendLog, Session } from '@/types'
import Header from '@/components/Header'
import MetricsPanel from '@/components/MetricsPanel'
import KanbanBoard from '@/components/KanbanBoard'
import ActivityFeed from '@/components/ActivityFeed'

const DEFAULT_PROJECTS: Project[] = [
  { id: 'coin-launch', name: 'Coin Launch', color: '#f59e0b', created_at: '' },
  { id: 'ecom-1', name: 'E-commerce 1', color: '#3b82f6', created_at: '' },
]

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activity, setActivity] = useState<ActivityLog[]>([])
  const [metrics, setMetrics] = useState<Metrics>({
    sessionCount: 0,
    tasksCompletedThisWeek: 0,
    activeProjectsCount: 0,
    totalSpend: 0,
    spendByProject: [],
  })
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url'

  const loadAll = useCallback(async () => {
    if (!isConfigured) {
      // Show demo data when Supabase isn't configured
      setProjects(DEFAULT_PROJECTS)
      setTasks([
        {
          id: 'demo-1',
          title: 'Design tokenomics for coin launch',
          description: 'Figure out total supply, distribution, and vesting schedules.',
          status: 'in_progress',
          priority: 'urgent',
          project_id: 'coin-launch',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          project: DEFAULT_PROJECTS[0],
        },
        {
          id: 'demo-2',
          title: 'Set up Shopify store',
          description: 'Pick theme, install apps, configure payment gateway.',
          status: 'backlog',
          priority: 'high',
          project_id: 'ecom-1',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString(),
          project: DEFAULT_PROJECTS[1],
        },
        {
          id: 'demo-3',
          title: 'Deploy smart contract to testnet',
          description: 'Use Hardhat, verify on Etherscan.',
          status: 'backlog',
          priority: 'high',
          project_id: 'coin-launch',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date().toISOString(),
          project: DEFAULT_PROJECTS[0],
        },
        {
          id: 'demo-4',
          title: 'Write landing page copy',
          description: null,
          status: 'in_review',
          priority: 'medium',
          project_id: 'coin-launch',
          created_at: new Date(Date.now() - 259200000).toISOString(),
          updated_at: new Date().toISOString(),
          project: DEFAULT_PROJECTS[0],
        },
        {
          id: 'demo-5',
          title: 'Source initial product inventory',
          description: 'Contact suppliers for MOQ + pricing.',
          status: 'done',
          priority: 'medium',
          project_id: 'ecom-1',
          created_at: new Date(Date.now() - 345600000).toISOString(),
          updated_at: new Date().toISOString(),
          project: DEFAULT_PROJECTS[1],
        },
      ])
      setActivity([
        {
          id: 'a1',
          action: 'Dashboard initialized',
          detail: 'Connect Supabase to go live',
          project_id: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'a2',
          action: 'Demo data loaded',
          detail: 'Showing sample tasks — fill in .env.local to connect real data',
          project_id: null,
          created_at: new Date(Date.now() - 60000).toISOString(),
        },
      ])
      setMetrics({
        sessionCount: 0,
        tasksCompletedThisWeek: 1,
        activeProjectsCount: 2,
        totalSpend: 0,
        spendByProject: [],
      })
      setLoading(false)
      return
    }

    try {
      setError(null)

      const [
        { data: projectsData },
        { data: tasksData },
        { data: activityData },
        { data: sessionsData },
        { data: spendData },
      ] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*, project:projects(*)').order('created_at', { ascending: false }),
        supabase.from('activity_log').select('*, project:projects(*)').order('created_at', { ascending: false }).limit(50),
        supabase.from('sessions').select('id, started_at'),
        supabase.from('spend_log').select('*, project:projects(id, name, color)'),
      ])

      const projectList = (projectsData as Project[]) || []
      const taskList = (tasksData as Task[]) || []
      const activityList = (activityData as ActivityLog[]) || []
      const sessionList = (sessionsData as Session[]) || []
      const spendList = (spendData as SpendLog[]) || []

      setProjects(projectList)
      setTasks(taskList)
      setActivity(activityList)

      // Compute metrics
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const doneThisWeek = taskList.filter(
        t => t.status === 'done' && t.updated_at >= weekAgo
      ).length

      const totalSpend = spendList.reduce((sum, s) => sum + Number(s.amount), 0)

      const spendByProjectMap: Record<string, { project: string; amount: number; color: string }> = {}
      spendList.forEach(s => {
        if (!s.project_id) return
        const proj = s.project
        if (!proj) return
        if (!spendByProjectMap[s.project_id]) {
          spendByProjectMap[s.project_id] = { project: proj.name, amount: 0, color: proj.color }
        }
        spendByProjectMap[s.project_id].amount += Number(s.amount)
      })

      setMetrics({
        sessionCount: sessionList.length,
        tasksCompletedThisWeek: doneThisWeek,
        activeProjectsCount: projectList.length,
        totalSpend,
        spendByProject: Object.values(spendByProjectMap).sort((a, b) => b.amount - a.amount),
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [isConfigured])

  useEffect(() => { loadAll() }, [loadAll])

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f' }}>
      <Header
        activeProject={activeProject}
        projects={projects}
        onSelectProject={setActiveProject}
      />

      <main style={{ padding: '20px 24px', maxWidth: '1600px', margin: '0 auto' }}>

        {/* Setup banner */}
        {!isConfigured && (
          <div style={{
            background: '#1a1200',
            border: '1px solid #f59e0b44',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{ fontSize: '15px' }}>⚠️</span>
            <div>
              <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 500 }}>
                Demo mode — Supabase not connected.
              </span>
              <span style={{ fontSize: '13px', color: '#888', marginLeft: '8px' }}>
                Fill in <code style={{ background: '#222', padding: '1px 5px', borderRadius: '3px', fontSize: '12px' }}>.env.local</code> with your Supabase URL and anon key to go live.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: '#1a0000',
            border: '1px solid #ef444444',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#ef4444',
            fontSize: '13px',
          }}>
            ⛔ {error}
          </div>
        )}

        {/* Metrics row */}
        <section style={{ marginBottom: '20px' }}>
          <MetricsPanel metrics={metrics} />
        </section>

        {/* Main content: Kanban + Activity side by side */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: '16px',
          alignItems: 'start',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Kanban
              </h2>
              {loading && (
                <span style={{ fontSize: '12px', color: '#555' }}>Loading...</span>
              )}
            </div>
            <KanbanBoard
              tasks={tasks}
              projects={projects}
              activeProject={activeProject}
              onTasksChange={loadAll}
            />
          </div>

          <div style={{ position: 'sticky', top: '72px' }}>
            <div style={{ marginBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Activity
              </h2>
            </div>
            <ActivityFeed logs={activity} />
          </div>
        </section>
      </main>
    </div>
  )
}
