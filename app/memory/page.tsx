'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'core' | 'projects' | 'new'

interface ProjectFile {
  name: string
  path: string
  sha: string
  size: number
  slug: string
}

interface SaveStatus {
  type: 'idle' | 'saving' | 'success' | 'error'
  message?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateProjectMarkdown(fields: {
  name: string
  description: string
  stack: string
  goals: string
  constraints: string
  status: string
  notes: string
}): string {
  const today = new Date().toISOString().split('T')[0]
  return `# ${fields.name}

**Status:** ${fields.status}
**Created:** ${today}

## Description
${fields.description}

## Stack / Tech
${fields.stack}

## Goals
${fields.goals}

## Constraints
${fields.constraints}

## Notes
${fields.notes}
`
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SaveStatus }) {
  if (status.type === 'idle') return null
  const colors: Record<string, string> = {
    saving: '#888',
    success: '#22c55e',
    error: '#ef4444',
  }
  return (
    <span
      style={{
        fontSize: 12,
        color: colors[status.type] || '#888',
        marginLeft: 8,
      }}
    >
      {status.type === 'saving' && '⏳ Saving…'}
      {status.type === 'success' && '✓ Saved'}
      {status.type === 'error' && `✗ ${status.message || 'Error'}`}
    </span>
  )
}

// ─── Tab: Core Memory ────────────────────────────────────────────────────────

function CoreMemoryTab() {
  const [content, setContent] = useState('')
  const [sha, setSha] = useState('')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<SaveStatus>({ type: 'idle' })

  useEffect(() => {
    setLoading(true)
    fetch('/api/memory/core')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setStatus({ type: 'error', message: d.error })
        } else {
          setContent(d.content)
          setSha(d.sha)
        }
      })
      .catch(() => setStatus({ type: 'error', message: 'Network error' }))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setStatus({ type: 'saving' })
    const res = await fetch('/api/memory/core', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sha }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      setStatus({ type: 'error', message: data.error || 'Save failed' })
    } else {
      setSha(data.sha)
      setStatus({ type: 'success' })
      setTimeout(() => setStatus({ type: 'idle' }), 3000)
    }
  }

  if (loading) {
    return (
      <div style={{ color: 'var(--text-secondary)', padding: '32px 0', textAlign: 'center', fontSize: 14 }}>
        Loading MEMORY.md…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            MEMORY.md — core long-term memory
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={status} />
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={status.type === 'saving'}
          >
            {status.type === 'saving' ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        spellCheck={false}
        style={{
          width: '100%',
          minHeight: 520,
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text-primary)',
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6,
          padding: '12px 14px',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
      />
    </div>
  )
}

// ─── Tab: Projects ───────────────────────────────────────────────────────────

function ProjectsTab() {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [sha, setSha] = useState('')
  const [fileLoading, setFileLoading] = useState(false)
  const [status, setStatus] = useState<SaveStatus>({ type: 'idle' })

  useEffect(() => {
    fetch('/api/memory/projects')
      .then((r) => r.json())
      .then((d) => setFiles(d.files || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const loadFile = useCallback(async (slug: string) => {
    setSelected(slug)
    setFileLoading(true)
    setStatus({ type: 'idle' })
    const res = await fetch(`/api/memory/projects/${slug}`)
    const data = await res.json()
    if (!res.ok || data.error) {
      setStatus({ type: 'error', message: data.error || 'Failed to load' })
    } else {
      setContent(data.content)
      setSha(data.sha)
    }
    setFileLoading(false)
  }, [])

  async function handleSave() {
    if (!selected) return
    setStatus({ type: 'saving' })
    const res = await fetch(`/api/memory/projects/${selected}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, sha }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      setStatus({ type: 'error', message: data.error || 'Save failed' })
    } else {
      setSha(data.sha)
      setStatus({ type: 'success' })
      setTimeout(() => setStatus({ type: 'idle' }), 3000)
    }
  }

  if (loading) {
    return (
      <div style={{ color: 'var(--text-secondary)', padding: '32px 0', textAlign: 'center', fontSize: 14 }}>
        Loading projects…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 16, minHeight: 520 }}>
      {/* File list */}
      <div
        style={{
          width: 220,
          flexShrink: 0,
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            fontSize: 11,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          memory/projects/
        </div>
        {files.length === 0 ? (
          <div style={{ padding: '16px 14px', fontSize: 13, color: 'var(--text-secondary)' }}>
            No project files yet.
          </div>
        ) : (
          <div>
            {files.map((f) => (
              <button
                key={f.slug}
                onClick={() => loadFile(f.slug)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '9px 14px',
                  background: selected === f.slug ? 'var(--bg-hover)' : 'transparent',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: selected === f.slug ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: 13,
                  cursor: 'pointer',
                  border: 'none',
                  borderLeft: selected === f.slug ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (selected !== f.slug) {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selected !== f.slug) {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }
                }}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!selected ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: 14,
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'var(--bg-base)',
            }}
          >
            Select a project file to edit
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {selected}.md
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusBadge status={status} />
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={status.type === 'saving' || fileLoading}
                >
                  {status.type === 'saving' ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
            {fileLoading ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                }}
              >
                Loading…
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1,
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  lineHeight: 1.6,
                  padding: '12px 14px',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tab: New Project ─────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['active', 'planned', 'paused', 'complete'] as const
type ProjectStatus = (typeof STATUS_OPTIONS)[number]

function NewProjectTab({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stack, setStack] = useState('')
  const [goals, setGoals] = useState('')
  const [constraints, setConstraints] = useState('')
  const [status, setStatus] = useState<ProjectStatus>('active')
  const [notes, setNotes] = useState('')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ type: 'idle' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSaveStatus({ type: 'saving' })
    const slug = slugify(name)
    const content = generateProjectMarkdown({ name, description, stack, goals, constraints, status, notes })

    const res = await fetch(`/api/memory/projects/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, message: `Add project memory: ${name}` }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      setSaveStatus({ type: 'error', message: data.error || 'Save failed' })
    } else {
      setSaveStatus({ type: 'success', message: `Created ${slug}.md` })
      setName('')
      setDescription('')
      setStack('')
      setGoals('')
      setConstraints('')
      setStatus('active')
      setNotes('')
      setTimeout(() => {
        setSaveStatus({ type: 'idle' })
        onCreated()
      }, 1500)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontSize: 13,
    padding: '8px 12px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  }

  const labelStyle = {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 4,
    display: 'block' as const,
    fontWeight: 500,
  }

  const fieldStyle = {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 4,
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
      <div style={fieldStyle}>
        <label style={labelStyle}>Project Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Linkbot Dashboard"
          required
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
        {name && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            slug: memory/projects/{slugify(name)}.md
          </div>
        )}
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project?"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: 1.5 }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Stack / Tech</label>
        <input
          type="text"
          value={stack}
          onChange={(e) => setStack(e.target.value)}
          placeholder="e.g. Next.js, Supabase, Tailwind, TypeScript"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Goals</label>
        <textarea
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="What should this project achieve?"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: 1.5 }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Constraints</label>
        <textarea
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          placeholder="Known limitations, tech debt, non-goals…"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: 1.5 }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Status</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_OPTIONS.map((s) => {
            const active = status === s
            const statusColors: Record<string, string> = {
              active: '#22c55e',
              planned: '#3b82f6',
              paused: '#f59e0b',
              complete: '#888',
            }
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  border: `1px solid ${active ? statusColors[s] : 'var(--border)'}`,
                  background: active ? `${statusColors[s]}22` : 'transparent',
                  color: active ? statusColors[s] : 'var(--text-secondary)',
                  transition: 'all 0.1s',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else worth remembering…"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' as const, lineHeight: 1.5 }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
        <button
          type="submit"
          className="btn-primary"
          disabled={saveStatus.type === 'saving' || !name.trim()}
        >
          {saveStatus.type === 'saving' ? 'Creating…' : 'Create Project Memory'}
        </button>
        <StatusBadge status={saveStatus} />
      </div>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MemoryPage() {
  const [tab, setTab] = useState<Tab>('core')
  const [projectsKey, setProjectsKey] = useState(0)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'core', label: 'Core Memory' },
    { id: 'projects', label: 'Projects' },
    { id: 'new', label: '+ New Project' },
  ]

  function handleProjectCreated() {
    setTab('projects')
    setProjectsKey((k) => k + 1)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: 52,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            href="/"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Dashboard
          </Link>
          <span style={{ color: 'var(--border)', fontSize: 14 }}>|</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Memory Management
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          dylan-donuts-linkbot/linkbot-dashboard
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px' }}>
        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            marginBottom: 24,
            borderBottom: '1px solid var(--border)',
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
                marginBottom: -1,
                transition: 'color 0.1s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="card" style={{ padding: 20 }}>
          {tab === 'core' && <CoreMemoryTab />}
          {tab === 'projects' && <ProjectsTab key={projectsKey} />}
          {tab === 'new' && <NewProjectTab onCreated={handleProjectCreated} />}
        </div>
      </div>
    </div>
  )
}
