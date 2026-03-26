'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

function SignOutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    setLoading(true)
    const supabase = getSupabase()
    if (supabase) await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="btn-danger"
      style={{ minWidth: '100px' }}
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}

export default function SettingsPage() {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Configuration and preferences</p>
      </div>

      <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Auth */}
        <Section title="Account">
          <SettingRow label="Session" description="Signed in via magic link">
            <SignOutButton />
          </SettingRow>
        </Section>

        {/* Connection status */}
        <Section title="Connection">
          <SettingRow
            label="Supabase"
            description="Connected via NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
          >
            <StatusIndicator ok={true} label="Connected" />
          </SettingRow>
        </Section>

        {/* App info */}
        <Section title="Application">
          <SettingRow label="App Name" description="Project HQ — Dylan&apos;s ops center">
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Project HQ</span>
          </SettingRow>
          <SettingRow label="Version" description="v3 — multi-page rebuild">
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>3.0.0</span>
          </SettingRow>
          <SettingRow label="Tech Stack" description="Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
          </SettingRow>
        </Section>

        {/* Database schema */}
        <Section title="Database">
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 8px' }}>Run the following migrations in your Supabase SQL Editor:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { file: 'supabase-schema.sql', desc: 'Base schema (projects, tasks, activity, sessions, spend)' },
                { file: 'supabase-migration-v2.sql', desc: 'v2 additions (agent_name, context, token_usage)' },
                { file: 'supabase-migration-v3.sql', desc: 'v3 additions (extended project fields, task fields, system projects)' },
              ].map(m => (
                <div key={m.file} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'var(--bg-deep)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '6px',
                }}>
                  <code style={{ fontSize: '12px', color: '#6366f1', fontFamily: 'monospace', flexShrink: 0 }}>
                    {m.file}
                  </code>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Keyboard shortcuts */}
        <Section title="Keyboard Shortcuts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { keys: '⌘K', desc: 'Open command palette / quick navigate' },
              { keys: 'Esc', desc: 'Close modal or command palette' },
              { keys: 'Enter', desc: 'Submit form (in modals)' },
            ].map(shortcut => (
              <div key={shortcut.keys} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <kbd style={{
                  background: 'var(--bg-active)',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  color: 'var(--text-light)',
                  fontFamily: 'monospace',
                  minWidth: '48px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                  {shortcut.keys}
                </kbd>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{shortcut.desc}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-card)',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-card)',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--text-primary)',
      }}>
        {title}
      </div>
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {children}
      </div>
    </div>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-light)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function StatusIndicator({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: ok ? '#22c55e' : '#ef4444',
      }} />
      <span style={{ fontSize: '12px', color: ok ? '#22c55e' : '#ef4444', fontWeight: 500 }}>{label}</span>
    </div>
  )
}
