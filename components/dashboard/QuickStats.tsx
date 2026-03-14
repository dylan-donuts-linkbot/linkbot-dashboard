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
            background: '#111118',
            border: '1px solid #1e1e2e',
            borderRadius: '8px',
            padding: '16px 18px',
          }}
        >
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: stat.color ?? '#f0f0f0',
            lineHeight: 1.2,
            marginBottom: '4px',
          }}>
            {stat.value}
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>
            {stat.label}
          </div>
          {stat.subtext && (
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
              {stat.subtext}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
