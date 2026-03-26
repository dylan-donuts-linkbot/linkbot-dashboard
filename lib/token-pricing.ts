/**
 * Token Pricing Utilities
 *
 * Queries current model pricing from Supabase model_pricing table.
 * Falls back to hardcoded defaults if pricing lookup fails.
 * Calculates cost based on input/output tokens.
 */

import { createClient } from '@supabase/supabase-js'

// Default pricing (fallback if DB lookup fails)
// Updated March 2026
const DEFAULT_PRICING = {
  anthropic: {
    'claude-haiku-4-5': { input: 0.8, output: 4.0 },
    'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
    'claude-opus-4-6': { input: 15.0, output: 75.0 },
  },
  openai: {
    'gpt-4o': { input: 5.0, output: 15.0 },
    'gpt-4-turbo': { input: 10.0, output: 30.0 },
    'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
    'o1': { input: 15.0, output: 60.0 },
    'o3-mini': { input: 1.0, output: 4.0 },
  },
  google: {
    'gemini-2.0-flash': { input: 0.075, output: 0.3 },
    'gemini-2.5-pro': { input: 1.5, output: 6.0 },
  },
  openrouter: {
    'meta-llama/llama-3.3-70b-instruct:free': { input: 0, output: 0 },
    'meta-llama/llama-3.1-70b-instruct': { input: 0.54, output: 0.81 },
    'deepseek/deepseek-chat-v3-0324': { input: 0.14, output: 0.28 },
    'perplexity/llama-3.1-sonar-large-128k-online': { input: 1.0, output: 1.0 },
  },
}

export interface ModelCostResult {
  inputCost: number
  outputCost: number
  totalCost: number
  pricingAsOf?: Date
  source: 'database' | 'fallback'
}

/**
 * Extract provider from full model string
 * Examples:
 *   'anthropic/claude-haiku-4-5' -> 'anthropic'
 *   'openrouter/google/gemini-2.0-flash' -> 'openrouter'
 */
export function extractProvider(model: string): string {
  return model.split('/')[0]
}

/**
 * Extract model ID from full model string
 * Examples:
 *   'anthropic/claude-haiku-4-5' -> 'claude-haiku-4-5'
 *   'openrouter/google/gemini-2.0-flash' -> 'google/gemini-2.0-flash'
 */
export function extractModelId(model: string): string {
  const parts = model.split('/')
  return parts.slice(1).join('/')
}

/**
 * Get pricing for a specific model from fallback defaults
 */
function getFallbackPricing(
  provider: string,
  modelId: string
): { input: number; output: number } | null {
  const providerPricing = DEFAULT_PRICING[provider as keyof typeof DEFAULT_PRICING]
  if (!providerPricing) return null

  return providerPricing[modelId as keyof typeof providerPricing] || null
}

/**
 * Calculate cost for given token counts
 * Uses database if available, falls back to defaults
 *
 * @param model Full model string (e.g., 'anthropic/claude-haiku-4-5')
 * @param inputTokens Number of input tokens
 * @param outputTokens Number of output tokens
 * @returns Cost breakdown with source (database or fallback)
 */
export async function getModelCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<ModelCostResult> {
  const provider = extractProvider(model)
  const modelId = extractModelId(model)

  try {
    // Try to fetch from database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )

    const { data, error } = await supabase
      .from('model_pricing')
      .select('input_cost_per_1m_tokens, output_cost_per_1m_tokens, last_verified_at')
      .eq('provider', provider)
      .eq('model_id', modelId)
      .eq('is_active', true)
      .single()

    if (data && !error) {
      const inputCost = (inputTokens / 1_000_000) * data.input_cost_per_1m_tokens
      const outputCost = (outputTokens / 1_000_000) * data.output_cost_per_1m_tokens

      return {
        inputCost,
        outputCost,
        totalCost: inputCost + outputCost,
        pricingAsOf: new Date(data.last_verified_at),
        source: 'database',
      }
    }
  } catch (err) {
    // Fall through to fallback
    console.warn(`Failed to query pricing for ${model}:`, err)
  }

  // Use fallback pricing
  const fallback = getFallbackPricing(provider, modelId)
  if (fallback) {
    const inputCost = (inputTokens / 1_000_000) * fallback.input
    const outputCost = (outputTokens / 1_000_000) * fallback.output

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      source: 'fallback',
    }
  }

  // Model not found in either source
  console.warn(`No pricing found for ${model}, assuming $0`)
  return {
    inputCost: 0,
    outputCost: 0,
    totalCost: 0,
    source: 'fallback',
  }
}

/**
 * Format cost as USD string
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`
}
