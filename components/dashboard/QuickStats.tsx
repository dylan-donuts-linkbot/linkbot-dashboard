interface StatItem {
  label: string
  value: string | number
  subtext?: string
  color?: string
}

interface QuickStatsProps {
  stats: StatItem[]
}

export default function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
      gap: '12px',
    }}>
      {stats.map((stat, i) => (
        <div
          key={i}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: '8px',
            padding: '16px 18px',
          }}
        >
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: stat.color ?? 'var(--text-primary)',
            lineHeight: 1.2,
            marginBottom: '4px',
          }}>
            {stat.value}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {stat.label}
          </div>
          {stat.subtext && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {stat.subtext}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
