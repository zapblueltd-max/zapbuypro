// Regenerates src/lib/snapshot.ts — the fallback market payload served when the
// upstream price feed is unreachable or rate limited.
// Usage: node scripts/generate-snapshot.mjs
import { writeFile } from 'node:fs/promises'

const url =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=40&page=1&sparkline=true&price_change_percentage=24h,7d'

const res = await fetch(url, { headers: { accept: 'application/json' } })
if (!res.ok) throw new Error(`upstream responded ${res.status}`)
const raw = await res.json()

const sig = (n, digits = 6) => Number(Number(n).toPrecision(digits))

const coins = raw.map((c, i) => {
  const series = c.sparkline_in_7d?.price ?? []
  // Every third hourly close keeps the shape of the week at a fifth of the bytes.
  const sparkline = series.filter((_, idx) => idx % 3 === 0).map((p) => sig(p, 6))
  return {
    id: c.id,
    symbol: String(c.symbol).toUpperCase(),
    name: c.name,
    image: c.image,
    rank: c.market_cap_rank ?? i + 1,
    price: sig(c.current_price, 8),
    change24h: sig(c.price_change_percentage_24h_in_currency ?? 0, 4),
    change7d: sig(c.price_change_percentage_7d_in_currency ?? 0, 4),
    marketCap: Math.round(c.market_cap ?? 0),
    volume24h: Math.round(c.total_volume ?? 0),
    sparkline,
  }
})

const body = `/** Fallback market payload. Generated from a live capture by
 *  \`scripts/generate-snapshot.mjs\`; served by /api/markets when the upstream
 *  feed is unreachable so the interface degrades to labelled stale data rather
 *  than an error page. Sparklines are every third hourly close over 7 days. */
import type { Coin } from './coins'

export const snapshotAsOf = ${JSON.stringify(new Date().toISOString())}

export const snapshotCoins: Coin[] = ${JSON.stringify(coins)}
`

await writeFile('src/lib/snapshot.ts', body)
console.log(`wrote src/lib/snapshot.ts — ${coins.length} coins, ${coins[0].sparkline.length} spark points`)
