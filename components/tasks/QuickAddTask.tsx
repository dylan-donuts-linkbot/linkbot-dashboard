'use client'

import { useState } from 'react'
import { Project, TaskStatus, Priority } from '@/types'
import { createTask } from '@/lib/actions'
import { useRouter } from 'next/navigation'

interface QuickAddTaskProps {
  projects: Project[]
  defaultProjectId?: string
  defaultStatus?: TaskStatus
  onAdded?: () => void
}

export default function QuickAddTask({ projects, defaultProjectId, defaultStatus = 'backlog', onAdded }: QuickAddTaskProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(defaultProjectId ?? '')
  const [priority, setPriority] = useState<Priority>('medium')
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  async function handleAdd() {
    if (!title.trim()) return
    setSaving(true)
    setAddError(null)
    try {
      await createTask({
        title: title.trim(),
        status: defaultStatus,
        priority,
        project_id: projectId || null,
        assignee: 'dylan',
      })
      setTitle('')
      setOpen(false)
      onAdded?.()
      router.refresh()
    } catch (error) {
      console.error('Failed to add task:', error)
      setAddError(error instanceof Error ? error.message : 'Failed to add task')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          background: '#6366f1',
          border: 'none',
          borderRadius: '7px',
          fontSize: '13px',
          fontWeight: 600,
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        + Add Task
      </button>
    )
  }

  return (
    <div style={{
      background: '#111118',
      border: '1px solid #6366f144',
      borderRadius: '8px',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task title..."
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') handleAdd()
          if (e.key === 'Escape') setOpen(false)
        }}
        style={{
          background: '#0a0a0f',
          border: '1px solid #1e1e2e',
          borderRadius: '6px',
          padding: '8px 10px',
          fontSize: '13px',
          color: '#e5e7eb',
          width: '100%',
          outline: 'none',
        }}
      />
      {addError && (
        <div style={{ fontSize: '12px', color: '#f87171', padding: '4px 0' }}>
          ⚠ {addError}
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          style={{
            background: '#0a0a0f',
            border: '1px solid #1e1e2e',
            borderRadius: '6px',
            padding: '5px 8px',
            fontSize: '12px',
            color: '#e5e7eb',
            outline: 'none',
          }}
        >
          <option value="">No project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(p => (
          <button
            key={p}
            onClick={() => setPriority(p)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: priority === p ? 700 : 400,
              background: priority === p ? '#6366f122' : 'transparent',
              color: priority === p ? '#a5b4fc' : '#6b7280',
              border: `1px solid ${priority === p ? '#6366f1' : '#1e1e2e'}`,
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {p}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setOpen(false)}
          style={{
            background: 'transparent',
            border: '1px solid #1e1e2e',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '12px',
            color: '#9ca3af',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          disabled={saving || !title.trim()}
          style={{
            background: '#6366f1',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#fff',
            cursor: 'pointer',
            opacity: saving || !title.trim() ? 0.6 : 1,
          }}
        >
          {saving ? 'Adding...' : 'Add'}
        </button>
      </div>
    </div>
  )
}
