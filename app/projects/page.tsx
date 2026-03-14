'use client'

import { useState, useEffect } from 'react'
import { Project, Task } from '@/types'
import { supabase } from '@/lib/supabase'
import ProjectCard from '@/components/projects/ProjectCard'
import EmptyState from '@/components/shared/EmptyState'
import TaskModal from '@/components/tasks/TaskModal'
import { createProject } from '@/lib/actions'
import { useRouter } from 'next/navigation'

const PROJECT_COLORS = [
  '#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6b7280',
]

type FilterStatus = 'all' | 'active' | 'paused' | 'archived' | 'complete'

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showNewProject, setShowNewProject] = useState(false)

  // New project form state
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [{ data: projectsData }, { data: tasksData }] = await Promise.all([
          supabase.from('projects').select('*').order('created_at', { ascending: true }),
          supabase.from('tasks').select('id, status, project_id'),
        ])
        setProjects((projectsData as Project[]) ?? [])
        setTasks((tasksData as Task[]) ?? [])
      } catch {
        // ignore
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

  async function handleCreateProject() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await createProject({
        name: newName.trim(),
        color: newColor,
        description: newDescription.trim() || null,
        status: 'active',
      })
      setNewName('')
      setNewDescription('')
      setNewColor('#6366f1')
      setShowNewProject(false)
      router.refresh()
      // Reload
      const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: true })
      setProjects((data as Project[]) ?? [])
    } catch {
      // ignore
    } finally {
      setCreating(false)
    }
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: '#f0f0f0' }}>Projects</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{projects.length} projects in your portfolio</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            background: '#6366f1',
            border: 'none',
            borderRadius: '7px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#fff',
            cursor: 'pointer',
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
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 500,
              background: filterStatus === f ? '#1e1e2e' : 'transparent',
              color: filterStatus === f ? '#f0f0f0' : '#6b7280',
              border: filterStatus === f ? '1px solid #2e2e3e' : '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              textTransform: 'capitalize',
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
                padding: '8px 16px',
                background: '#6366f1',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
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

      {/* New Project Modal */}
      {showNewProject && (
        <div
          onClick={() => setShowNewProject(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111118',
              border: '1px solid #1e1e2e',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f0f0f0' }}>New Project</h2>
              <button
                onClick={() => setShowNewProject(false)}
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '20px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Project name"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateProject() }}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="What is this project about?"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PROJECT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: c,
                        border: newColor === c ? '3px solid #fff' : '2px solid transparent',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
              <button className="btn-ghost" onClick={() => setShowNewProject(false)}>Cancel</button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !newName.trim()}
                style={{
                  background: '#6366f1',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  opacity: creating || !newName.trim() ? 0.6 : 1,
                }}
              >
                {creating ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Suppress unused import warning — TaskModal used for type reference
void (TaskModal)

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: '#9ca3af',
  fontWeight: 600,
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const inputStyle: React.CSSProperties = {
  background: '#0a0a0f',
  border: '1px solid #1e1e2e',
  borderRadius: '6px',
  padding: '8px 10px',
  fontSize: '13px',
  color: '#e5e7eb',
  width: '100%',
  outline: 'none',
}
