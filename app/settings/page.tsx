export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: '#f0f0f0' }}>Settings</h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Configuration and preferences</p>
      </div>

      <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>Project HQ</span>
          </SettingRow>
          <SettingRow label="Version" description="v3 — multi-page rebuild">
            <span style={{ fontSize: '13px', color: '#9ca3af', fontFamily: 'monospace' }}>3.0.0</span>
          </SettingRow>
          <SettingRow label="Tech Stack" description="Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase">
            <span style={{ fontSize: '11px', color: '#6b7280' }}>—</span>
          </SettingRow>
        </Section>

        {/* Database schema */}
        <Section title="Database">
          <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.7 }}>
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
                  background: '#0a0a0f',
                  border: '1px solid #1e1e2e',
                  borderRadius: '6px',
                }}>
                  <code style={{ fontSize: '12px', color: '#6366f1', fontFamily: 'monospace', flexShrink: 0 }}>
                    {m.file}
                  </code>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>{m.desc}</span>
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
                  background: '#1e1e2e',
                  border: '1px solid #2e2e3e',
                  borderRadius: '5px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  color: '#e5e7eb',
                  fontFamily: 'monospace',
                  minWidth: '48px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                  {shortcut.keys}
                </kbd>
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>{shortcut.desc}</span>
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
      background: '#111118',
      border: '1px solid #1e1e2e',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #1e1e2e',
        fontSize: '13px',
        fontWeight: 600,
        color: '#f0f0f0',
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
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#e5e7eb', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>{description}</div>
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
