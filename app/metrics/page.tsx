import { createServerClient } from '@/lib/supabase-server'
import { Task, Project, SpendLog, TokenUsage, Session } from '@/types'

export const dynamic = 'force-dynamic'

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

async function getMetricsData() {
  try {
    const supabase = await createServerClient()
    const [
      { data: tasksData },
      { data: projectsData },
      { data: spendData },
      { data: tokenData },
      { data: sessionsData },
    ] = await Promise.all([
      supabase.from('tasks').select('id, status, project_id, updated_at').order('updated_at', { ascending: false }),
      supabase.from('projects').select('id, name, color, status').order('created_at', { ascending: true }),
      supabase.from('spend_log').select('*, project:projects(id, name, color)').order('created_at', { ascending: false }),
      supabase.from('token_usage').select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('sessions').select('*').order('started_at', { ascending: false }).limit(50),
    ])
    return {
      tasks: (tasksData as Task[]) ?? [],
      projects: (projectsData as Project[]) ?? [],
      spend: (spendData as SpendLog[]) ?? [],
      tokens: (tokenData as TokenUsage[]) ?? [],
      sessions: (sessionsData as Session[]) ?? [],
    }
  } catch (error) {
    console.error('Failed to load metrics data:', error)
    return { tasks: [], projects: [], spend: [], tokens: [], sessions: [] }
  }
}

export default async function MetricsPage() {
  const { tasks, projects, spend, tokens, sessions } = await getMetricsData()

  const totalSpend = spend.reduce((sum, s) => sum + Number(s.amount), 0)
  const totalTokenCost = tokens.reduce((sum, t) => sum + Number(t.cost_usd ?? 0), 0)
  const totalInputTokens = tokens.reduce((sum, t) => sum + t.input_tokens, 0)
  const totalOutputTokens = tokens.reduce((sum, t) => sum + t.output_tokens, 0)

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const doneThisWeek = tasks.filter(t => t.status === 'done' && t.updated_at >= weekAgo).length

  // Spend by project
  const spendByProject: Record<string, { name: string; amount: number; color: string }> = {}
  spend.forEach(s => {
    if (!s.project_id || !s.project) return
    if (!spendByProject[s.project_id]) {
      spendByProject[s.project_id] = { name: s.project.name, amount: 0, color: s.project.color }
    }
    spendByProject[s.project_id].amount += Number(s.amount)
  })
  const spendByProjectList = Object.values(spendByProject).sort((a, b) => b.amount - a.amount)

  // Tasks by status
  const tasksByStatus = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    in_review: tasks.filter(t => t.status === 'in_review').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  // Daily token usage
  const days7 = getLast7Days()
  const dailyTokens = days7.map(date => {
    const dayTokens = tokens.filter(t => t.created_at.slice(0, 10) === date)
    return {
      date,
      input: dayTokens.reduce((s, t) => s + t.input_tokens, 0),
      output: dayTokens.reduce((s, t) => s + t.output_tokens, 0),
      cost: dayTokens.reduce((s, t) => s + Number(t.cost_usd ?? 0), 0),
    }
  })

  const maxTokens = Math.max(...dailyTokens.map(d => d.input + d.output), 1)

  // Models used
  const modelCounts: Record<string, number> = {}
  tokens.forEach(t => {
    if (t.model) modelCounts[t.model] = (modelCounts[t.model] ?? 0) + 1
  })
  const modelList = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])

  // Provider breakdown
  type ProviderStats = { cost: number; input: number; output: number }
  const providerMap: Record<string, ProviderStats> = {}
  tokens.forEach(t => {
    const provider = t.provider ?? (t.model ? t.model.split('/')[0] : 'unknown')
    if (!providerMap[provider]) providerMap[provider] = { cost: 0, input: 0, output: 0 }
    providerMap[provider].cost += Number(t.cost_usd ?? 0)
    providerMap[provider].input += t.input_tokens
    providerMap[provider].output += t.output_tokens
  })
  const providerList = Object.entries(providerMap).sort((a, b) => b[1].cost - a[1].cost)

  // Token cost by project
  const projectById: Record<string, Project> = {}
  projects.forEach(p => { projectById[p.id] = p })
  type ProjectTokenStats = { name: string; color: string; cost: number; input: number; output: number }
  const tokenByProject: Record<string, ProjectTokenStats> = {}
  let tokenUnattributed = { cost: 0, input: 0, output: 0 }
  tokens.forEach(t => {
    if (!t.project_id) {
      tokenUnattributed.cost += Number(t.cost_usd ?? 0)
      tokenUnattributed.input += t.input_tokens
      tokenUnattributed.output += t.output_tokens
      return
    }
    const proj = projectById[t.project_id]
    if (!tokenByProject[t.project_id]) {
      tokenByProject[t.project_id] = {
        name: proj?.name ?? 'Unknown Project',
        color: proj?.color ?? '#6b7280',
        cost: 0, input: 0, output: 0,
      }
    }
    tokenByProject[t.project_id].cost += Number(t.cost_usd ?? 0)
    tokenByProject[t.project_id].input += t.input_tokens
    tokenByProject[t.project_id].output += t.output_tokens
  })
  const tokenByProjectList = Object.values(tokenByProject).sort((a, b) => b.cost - a.cost)

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 700, color: '#f0f0f0' }}>Metrics</h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Usage, spend, and velocity analytics</p>
      </div>

      {/* Top stats */}
      <div className="metrics-stats-grid" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total Spend', value: `$${totalSpend.toFixed(2)}`, color: '#f59e0b' },
          { label: 'Token Cost', value: `$${totalTokenCost.toFixed(4)}`, color: '#6366f1' },
          { label: 'Input Tokens', value: totalInputTokens.toLocaleString(), color: '#3b82f6' },
          { label: 'Output Tokens', value: totalOutputTokens.toLocaleString(), color: '#22c55e' },
          { label: 'Sessions', value: String(sessions.length), color: '#9ca3af' },
        ].map((stat, i) => (
          <div key={i} style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: stat.color, marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="metrics-two-col" style={{ marginBottom: '20px' }}>
        {/* Task velocity */}
        <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '20px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#f0f0f0' }}>Task Status</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Backlog', count: tasksByStatus.backlog, color: '#6b7280' },
              { label: 'In Progress', count: tasksByStatus.in_progress, color: '#3b82f6' },
              { label: 'In Review', count: tasksByStatus.in_review, color: '#eab308' },
              { label: 'Done', count: tasksByStatus.done, color: '#22c55e' },
            ].map(item => {
              const total = tasks.length || 1
              const pct = Math.round((item.count / total) * 100)
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#e5e7eb' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', color: item.color, fontWeight: 600 }}>{item.count}</span>
                  </div>
                  <div style={{ height: '6px', background: '#1e1e2e', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: '3px' }} />
                  </div>
                </div>
              )
            })}
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
              {doneThisWeek} completed this week
            </div>
          </div>
        </div>

        {/* Spend by project */}
        <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '20px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#f0f0f0' }}>Spend by Project</h2>
          {spendByProjectList.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
              No spend data yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {spendByProjectList.map(item => {
                const pct = totalSpend > 0 ? Math.round((item.amount / totalSpend) * 100) : 0
                return (
                  <div key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
                        <span style={{ fontSize: '13px', color: '#e5e7eb' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '13px', color: '#f0f0f0', fontWeight: 600 }}>${item.amount.toFixed(2)}</span>
                    </div>
                    <div style={{ height: '5px', background: '#1e1e2e', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: '3px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Token usage chart (last 7 days) */}
      <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#f0f0f0' }}>Token Usage — Last 7 Days</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '120px' }}>
          {dailyTokens.map(day => {
            const total = day.input + day.output
            const barHeight = total > 0 ? Math.round((total / maxTokens) * 100) : 0
            const inputH = total > 0 ? Math.round((day.input / maxTokens) * 100) : 0
            const outputH = total > 0 ? Math.round((day.output / maxTokens) * 100) : 0
            return (
              <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>
                  {total > 0 ? (total / 1000).toFixed(1) + 'k' : '0'}
                </div>
                <div style={{
                  width: '100%',
                  height: `${Math.max(barHeight, total > 0 ? 4 : 0)}px`,
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  background: '#1e1e2e',
                }}>
                  <div style={{ height: `${inputH}%`, background: '#3b82f6' }} />
                  <div style={{ height: `${outputH}%`, background: '#22c55e' }} />
                </div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>
                  {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Input tokens</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', background: '#22c55e', borderRadius: '2px' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Output tokens</span>
          </div>
        </div>
      </div>

      {/* Provider breakdown + Token cost by project */}
      {tokens.length > 0 && (
        <div className="metrics-two-col" style={{ marginBottom: '20px' }}>
          {/* Provider breakdown */}
          <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#f0f0f0' }}>Token Cost by Provider</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {providerList.map(([provider, stats]) => {
                const pct = totalTokenCost > 0 ? Math.round((stats.cost / totalTokenCost) * 100) : 0
                const providerColors: Record<string, string> = { anthropic: '#d97706', openrouter: '#8b5cf6', google: '#3b82f6' }
                const color = providerColors[provider] ?? '#6b7280'
                return (
                  <div key={provider}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                        <span style={{ fontSize: '13px', color: '#e5e7eb', fontFamily: 'monospace' }}>{provider}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '13px', color: '#f0f0f0', fontWeight: 600 }}>${stats.cost.toFixed(4)}</span>
                        <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '6px' }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: '5px', background: '#1e1e2e', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px' }} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>
                      {(stats.input + stats.output).toLocaleString()} tokens
                      ({stats.input.toLocaleString()} in / {stats.output.toLocaleString()} out)
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Token cost by project */}
          <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#f0f0f0' }}>Token Cost by Project</h2>
            {tokenByProjectList.length === 0 && tokenUnattributed.cost === 0 ? (
              <div style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
                No project attribution yet — add --project-id to linkbot-logger calls
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tokenByProjectList.map(item => {
                  const pct = totalTokenCost > 0 ? Math.round((item.cost / totalTokenCost) * 100) : 0
                  return (
                    <div key={item.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
                          <span style={{ fontSize: '13px', color: '#e5e7eb' }}>{item.name}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '13px', color: '#f0f0f0', fontWeight: 600 }}>${item.cost.toFixed(4)}</span>
                          <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '6px' }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: '5px', background: '#1e1e2e', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: '3px' }} />
                      </div>
                    </div>
                  )
                })}
                {tokenUnattributed.cost > 0 && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#374151' }} />
                        <span style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>Unattributed</span>
                      </div>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>${tokenUnattributed.cost.toFixed(4)}</span>
                    </div>
                    <div style={{ height: '5px', background: '#1e1e2e', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${totalTokenCost > 0 ? Math.round((tokenUnattributed.cost / totalTokenCost) * 100) : 0}%`, background: '#374151', borderRadius: '3px' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Models used */}
      {modelList.length > 0 && (
        <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '20px' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 600, color: '#f0f0f0' }}>Models Used</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {modelList.map(([model, count]) => (
              <div key={model} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: '#0a0a0f',
                border: '1px solid #1e1e2e',
                borderRadius: '6px',
              }}>
                <span style={{ fontSize: '13px', color: '#e5e7eb', fontFamily: 'monospace' }}>{model}</span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
