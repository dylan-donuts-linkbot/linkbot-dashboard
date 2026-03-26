'use client'

import { useState, useEffect } from 'react'
import { Task, Project, Priority, TaskStatus } from '@/types'

interface TaskModalProps {
  task: Task | null
  projects: Project[]
  defaultStatus?: TaskStatus
  onSave: (data: Partial<Task>) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']
const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  urgent: '#ef4444',
}

export default function TaskModal({ task, projects, defaultStatus, onSave, onDelete, onClose }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [instructions, setInstructions] = useState(task?.instructions ?? '')
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus ?? 'backlog')
  const [projectId, setProjectId] = useState<string>(task?.project_id ?? '')
  const [agentName, setAgentName] = useState<string>(task?.agent_name ?? '')
  const [assignee, setAssignee] = useState<string>(task?.assignee ?? 'dylan')
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>(task?.estimated_minutes?.toString() ?? '')
  const [dueDate, setDueDate] = useState<string>(task?.due_date ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'details'>('basic')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      title: title.trim(),
      description: description.trim() || null,
      instructions: instructions.trim() || null,
      priority,
      status,
      project_id: projectId || null,
      agent_name: agentName.trim() || null,
      assignee: assignee.trim() || 'dylan',
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : null,
      due_date: dueDate || null,
    })
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!onDelete) return
    setDeleting(true)
    await onDelete()
    setDeleting(false)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '560px',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', padding: '4px 8px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border-card)', marginBottom: '20px' }}>
          {(['basic', 'details'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'basic' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Title *">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSave() }}
                style={inputStyle}
              />
            </Field>

            <Field label="Description">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional details..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>

            <Field label="Project">
              <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inputStyle}>
                <option value="">No project</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Priority">
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {PRIORITIES.map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      style={{
                        padding: '4px 9px',
                        fontSize: '11px',
                        fontWeight: priority === p ? 700 : 400,
                        background: priority === p ? PRIORITY_COLORS[p] + '22' : 'transparent',
                        color: priority === p ? PRIORITY_COLORS[p] : 'var(--text-muted)',
                        border: `1px solid ${priority === p ? PRIORITY_COLORS[p] : 'var(--border-card)'}`,
                        borderRadius: '5px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Status">
                <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)} style={inputStyle}>
                  {STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Instructions (for AI agents)">
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="Step-by-step instructions or context for the agent..."
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Assignee">
                <input
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                  placeholder="dylan, linkbot..."
                  style={inputStyle}
                />
              </Field>

              <Field label="Agent Name">
                <input
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  placeholder="linkbot-main"
                  style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px' }}
                />
              </Field>

              <Field label="Estimated (minutes)">
                <input
                  type="number"
                  value={estimatedMinutes}
                  onChange={e => setEstimatedMinutes(e.target.value)}
                  placeholder="30"
                  min={1}
                  style={inputStyle}
                />
              </Field>

              <Field label="Due Date">
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', gap: '8px' }}>
          <div>
            {task && onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-danger"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || !title.trim()}
              style={{ background: '#6366f1' }}
            >
              {saving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-deep)',
  border: '1px solid var(--border-card)',
  borderRadius: '6px',
  padding: '8px 10px',
  fontSize: '13px',
  color: 'var(--text-light)',
  width: '100%',
  outline: 'none',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
