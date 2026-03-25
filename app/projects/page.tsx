'use client'

import { useState, useEffect } from 'react'
import { Project, Task, ProjectType } from '@/types'
import { supabase } from '@/lib/supabase'
import ProjectCard from '@/components/projects/ProjectCard'
import EmptyState from '@/components/shared/EmptyState'
import ProjectModal from '@/components/ProjectModal'
import { createProject } from '@/lib/actions'
import { useRouter } from 'next/navigation'

type FilterStatus = 'all' | 'active' | 'paused' | 'archived' | 'complete'

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showNewProject, setShowNewProject] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [{ data: projectsData }, { data: tasksData }] = await Promise.all([
          supabase.from('projects').select('*').order('created_at', { ascending: true }),
          supabase.from('tasks').select('id, status, project_id'),
        ])
        setProjects((projectsData as Project[]) ?? [])
        setTasks((tasksData as Task[]) ?? [])
      } catch (error) {
        console.error('Failed to load projects:', error)
        setLoadError(error instanceof Error ? error.message : 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = projects.filter(p => {
    if (filterStatus === 'all') return true
    return (p.status ?? 'active') === filterStatus
  })

  async function handleCreateProject(data: {
    name: string
    description: string | null
    color: string
    project_type: ProjectType
    type_config: Record<string, unknown>
    stack_info: Record<string, unknown>
  }) {
    await createProject({
      name: data.name,
      color: data.color,
      description: data.description,
      status: 'active',
      project_type: data.project_type,
      type_config: data.type_config,
      stack_info: data.stack_info,
    })
    router.refresh()
    const { data: projectsData } = await supabase.from('projects').select('*').order('created_at', { ascending: true })
    setProjects((projectsData as Project[]) ?? [])
  }

  const taskCounts = (projectId: string) => ({
    total: tasks.filter(t => t.project_id === projectId).length,
    done: tasks.filter(t => t.project_id === projectId && t.status === 'done').length,
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>Loading projects...</div>
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
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: '#f0f0f0' }}>Projects</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{projects.length} projects in your portfolio</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 16px', background: '#6366f1',
            border: 'none', borderRadius: '7px',
            fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer',
          }}
        >
          + New Project
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #1e1e2e', paddingBottom: '12px' }}>
        {(['all', 'active', 'paused', 'archived', 'complete'] as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            style={{
              padding: '5px 12px', fontSize: '12px', fontWeight: 500,
              background: filterStatus === f ? '#1e1e2e' : 'transparent',
              color: filterStatus === f ? '#f0f0f0' : '#6b7280',
              border: filterStatus === f ? '1px solid #2e2e3e' : '1px solid transparent',
              borderRadius: '6px', cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {f} {f !== 'all' && `(${projects.filter(p => (p.status ?? 'active') === f).length})`}
          </button>
        ))}
      </div>

      {/* Projects grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📁"
          title={filterStatus === 'all' ? 'No projects yet' : `No ${filterStatus} projects`}
          description={filterStatus === 'all' ? 'Create your first project to get started.' : `No projects with ${filterStatus} status.`}
          action={filterStatus === 'all' ? (
            <button
              onClick={() => setShowNewProject(true)}
              style={{
                padding: '8px 16px', background: '#6366f1',
                border: 'none', borderRadius: '6px',
                color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              + New Project
            </button>
          ) : undefined}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {filtered.map(project => {
            const counts = taskCounts(project.id)
            return (
              <ProjectCard
                key={project.id}
                project={project}
                taskCount={counts.total}
                doneCount={counts.done}
              />
            )
          })}
        </div>
      )}

      {showNewProject && (
        <ProjectModal
          onSave={handleCreateProject}
          onClose={() => setShowNewProject(false)}
        />
      )}
    </div>
  )
}
