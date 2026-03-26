'use client'

import { useState, useEffect, useCallback } from 'react'
import { Task, Project } from '@/types'
import { supabase } from '@/lib/supabase'
import KanbanBoard from '@/components/kanban/KanbanBoard'
import QuickAddTask from '@/components/tasks/QuickAddTask'
import ColorDot from '@/components/shared/ColorDot'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function KanbanPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filterProject, setFilterProject] = useState<string>(searchParams.get('project') ?? 'all')

  const loadData = useCallback(async () => {
    setLoadError(null)
    try {
      const [{ data: tasksData }, { data: projectsData }] = await Promise.all([
        supabase.from('tasks').select('*, project:projects(*)').order('created_at', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: true }),
      ])
      setTasks((tasksData as Task[]) ?? [])
      setProjects((projectsData as Project[]) ?? [])
    } catch (error) {
      console.error('Failed to load kanban data:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load board data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Update URL when filter changes
  function handleProjectFilter(projectId: string) {
    setFilterProject(projectId)
    if (projectId === 'all') {
      router.replace('/kanban')
    } else {
      router.replace(`/kanban?project=${projectId}`)
    }
  }

  const selectedProject = projects.find(p => p.id === filterProject)
  const activeCounts = {
    backlog: tasks.filter(t => t.status === 'backlog' && (filterProject === 'all' || t.project_id === filterProject)).length,
    in_progress: tasks.filter(t => t.status === 'in_progress' && (filterProject === 'all' || t.project_id === filterProject)).length,
    in_review: tasks.filter(t => t.status === 'in_review' && (filterProject === 'all' || t.project_id === filterProject)).length,
    done: tasks.filter(t => t.status === 'done' && (filterProject === 'all' || t.project_id === filterProject)).length,
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading board...</div>
      </div>
    )
  }

  return (
    <div>
      {loadError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', marginBottom: '16px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '7px', fontSize: '13px', color: '#f87171',
        }}>
          <span>⚠</span>
          <span style={{ flex: 1 }}>{loadError}</span>
          <button onClick={loadData} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
            Retry
          </button>
        </div>
      )}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Kanban</h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            {activeCounts.in_progress} in progress · {activeCounts.backlog} backlog
          </p>
        </div>
        <QuickAddTask
          projects={projects}
          defaultProjectId={filterProject !== 'all' ? filterProject : undefined}
          onAdded={loadData}
        />
      </div>

      {/* Project filter */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>Filter:</span>
        <button
          onClick={() => handleProjectFilter('all')}
          style={{
            padding: '5px 12px',
            fontSize: '12px',
            background: filterProject === 'all' ? '#6366f1' : 'var(--bg-card)',
            color: filterProject === 'all' ? '#fff' : 'var(--text-secondary)',
            border: filterProject === 'all' ? '1px solid #6366f1' : '1px solid var(--border-card)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: filterProject === 'all' ? 600 : 400,
          }}
        >
          All Projects
        </button>
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => handleProjectFilter(p.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              fontSize: '12px',
              background: filterProject === p.id ? p.color + '22' : 'var(--bg-card)',
              color: filterProject === p.id ? p.color : 'var(--text-secondary)',
              border: `1px solid ${filterProject === p.id ? p.color + '66' : 'var(--border-card)'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: filterProject === p.id ? 600 : 400,
            }}
          >
            <ColorDot color={p.color} size={6} />
            {p.name}
          </button>
        ))}
      </div>

      {/* Context banner when project filtered */}
      {selectedProject && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          background: selectedProject.color + '11',
          border: `1px solid ${selectedProject.color}33`,
          borderRadius: '7px',
          marginBottom: '16px',
        }}>
          <ColorDot color={selectedProject.color} size={8} />
          <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: 600 }}>{selectedProject.name}</span>
          {selectedProject.stage && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>· {selectedProject.stage}</span>
          )}
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
            {activeCounts.in_progress + activeCounts.backlog + activeCounts.in_review + activeCounts.done} total tasks
          </span>
        </div>
      )}

      {/* Kanban board */}
      <KanbanBoard
        initialTasks={tasks}
        projects={projects}
        activeProjectId={filterProject !== 'all' ? filterProject : null}
      />
    </div>
  )
}

export default function KanbanPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    }>
      <KanbanPageInner />
    </Suspense>
  )
}
