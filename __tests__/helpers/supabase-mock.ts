import { vi } from 'vitest'

export type MockResult = { data?: unknown; error?: { message: string } | null }

/**
 * Builds a chainable Supabase mock where each call to `from()` consumes the
 * next result from the provided array. All chaining methods (select, eq, gte,
 * insert, update, delete, …) return `this` so the caller can chain freely.
 * The chain is thenable (safe to `await` directly) and also exposes `.single()`
 * — both resolve to the same configured result.
 */
export function makeChain(result: MockResult): Record<string, unknown> {
  const chain: Record<string, unknown> = {}

  for (const method of [
    'select', 'eq', 'neq', 'gte', 'lte', 'order', 'limit', 'filter',
    'insert', 'update', 'delete',
  ]) {
    chain[method] = vi.fn().mockReturnThis()
  }

  chain.single = vi.fn().mockResolvedValue(result)

  // Make the chain directly awaitable (for calls not ending in .single())
  chain.then = (onFulfilled: (v: MockResult) => unknown, onRejected?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected)
  chain.catch = (onRejected: (e: unknown) => unknown) =>
    Promise.resolve(result).catch(onRejected)
  chain.finally = (onFinally: () => void) =>
    Promise.resolve(result).finally(onFinally)

  return chain
}

export function createMockClient(fromResults: MockResult[]) {
  let callIndex = 0
  return {
    from: vi.fn().mockImplementation(() => {
      const result = fromResults[callIndex++] ?? { data: null, error: null }
      return makeChain(result)
    }),
  }
}
