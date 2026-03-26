'use client'

import { useState } from 'react'
import { ProjectType } from '@/types'
import {
  PROJECT_TYPE_LABELS,
  PROJECT_TYPE_DESCRIPTIONS,
  PROJECT_TYPE_COLORS,
  DEFAULT_TYPE_CONFIGS,
  DEFAULT_STACK_INFO,
  getAllProjectTypes,
} from '@/lib/project-types-config'

interface CreateData {
  name: string
  description: string | null
  color: string
  project_type: ProjectType
  type_config: Record<string, unknown>
  stack_info: Record<string, unknown>
}

interface ProjectModalProps {
  onSave: (data: CreateData) => Promise<void>
  onClose: () => void
}

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#22c55e', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

// Field definitions for type config forms
type FieldDef =
  | { key: string; label: string; type: 'boolean' }
  | { key: string; label: string; type: 'select'; options: { value: string; label: string }[] }

const TYPE_CONFIG_FIELDS: Record<ProjectType, FieldDef[]> = {
  web_app: [
    { key: 'ui_library', label: 'UI Library', type: 'select', options: [
      { value: 'tailwind_shadcn', label: 'Tailwind + shadcn/ui' },
      { value: 'tailwind_only', label: 'Tailwind only' },
      { value: 'material_ui', label: 'Material UI' },
    ]},
    { key: 'auth_method', label: 'Auth Method', type: 'select', options: [
      { value: 'supabase', label: 'Supabase Auth' },
      { value: 'oauth_only', label: 'OAuth only' },
      { value: 'email_only', label: 'Email only' },
    ]},
    { key: 'database', label: 'Database', type: 'select', options: [
      { value: 'supabase', label: 'Supabase' },
      { value: 'other', label: 'Other' },
    ]},
    { key: 'deployment', label: 'Deployment', type: 'select', options: [
      { value: 'vercel', label: 'Vercel' },
      { value: 'netlify', label: 'Netlify' },
      { value: 'self_hosted', label: 'Self-hosted' },
    ]},
    { key: 'analytics_enabled', label: 'Analytics Enabled', type: 'boolean' },
    { key: 'api_rate_limiting', label: 'API Rate Limiting', type: 'boolean' },
  ],
  ios_app: [
    { key: 'ui_framework', label: 'UI Framework', type: 'select', options: [
      { value: 'swiftui', label: 'SwiftUI' },
      { value: 'uikit', label: 'UIKit' },
    ]},
    { key: 'backend', label: 'Backend', type: 'select', options: [
      { value: 'supabase', label: 'Supabase' },
      { value: 'custom_api', label: 'Custom API' },
      { value: 'none', label: 'None (local only)' },
    ]},
    { key: 'auth_method', label: 'Auth Method', type: 'select', options: [
      { value: 'supabase', label: 'Supabase Auth' },
      { value: 'oauth', label: 'OAuth' },
      { value: 'email_only', label: 'Email only' },
    ]},
    { key: 'local_persistence', label: 'Local Storage', type: 'select', options: [
      { value: 'core_data', label: 'Core Data' },
      { value: 'sqlite', label: 'SQLite' },
      { value: 'userdefaults', label: 'UserDefaults' },
      { value: 'none', label: 'None' },
    ]},
    { key: 'push_notifications', label: 'Push Notifications', type: 'boolean' },
    { key: 'app_store_distribution', label: 'App Store Distribution', type: 'boolean' },
    { key: 'ipad_support', label: 'iPad Support', type: 'boolean' },
  ],
  macos_app: [
    { key: 'ui_framework', label: 'UI Framework', type: 'select', options: [
      { value: 'swiftui', label: 'SwiftUI' },
      { value: 'appkit', label: 'AppKit' },
    ]},
    { key: 'backend', label: 'Backend', type: 'select', options: [
      { value: 'supabase', label: 'Supabase' },
      { value: 'custom_api', label: 'Custom API' },
      { value: 'local_only', label: 'Local only' },
    ]},
    { key: 'distribution', label: 'Distribution', type: 'select', options: [
      { value: 'direct_download', label: 'Direct Download' },
      { value: 'mac_app_store', label: 'Mac App Store' },
      { value: 'homebrew', label: 'Homebrew' },
    ]},
    { key: 'file_handling', label: 'File Handling', type: 'select', options: [
      { value: 'none', label: 'None' },
      { value: 'document_based', label: 'Document-based' },
      { value: 'import_export', label: 'Import / Export' },
    ]},
    { key: 'menu_bar_app', label: 'Menu Bar App', type: 'boolean' },
    { key: 'code_signing', label: 'Code Signing + Notarization', type: 'boolean' },
  ],
  ecommerce: [
    { key: 'backend', label: 'Backend', type: 'select', options: [
      { value: 'supabase_stripe', label: 'Supabase + Stripe' },
      { value: 'shopify_headless', label: 'Shopify (headless)' },
    ]},
    { key: 'payment', label: 'Payment Provider', type: 'select', options: [
      { value: 'stripe', label: 'Stripe' },
      { value: 'square', label: 'Square' },
      { value: 'shopify_payments', label: 'Shopify Payments' },
    ]},
    { key: 'shipping', label: 'Shipping Integration', type: 'select', options: [
      { value: 'none', label: 'None (manual)' },
      { value: 'shippo', label: 'Shippo' },
      { value: 'easypost', label: 'EasyPost' },
    ]},
    { key: 'cms', label: 'CMS / Catalog', type: 'select', options: [
      { value: 'supabase', label: 'Supabase' },
      { value: 'shopify', label: 'Shopify' },
      { value: 'contentful', label: 'Contentful' },
    ]},
    { key: 'multi_currency', label: 'Multi-Currency Support', type: 'boolean' },
  ],
  pipeline: [
    { key: 'scheduler', label: 'Scheduler', type: 'select', options: [
      { value: 'vercel_cron', label: 'Vercel Cron' },
      { value: 'aws_lambda', label: 'AWS Lambda' },
      { value: 'n8n', label: 'n8n' },
    ]},
    { key: 'frequency', label: 'Run Frequency', type: 'select', options: [
      { value: 'hourly', label: 'Hourly' },
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'on_demand', label: 'On-demand' },
    ]},
    { key: 'retry_policy', label: 'Retry Policy', type: 'select', options: [
      { value: 'exponential_backoff', label: 'Exponential Backoff' },
      { value: 'circuit_breaker', label: 'Circuit Breaker' },
      { value: 'none', label: 'None' },
    ]},
    { key: 'alerting', label: 'Alerting', type: 'select', options: [
      { value: 'dashboard', label: 'Dashboard only' },
      { value: 'email', label: 'Email' },
      { value: 'slack', label: 'Slack' },
    ]},
  ],
  content: [
    { key: 'cms', label: 'CMS', type: 'select', options: [
      { value: 'markdown', label: 'Markdown files' },
      { value: 'supabase', label: 'Supabase' },
      { value: 'contentful', label: 'Contentful' },
      { value: 'sanity', label: 'Sanity' },
    ]},
    { key: 'comments', label: 'Comments', type: 'select', options: [
      { value: 'none', label: 'None' },
      { value: 'disqus', label: 'Disqus' },
    ]},
    { key: 'blog_enabled', label: 'Blog Enabled', type: 'boolean' },
    { key: 'search_enabled', label: 'Search Enabled', type: 'boolean' },
    { key: 'newsletter', label: 'Newsletter Signup', type: 'boolean' },
  ],
}

const TYPE_ICONS: Record<ProjectType, string> = {
  web_app: '🌐',
  ios_app: '📱',
  macos_app: '💻',
  ecommerce: '🛒',
  pipeline: '⚙️',
  content: '📝',
}

export default function ProjectModal({ onSave, onClose }: ProjectModalProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [projectType, setProjectType] = useState<ProjectType>('web_app')
  const [typeConfig, setTypeConfig] = useState<Record<string, unknown>>({ ...DEFAULT_TYPE_CONFIGS['web_app'] })
  const [saving, setSaving] = useState(false)

  function handleTypeSelect(type: ProjectType) {
    setProjectType(type)
    setColor(PROJECT_TYPE_COLORS[type])
    setTypeConfig({ ...DEFAULT_TYPE_CONFIGS[type] })
  }

  function setConfigValue(key: string, value: unknown) {
    setTypeConfig(prev => ({ ...prev, [key]: value }))
  }

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    await onSave({
      name: name.trim(),
      description: description.trim() || null,
      color,
      project_type: projectType,
      type_config: typeConfig,
      stack_info: { ...DEFAULT_STACK_INFO[projectType] },
    })
    setSaving(false)
    onClose()
  }

  const canProceed = step === 1 ? name.trim().length > 0 : true

  return (
    <div
      onClick={onClose}
      className="modal-container"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal-content"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: step === 2 ? '640px' : '500px',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              New Project
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Step {step} of 4 — {
                step === 1 ? 'Basic Info' :
                step === 2 ? 'Project Type' :
                step === 3 ? 'Configuration' :
                'Review'
              }
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer', padding: '4px 8px' }}>×</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{
              flex: 1, height: '3px', borderRadius: '2px',
              background: s <= step ? color : 'var(--bg-track)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Project Name *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. My SaaS App, iOS App, Store..."
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(2) }}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Description <span style={{ color: '#555', textTransform: 'none', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Color</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: c,
                      border: color === c ? '3px solid #fff' : '2px solid transparent',
                      outline: color === c ? `2px solid ${c}` : 'none',
                      cursor: 'pointer', padding: 0, transition: 'outline 0.1s',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Type Selection */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Choose the type that best fits your project. This sets default config, stack, and agent assignments.
            </p>
            {getAllProjectTypes().map(type => {
              const selected = projectType === type
              const typeColor = PROJECT_TYPE_COLORS[type]
              return (
                <button
                  key={type}
                  onClick={() => handleTypeSelect(type)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    background: selected ? `${typeColor}15` : 'var(--bg-deep)',
                    border: `1px solid ${selected ? typeColor : 'var(--border-card)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '1px' }}>{TYPE_ICONS[type]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {PROJECT_TYPE_LABELS[type]}
                      </span>
                      <span style={{
                        fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
                        background: `${typeColor}22`, color: typeColor, letterSpacing: '0.04em',
                      }}>
                        {type}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {PROJECT_TYPE_DESCRIPTIONS[type]}
                    </span>
                  </div>
                  {selected && (
                    <span style={{ color: typeColor, fontSize: '16px', flexShrink: 0 }}>✓</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Step 3: Type Config */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>{TYPE_ICONS[projectType]}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {PROJECT_TYPE_LABELS[projectType]} Configuration
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Defaults are pre-filled — customize as needed
                </div>
              </div>
            </div>
            {TYPE_CONFIG_FIELDS[projectType].map(field => (
              <div key={field.key}>
                <label style={labelStyle}>{field.label}</label>
                {field.type === 'boolean' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!typeConfig[field.key]}
                      onChange={e => setConfigValue(field.key, e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: color, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                      {typeConfig[field.key] ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                ) : (
                  <select
                    value={typeConfig[field.key] as string ?? ''}
                    onChange={e => setConfigValue(field.key, e.target.value)}
                    style={selectStyle}
                  >
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '14px', background: 'var(--bg-deep)', border: '1px solid var(--border-card)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{name}</span>
                <span style={{
                  fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
                  background: `${PROJECT_TYPE_COLORS[projectType]}22`, color: PROJECT_TYPE_COLORS[projectType],
                  letterSpacing: '0.04em',
                }}>
                  {TYPE_ICONS[projectType]} {PROJECT_TYPE_LABELS[projectType]}
                </span>
              </div>
              {description && (
                <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--text-secondary)' }}>{description}</p>
              )}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Configuration:</strong>
                <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {Object.entries(typeConfig).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: '140px' }}>{k}</span>
                      <span style={{ color: 'var(--text-light)' }}>
                        {typeof v === 'boolean' ? (v ? '✓ Yes' : '✗ No') : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              You can edit all settings after creation from the project page.
            </p>
          </div>
        )}

        {/* Footer buttons */}
        <div className="modal-footer-btns" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', gap: '8px' }}>
          <button
            className="btn-ghost"
            onClick={() => step === 1 ? onClose() : setStep(s => s - 1)}
            style={{ minHeight: '44px' }}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed}
                style={{
                  background: color,
                  border: 'none',
                  borderRadius: '7px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: canProceed ? 'pointer' : 'not-allowed',
                  opacity: canProceed ? 1 : 0.5,
                  minHeight: '44px',
                }}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={saving}
                style={{
                  background: color,
                  border: 'none',
                  borderRadius: '7px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  opacity: saving ? 0.7 : 1,
                  minHeight: '44px',
                }}
              >
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-deep)',
  border: '1px solid var(--border-card)',
  borderRadius: '6px',
  padding: '10px 12px',
  fontSize: '16px', // 16px prevents iOS zoom on focus
  color: 'var(--text-light)',
  width: '100%',
  outline: 'none',
  minHeight: '44px',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-deep)',
  border: '1px solid var(--border-card)',
  borderRadius: '6px',
  padding: '10px 12px',
  fontSize: '16px', // 16px prevents iOS zoom on focus
  color: 'var(--text-light)',
  width: '100%',
  outline: 'none',
  minHeight: '44px',
  boxSizing: 'border-box',
}
