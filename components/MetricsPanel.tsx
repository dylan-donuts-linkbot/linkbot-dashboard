'use client'

import { Metrics } from '@/types'

interface MetricsPanelProps {
  metrics: Metrics
}

function MetricCard({ label, value, sub, accent }: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div className="card" style={{ padding: '16px 20px', minWidth: 0 }}>
      <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: accent || '#f0f0f0', lineHeight: 1, marginBottom: '4px' }}>
        {value}
      </div>
      {sub && (
        <div style={{ color: '#555', fontSize: '12px' }}>{sub}</div>
      )}
    </div>
  )
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  const totalSpendFormatted = metrics.totalSpend.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  return (
    <div>
      {/* Top-level numbers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '12px',
      }}>
        <MetricCard
          label="Sessions"
          value={metrics.sessionCount}
          sub="all time"
        />
        <MetricCard
          label="Tasks Done"
          value={metrics.tasksCompletedThisWeek}
          sub="this week"
          accent="#3b82f6"
        />
        <MetricCard
          label="Active Projects"
          value={metrics.activeProjectsCount}
          sub="in flight"
        />
        <MetricCard
          label="Total Spend"
          value={totalSpendFormatted}
          sub="all projects"
          accent={metrics.totalSpend > 0 ? '#f59e0b' : undefined}
        />
      </div>

      {/* Spend by project */}
      {metrics.spendByProject.length > 0 && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Spend by Project
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {metrics.spendByProject.map(({ project, amount, color }) => {
              const pct = metrics.totalSpend > 0 ? (amount / metrics.totalSpend) * 100 : 0
              return (
                <div key={project}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#ccc' }}>{project}</span>
                    <span style={{ fontSize: '13px', color: '#888', fontVariantNumeric: 'tabular-nums' }}>
                      ${amount.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: '#2a2a2a', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: color,
                      borderRadius: '2px',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
