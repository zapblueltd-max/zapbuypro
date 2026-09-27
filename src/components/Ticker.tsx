import type { Coin } from '@/lib/coins'
import { formatUsd } from '@/lib/format'
import { Delta } from './Delta'

/**
 * Continuous price strip. The list is rendered twice and the track translates
 * by half its width, so the loop has no visible seam. Hover pauses it, which
 * matters because the numbers are real and people try to read them.
 */
export function Ticker({ coins }: { coins: Coin[] }) {
  if (coins.length === 0) {
    return <div className="h-11 border-y border-line-soft" />
  }

  const strip = [...coins, ...coins]

  return (
    <div className="relative overflow-hidden border-y border-line-soft bg-surface/40">
      <div className="marquee-track flex w-max animate-marquee items-center">
        {strip.map((coin, index) => (
          <span
            key={`${coin.id}-${index}`}
            className="flex items-center gap-2.5 border-r border-line-soft px-5 py-3 text-xs whitespace-nowrap"
          >
            <span className="font-semibold text-ink">{coin.symbol}</span>
            <span className="tnum text-ink-2">{formatUsd(coin.price)}</span>
            <Delta value={coin.change24h} showGlyph={false} />
          </span>
        ))}
      </div>
      {/* Feather the edges so items enter and leave rather than being clipped. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-void to-transparent" />
    </div>
  )
}
