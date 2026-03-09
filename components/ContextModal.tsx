'use client'

import { useEffect } from 'react'
import { Project } from '@/types'

interface ContextModalProps {
  project: Project
  onClose: () => void
}

export default function ContextModal({ project, onClose }: ContextModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

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
          border: `1px solid ${project.color}44`,
          borderRadius: '10px',
          width: '100%',
          maxWidth: '560px',
          padding: '24px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: project.color, flexShrink: 0 }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f0f0f0' }}>
              {project.name}
            </h2>
            <span style={{ fontSize: '12px', color: '#555' }}>Project Context</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#666', fontSize: '18px', padding: '4px 8px' }}
          >
            ×
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#111',
          border: '1px solid #2a2a2a',
          borderRadius: '6px',
          padding: '16px',
        }}>
          {project.context ? (
            <pre style={{
              margin: 0,
              fontSize: '13px',
              color: '#ccc',
              lineHeight: 1.6,
              fontFamily: 'inherit',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {project.context}
            </pre>
          ) : (
            <div style={{ color: '#555', fontSize: '13px', fontStyle: 'italic' }}>
              No context set for this project yet.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
