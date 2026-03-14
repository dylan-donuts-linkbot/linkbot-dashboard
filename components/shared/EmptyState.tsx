interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      gap: '12px',
    }}>
      {icon && (
        <div style={{ fontSize: '32px', marginBottom: '4px' }}>{icon}</div>
      )}
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#e5e7eb' }}>{title}</div>
      {description && (
        <div style={{ fontSize: '13px', color: '#6b7280', maxWidth: '320px', lineHeight: 1.6 }}>
          {description}
        </div>
      )}
      {action && (
        <div style={{ marginTop: '8px' }}>{action}</div>
      )}
    </div>
  )
}
