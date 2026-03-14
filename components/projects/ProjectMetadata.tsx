'use client'

import { useState } from 'react'
import { Project, ProjectStatus } from '@/types'
import { updateProject } from '@/lib/actions'
import { useRouter } from 'next/navigation'

interface ProjectMetadataProps {
  project: Project
}

const STAGES = ['Idea', 'Planning', 'MVP', 'Beta', 'Launch', 'Scaling', 'Maintenance', 'Complete']
const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
  { value: 'complete', label: 'Complete' },
]
const COLORS = ['#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6b7280']

export default function ProjectMetadata({ project }: ProjectMetadataProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project.status ?? 'active')
  const [color, setColor] = useState(project.color)
  const [stage, setStage] = useState(project.stage ?? '')
  const [githubRepo, setGithubRepo] = useState(project.github_repo ?? '')
  const [vercelProject, setVercelProject] = useState(project.vercel_project ?? '')
  const [liveUrl, setLiveUrl] = useState(project.live_url ?? '')
  const [assignees, setAssignees] = useState((project.assignees ?? []).join(', '))

  async function handleSave() {
    setSaving(true)
    try {
      await updateProject(project.id, {
        name,
        description: description || null,
        status,
        color,
        stage: stage || null,
        github_repo: githubRepo || null,
        vercel_project: vercelProject || null,
        live_url: liveUrl || null,
        assignees: assignees ? assignees.split(',').map(s => s.trim()).filter(Boolean) : [],
      })
      setEditing(false)
      router.refresh()
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setName(project.name)
    setDescription(project.description ?? '')
    setStatus(project.status ?? 'active')
    setColor(project.color)
    setStage(project.stage ?? '')
    setGithubRepo(project.github_repo ?? '')
    setVercelProject(project.vercel_project ?? '')
    setLiveUrl(project.live_url ?? '')
    setAssignees((project.assignees ?? []).join(', '))
    setEditing(false)
  }

  return (
    <div style={{
      background: '#111118',
      border: '1px solid #1e1e2e',
      borderRadius: '10px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f0f0f0' }}>Project Details</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            style={{
              background: '#1e1e2e',
              border: '1px solid #2e2e3e',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '12px',
              color: '#9ca3af',
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCancel}
              style={{
                background: 'transparent',
                border: '1px solid #2e2e3e',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                color: '#9ca3af',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                background: '#6366f1',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <FieldRow label="Name">
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </FieldRow>

          <FieldRow label="Description">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </FieldRow>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <FieldRow label="Status">
              <select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)} style={inputStyle}>
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FieldRow>

            <FieldRow label="Stage">
              <select value={stage} onChange={e => setStage(e.target.value)} style={inputStyle}>
                <option value="">— None —</option>
                {STAGES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FieldRow>
          </div>

          <FieldRow label="Color">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '3px solid #fff' : '2px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </FieldRow>

          <FieldRow label="GitHub Repo (owner/repo)">
            <input
              value={githubRepo}
              onChange={e => setGithubRepo(e.target.value)}
              placeholder="e.g. dylan/my-project"
              style={inputStyle}
            />
          </FieldRow>

          <FieldRow label="Vercel Project">
            <input
              value={vercelProject}
              onChange={e => setVercelProject(e.target.value)}
              placeholder="project name in Vercel"
              style={inputStyle}
            />
          </FieldRow>

          <FieldRow label="Live URL">
            <input
              value={liveUrl}
              onChange={e => setLiveUrl(e.target.value)}
              placeholder="https://example.com"
              style={inputStyle}
            />
          </FieldRow>

          <FieldRow label="Assignees (comma-separated)">
            <input
              value={assignees}
              onChange={e => setAssignees(e.target.value)}
              placeholder="dylan, linkbot"
              style={inputStyle}
            />
          </FieldRow>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <MetaRow label="Status">
            <span style={{ fontSize: '13px', color: '#e5e7eb', textTransform: 'capitalize' }}>
              {project.status ?? 'active'}
            </span>
          </MetaRow>
          {project.stage && (
            <MetaRow label="Stage">
              <span style={{ fontSize: '13px', color: '#e5e7eb' }}>{project.stage}</span>
            </MetaRow>
          )}
          {project.github_repo && (
            <MetaRow label="GitHub">
              <a
                href={`https://github.com/${project.github_repo}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none' }}
              >
                {project.github_repo} ↗
              </a>
            </MetaRow>
          )}
          {project.vercel_project && (
            <MetaRow label="Vercel">
              <span style={{ fontSize: '13px', color: '#e5e7eb' }}>{project.vercel_project}</span>
            </MetaRow>
          )}
          {project.live_url && (
            <MetaRow label="Live URL">
              <a
                href={project.live_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: '#3b82f6', textDecoration: 'none' }}
              >
                {project.live_url} ↗
              </a>
            </MetaRow>
          )}
          {(project.assignees ?? []).length > 0 && (
            <MetaRow label="Assignees">
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(project.assignees ?? []).map(a => (
                  <span key={a} style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    background: '#1e1e2e',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}>
                    {a}
                  </span>
                ))}
              </div>
            </MetaRow>
          )}
          {!project.stage && !project.github_repo && !project.vercel_project && !project.live_url && (
            <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
              No metadata yet. Click Edit to add details.
            </div>
          )}
        </div>
      )}
    </div>
  )
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

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '12px', color: '#6b7280', width: '100px', flexShrink: 0, paddingTop: '1px' }}>
        {label}
      </span>
      {children}
    </div>
  )
}
