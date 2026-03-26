/**
 * Task Logger Utility
 *
 * Comprehensive logging for task completion with token usage tracking.
 * Marks tasks as done, logs agent activity, and captures token costs.
 */

import { createClient } from '@supabase/supabase-js'
import { getModelCost, extractProvider, extractModelId } from './token-pricing'

export interface TaskLoggerOptions {
  taskId: string
  projectId: string
  taskTitle: string
  summary: string
  model?: string
  inputTokens?: number
  outputTokens?: number
  metadata?: Record<string, unknown>
}

export interface TaskLogResult {
  taskUpdated: boolean
  tokenLogged: boolean
  agentLogId?: string
  cost?: number
}

/**
 * Log task completion with optional token usage
 *
 * This is the main entry point for task completion logging.
 * It:
 * 1. Marks the task as 'done' in Supabase
 * 2. Creates an agent_logs entry
 * 3. Logs token usage (if provided)
 * 4. Calculates and stores cost
 */
export async function logTaskCompletion(
  options: TaskLoggerOptions
): Promise<TaskLogResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  const result: TaskLogResult = {
    taskUpdated: false,
    tokenLogged: false,
  }

  try {
    // 1. Mark task as done
    const { error: taskError } = await supabase
      .from('tasks')
      .update({
        status: 'done',
        updated_at: new Date().toISOString(),
      })
      .eq('id', options.taskId)

    if (taskError) {
      console.error('Failed to update task status:', taskError)
    } else {
      result.taskUpdated = true
    }

    // 2. Log agent activity
    const { data: logData, error: logError } = await supabase
      .from('agent_logs')
      .insert({
        agent: 'openclaw',
        action: 'task_complete',
        summary: options.summary,
        task_id: options.taskId,
        project_id: options.projectId,
        metadata: {
          taskTitle: options.taskTitle,
          model: options.model,
          tokensUsed: {
            input: options.inputTokens || 0,
            output: options.outputTokens || 0,
          },
          ...options.metadata,
        },
      })
      .select('id')
      .single()

    if (logError) {
      console.error('Failed to create agent log:', logError)
    } else if (logData) {
      result.agentLogId = logData.id
    }

    // 3. Log token usage if provided
    if (options.model && options.inputTokens && options.outputTokens) {
      const costResult = await getModelCost(
        options.model,
        options.inputTokens,
        options.outputTokens
      )

      const { error: tokenError } = await supabase.from('token_usage').insert({
        project_id: options.projectId,
        model: options.model,
        provider: extractProvider(options.model),
        input_tokens: options.inputTokens,
        output_tokens: options.outputTokens,
        cost_usd: costResult.totalCost,
      })

      if (tokenError) {
        console.error('Failed to log token usage:', tokenError)
      } else {
        result.tokenLogged = true
        result.cost = costResult.totalCost
      }
    }
  } catch (err) {
    console.error('Unexpected error in logTaskCompletion:', err)
  }

  return result
}

/**
 * Mark task as in_progress with optional note
 */
export async function markTaskInProgress(
  taskId: string,
  projectId: string,
  note?: string
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  try {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    if (note) {
      await supabase.from('agent_logs').insert({
        agent: 'openclaw',
        action: 'task_started',
        summary: note,
        task_id: taskId,
        project_id: projectId,
      })
    }

    return !error
  } catch (err) {
    console.error('Failed to mark task in progress:', err)
    return false
  }
}

/**
 * Mark task as in_review (waiting for external input)
 */
export async function markTaskInReview(
  taskId: string,
  projectId: string,
  blockerNote: string
): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  try {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'in_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    if (!error) {
      await supabase.from('agent_logs').insert({
        agent: 'openclaw',
        action: 'task_blocked',
        summary: blockerNote,
        task_id: taskId,
        project_id: projectId,
        metadata: { blocked: true },
      })
    }

    return !error
  } catch (err) {
    console.error('Failed to mark task in review:', err)
    return false
  }
}
