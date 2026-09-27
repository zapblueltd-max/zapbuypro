import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMarkets } from './coins'
import type { MarketsPayload } from './coins'

export type MarketsState = {
  status: 'loading' | 'ready' | 'error'
  data?: MarketsPayload
  error?: string
  /** True while a background refresh is in flight over already-rendered data. */
  refreshing: boolean
}

/**
 * Subscribes to the market feed. Refreshes on an interval, and again whenever
 * the tab comes back to the foreground so a portfolio left open overnight is
 * never read at yesterday's prices.
 */
export function useMarkets(intervalMs = 60_000): MarketsState & {
  refresh: () => void
} {
  const [state, setState] = useState<MarketsState>({
    status: 'loading',
    refreshing: false,
  })
  const inFlight = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller

    setState((previous) => ({ ...previous, refreshing: true }))
    try {
      const data = await fetchMarkets(controller.signal)
      setState({ status: 'ready', data, refreshing: false })
    } catch (error) {
      if (controller.signal.aborted) return
      setState((previous) => ({
        status: previous.data ? 'ready' : 'error',
        data: previous.data,
        error:
          error instanceof Error ? error.message : 'Could not reach the market feed',
        refreshing: false,
      }))
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), intervalMs)

    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      inFlight.current?.abort()
    }
  }, [load, intervalMs])

  return { ...state, refresh: () => void load() }
}
