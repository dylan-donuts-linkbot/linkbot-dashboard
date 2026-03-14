'use client'

import { useState } from 'react'
import { Project } from '@/types'
import { updateProject } from '@/lib/actions'
import { useRouter } from 'next/navigation'

interface PRDSectionProps {
  project: Project
}

export default function PRDSection({ project }: PRDSectionProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [prdContent, setPrdContent] = useState(project.prd_content ?? '')
  const [prdUrl, setPrdUrl] = useState(project.prd_url ?? '')

  async function handleSave() {
    setSaving(true)
    try {
      await updateProject(project.id, {
        prd_content: prdContent || null,
        prd_url: prdUrl || null,
      })
      setEditing(false)
      router.refresh()
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
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
        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 600, color: '#f0f0f0' }}>
            PRD / Context
          </h2>
          {project.prd_url && (
            <a
              href={project.prd_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}
            >
              External PRD ↗
            </a>
          )}
        </div>
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
            {project.prd_content ? 'Edit' : 'Add PRD'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setPrdContent(project.prd_content ?? ''); setPrdUrl(project.prd_url ?? ''); setEditing(false) }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              External PRD URL (optional)
            </label>
            <input
              value={prdUrl}
              onChange={e => setPrdUrl(e.target.value)}
              placeholder="https://notion.so/..."
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
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              PRD Content (Markdown supported)
            </label>
            <textarea
              value={prdContent}
              onChange={e => setPrdContent(e.target.value)}
              rows={16}
              placeholder="## Overview&#10;&#10;Describe the project goal, features, and requirements...&#10;&#10;## Features&#10;&#10;- Feature 1&#10;- Feature 2"
              style={{
                background: '#0a0a0f',
                border: '1px solid #1e1e2e',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '13px',
                color: '#e5e7eb',
                width: '100%',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'monospace',
                lineHeight: 1.6,
              }}
            />
          </div>
        </div>
      ) : project.prd_content ? (
        <div style={{
          fontSize: '13px',
          color: '#d1d5db',
          lineHeight: 1.8,
          whiteSpace: 'pre-wrap',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          padding: '4px 0',
        }}>
          {project.prd_content}
        </div>
      ) : (
        <div style={{
          padding: '32px',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '13px',
          border: '2px dashed #1e1e2e',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
          <div>No PRD or context added yet.</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>Click &quot;Add PRD&quot; to add project requirements, notes, or context.</div>
        </div>
      )}
    </div>
  )
}
