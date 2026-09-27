import { RefreshCw } from 'lucide-react'
import { formatClock } from '@/lib/format'

/**
 * Says where the numbers came from and when. A tracker that quietly shows stale
 * prices is worse than one that admits the feed is down.
 */
export function FeedStatus({
  source,
  asOf,
  refreshing,
  onRefresh,
}: {
  source: 'live' | 'snapshot'
  asOf?: string
  refreshing?: boolean
  onRefresh?: () => void
}) {
  const live = source === 'live'
  return (
    <div className="flex items-center gap-3 text-xs text-ink-3">
      <span className="flex items-center gap-2">
        <span
          className={`size-1.5 rounded-full ${live ? 'bg-gain' : 'bg-loss'}`}
          style={live ? { animation: 'pulse-dot 2.4s ease-in-out infinite' } : undefined}
          aria-hidden="true"
        />
        {live ? 'Live prices' : 'Last known snapshot'}
        {asOf && <span className="tnum">· {formatClock(asOf)}</span>}
      </span>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 transition-colors hover:text-ink"
        >
          <RefreshCw className={`size-3 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      )}
    </div>
  )
}
