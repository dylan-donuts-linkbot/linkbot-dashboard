'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/types'

interface ProjectModalProps {
  onSave: (data: { name: string; color: string; context: string | null }) => Promise<void>
  onClose: () => void
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#22c55e', // green
  '#ef4444', // red
  '#a78bfa', // violet
  '#f97316', // orange
]

export default function ProjectModal({ onSave, onClose }: ProjectModalProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [context, setContext] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    await onSave({
      name: name.trim(),
      color,
      context: context.trim() || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#171717',
          border: '1px solid #2a2a2a',
          borderRadius: '10px',
          width: '100%',
          maxWidth: '500px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f0f0f0' }}>
            New Project
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#666', fontSize: '18px', padding: '4px 8px' }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px', fontWeight: 500 }}>
              Project Name *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Coin Launch, E-commerce Store..."
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSave() }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 500 }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? `3px solid #fff` : '3px solid transparent',
                    outline: color === c ? `2px solid ${c}` : 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'outline 0.1s',
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px', fontWeight: 500 }}>
              Project Context <span style={{ color: '#555', fontWeight: 400 }}>(user story, goals, notes)</span>
            </label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Describe what this project is, who it's for, what success looks like..."
              rows={6}
              style={{ resize: 'vertical', fontSize: '13px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            style={{ background: color, borderColor: color }}
          >
            {saving ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
