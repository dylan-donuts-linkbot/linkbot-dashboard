/**
 * Cron Endpoint: Sync Model Pricing
 *
 * Runs weekly (Mondays 9 AM ET) to update model pricing from providers.
 * Currently syncs OpenRouter (has public API). Anthropic/OpenAI require manual updates.
 *
 * Triggered by Vercel Cron: GET /api/cron/sync-pricing
 */

import { createClient } from '@supabase/supabase-js'

interface OpenRouterModel {
  id: string
  name: string
  pricing?: {
    prompt: number
    completion: number
  }
}

interface SyncResult {
  status: 'success' | 'partial' | 'failed'
  modelsUpdated: number
  providersSync: string[]
  error?: string
}

/**
 * Fetch and parse OpenRouter models with pricing
 */
async function fetchOpenRouterPricing(): Promise<
  Array<{
    provider: string
    modelId: string
    modelName: string
    inputCost: number
    outputCost: number
  }>
> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'User-Agent': 'LinkBot-Dashboard/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API returned ${response.status}`)
    }

    const data = (await response.json()) as { data: OpenRouterModel[] }
    const models: Array<{
      provider: string
      modelId: string
      modelName: string
      inputCost: number
      outputCost: number
    }> = []

    for (const model of data.data) {
      if (model.pricing && model.pricing.prompt !== undefined && model.pricing.completion !== undefined) {
        models.push({
          provider: 'openrouter',
          modelId: model.id,
          modelName: model.name,
          inputCost: model.pricing.prompt,
          outputCost: model.pricing.completion,
        })
      }
    }

    return models
  } catch (err) {
    console.error('Failed to fetch OpenRouter pricing:', err)
    return []
  }
}

/**
 * Log sync event to Supabase
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logSyncEvent(
  supabase: any,
  status: 'success' | 'partial' | 'failed',
  modelsUpdated: number,
  providersSync: string[],
  error?: string
): Promise<void> {
  await supabase.from('pricing_sync_log').insert({
    status,
    models_updated: modelsUpdated,
    providers_synced: providersSync,
    error_message: error,
    details: {
      timestamp: new Date().toISOString(),
      source: 'cron-weekly',
    },
  })
}

export async function GET(request: Request) {
  // Verify cron secret (if configured)
  const secret = request.headers.get('x-vercel-cron')
  const expectedSecret = process.env.CRON_SECRET

  if (expectedSecret && secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  const result: SyncResult = {
    status: 'success',
    modelsUpdated: 0,
    providersSync: [],
  }

  try {
    // Fetch OpenRouter pricing (has public API)
    const openrouterModels = await fetchOpenRouterPricing()

    if (openrouterModels.length > 0) {
      // Upsert models to database
      const { error: upsertError } = await supabase.from('model_pricing').upsert(
        openrouterModels.map((m) => ({
          provider: m.provider,
          model_id: m.modelId,
          model_name: m.modelName,
          input_cost_per_1m_tokens: m.inputCost * 1_000_000, // Convert to per-1M format
          output_cost_per_1m_tokens: m.outputCost * 1_000_000,
          pricing_version: new Date().toISOString().slice(0, 7), // YYYY-MM
          source_url: 'https://openrouter.ai/api/v1/models',
          last_verified_at: new Date().toISOString(),
        })),
        { onConflict: 'provider,model_id' }
      )

      if (upsertError) {
        throw new Error(`Upsert failed: ${upsertError.message}`)
      }

      result.modelsUpdated = openrouterModels.length
      result.providersSync.push('openrouter')
    }

    // Note: Anthropic and OpenAI pricing requires manual updates
    // They don't expose pricing via public APIs, so we rely on the seeded defaults
    // and manual updates when prices change.

    // Log successful sync
    await logSyncEvent(supabase, 'success', result.modelsUpdated, result.providersSync)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    result.status = 'failed'
    result.error = errorMsg

    // Log failed sync
    await logSyncEvent(supabase, 'failed', 0, result.providersSync, errorMsg)

    console.error('Pricing sync failed:', err)

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
