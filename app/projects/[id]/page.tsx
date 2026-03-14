import { createServerClient } from '@/lib/supabase'
import { Project, Task, ActivityLog } from '@/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProjectHeader from '@/components/projects/ProjectHeader'
import ProjectMetadata from '@/components/projects/ProjectMetadata'
import PRDSection from '@/components/projects/PRDSection'
import ProjectTaskSummary from '@/components/projects/ProjectTaskSummary'
import ActivityFeed from '@/components/shared/ActivityFeed'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getProjectData(id: string) {
  try {
    const supabase = createServerClient()
    const [
      { data: project, error: projectError },
      { data: tasks },
      { data: activity },
    ] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('tasks').select('*, project:projects(*)').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*, project:projects(*)').eq('project_id', id).order('created_at', { ascending: false }).limit(20),
    ])

    if (projectError || !project) return null

    return {
      project: project as Project,
      tasks: (tasks as Task[]) ?? [],
      activity: (activity as ActivityLog[]) ?? [],
    }
  } catch {
    return null
  }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const data = await getProjectData(id)

  if (!data) {
    notFound()
  }

  const { project, tasks, activity } = data

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          href="/projects"
          style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}
        >
          ← Projects
        </Link>
      </div>

      {/* Project header */}
      <ProjectHeader project={project} />

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        <div>
          {/* Metadata */}
          <ProjectMetadata project={project} />

          {/* PRD */}
          <PRDSection project={project} />

          {/* Tasks */}
          <ProjectTaskSummary project={project} tasks={tasks} />
        </div>

        {/* Activity sidebar */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Activity
            </h3>
          </div>
          <ActivityFeed logs={activity} maxHeight="500px" />
        </div>
      </div>
    </div>
  )
}
