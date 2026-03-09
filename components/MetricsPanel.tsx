'use client'

import { Metrics } from '@/types'

interface MetricsPanelProps {
  metrics: Metrics
}

function MetricCard({ label, value, sub, accent, children }: {
  label: string
  value?: string | number
  sub?: string
  accent?: string
  children?: React.ReactNode
}) {
  return (
    <div className="card" style={{ padding: '16px 20px', minWidth: 0 }}>
      <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
        {label}
      </div>
      {value !== undefined && (
        <div style={{ fontSize: '28px', fontWeight: 700, color: accent || '#f0f0f0', lineHeight: 1, marginBottom: '4px' }}>
          {value}
        </div>
      )}
      {sub && (
        <div style={{ color: '#555', fontSize: '12px' }}>{sub}</div>
      )}
      {children}
    </div>
  )
}

function TokenSparkline({ bars }: { bars: { date: string; input: number; output: number }[] }) {
  const maxVal = Math.max(...bars.map(b => b.input + b.output), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '32px', marginTop: '8px' }}>
      {bars.map((bar, i) => {
        const total = bar.input + bar.output
        const pct = (total / maxVal) * 100
        const inputPct = total > 0 ? (bar.input / total) * 100 : 50
        return (
          <div
            key={i}
            title={`${bar.date}: ${bar.input.toLocaleString()} in / ${bar.output.toLocaleString()} out`}
            style={{
              flex: 1,
              height: `${Math.max(pct, 4)}%`,
              borderRadius: '2px 2px 0 0',
              background: total > 0
                ? `linear-gradient(to top, #a78bfa ${inputPct}%, #60a5fa ${inputPct}%)`
                : '#1e1e1e',
              opacity: total > 0 ? 0.85 : 0.3,
              minHeight: '3px',
            }}
          />
        )
      })}
    </div>
  )
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  const totalSpendFormatted = metrics.totalSpend.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  const { tokenUsage } = metrics
  const hasTokenData = tokenUsage.totalInput > 0 || tokenUsage.totalOutput > 0

  return (
    <div>
      {/* Top-level numbers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
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

        {/* Token Usage card */}
        <div className="card" style={{ padding: '16px 20px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ color: '#888', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Token Usage
            </div>
            {tokenUsage.model && (
              <span style={{
                fontSize: '10px',
                color: '#a78bfa',
                background: '#a78bfa15',
                border: '1px solid #a78bfa33',
                padding: '1px 5px',
                borderRadius: '3px',
                fontFamily: 'monospace',
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {tokenUsage.model}
              </span>
            )}
          </div>

          {hasTokenData ? (
            <>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#a78bfa', lineHeight: 1, marginBottom: '2px' }}>
                ${tokenUsage.totalCost.toFixed(4)}
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#555', marginTop: '2px' }}>
                <span title="Input tokens">↑ {tokenUsage.totalInput.toLocaleString()}</span>
                <span title="Output tokens">↓ {tokenUsage.totalOutput.toLocaleString()}</span>
              </div>
              {tokenUsage.dailyBars.length > 0 && (
                <TokenSparkline bars={tokenUsage.dailyBars} />
              )}
            </>
          ) : (
            <div style={{ fontSize: '13px', color: '#444', marginTop: '4px' }}>No data yet</div>
          )}
        </div>
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
