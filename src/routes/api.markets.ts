import { createFileRoute } from '@tanstack/react-router'
import type { Coin, MarketsPayload } from '@/lib/coins'
import { snapshotAsOf, snapshotCoins } from '@/lib/snapshot'

/**
 * Market data endpoint.
 *
 * The browser never talks to the price provider directly: proxying keeps the
 * optional provider key server-side, lets the CDN collapse every visitor onto
 * one upstream request per interval, and gives us one place to fall back to a
 * stored snapshot when the feed is down.
 */

const UPSTREAM = 'https://api.coingecko.com/api/v3/coins/markets'
const COIN_COUNT = 40

/** How long a response is reusable at the edge. Crypto prices move constantly,
 *  but a tracker does not need sub-minute resolution to be useful. */
const EDGE_TTL_SECONDS = 45
const STALE_WHILE_REVALIDATE_SECONDS = 600

/** Second-level guard for bursts that arrive behind a cold cache. */
const MEMO_TTL_MS = 20_000
let memo: { payload: MarketsPayload; at: number } | null = null

type UpstreamCoin = {
  id: string
  symbol: string
  name: string
  image: string
  market_cap_rank: number | null
  current_price: number | null
  market_cap: number | null
  total_volume: number | null
  price_change_percentage_24h_in_currency: number | null
  price_change_percentage_7d_in_currency: number | null
  sparkline_in_7d?: { price?: number[] }
}

function normalise(raw: UpstreamCoin[]): Coin[] {
  return raw
    .filter((coin) => typeof coin.current_price === 'number')
    .map((coin, index) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      rank: coin.market_cap_rank ?? index + 1,
      price: coin.current_price as number,
      change24h: coin.price_change_percentage_24h_in_currency ?? 0,
      change7d: coin.price_change_percentage_7d_in_currency ?? 0,
      marketCap: coin.market_cap ?? 0,
      volume24h: coin.total_volume ?? 0,
      // Every third hourly close: enough shape for a sparkline, a third of the bytes.
      sparkline: (coin.sparkline_in_7d?.price ?? []).filter(
        (_, i) => i % 3 === 0,
      ),
    }))
}

async function loadLive(): Promise<Coin[]> {
  const url = new URL(UPSTREAM)
  url.searchParams.set('vs_currency', 'usd')
  url.searchParams.set('order', 'market_cap_desc')
  url.searchParams.set('per_page', String(COIN_COUNT))
  url.searchParams.set('page', '1')
  url.searchParams.set('sparkline', 'true')
  url.searchParams.set('price_change_percentage', '24h,7d')

  const headers: Record<string, string> = { accept: 'application/json' }
  // Optional: set COINGECKO_API_KEY to lift the shared anonymous rate limit.
  const key = process.env.COINGECKO_API_KEY
  if (key) headers['x-cg-demo-api-key'] = key

  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(8_000),
  })
  if (!response.ok) throw new Error(`upstream responded ${response.status}`)

  const coins = normalise((await response.json()) as UpstreamCoin[])
  if (coins.length === 0) throw new Error('upstream returned no usable rows')
  return coins
}

function respond(payload: MarketsPayload) {
  return Response.json(payload, {
    headers: {
      // Browsers revalidate; the CDN absorbs the traffic.
      'cache-control': 'public, max-age=0, must-revalidate',
      'netlify-cdn-cache-control': `public, durable, s-maxage=${EDGE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
    },
  })
}

export const Route = createFileRoute('/api/markets')({
  server: {
    handlers: {
      GET: async () => {
        if (memo && Date.now() - memo.at < MEMO_TTL_MS) {
          return respond(memo.payload)
        }

        try {
          const payload: MarketsPayload = {
            coins: await loadLive(),
            asOf: new Date().toISOString(),
            source: 'live',
          }
          memo = { payload, at: Date.now() }
          return respond(payload)
        } catch (error) {
          console.error('[api/markets] falling back to snapshot:', error)
          return respond({
            coins: snapshotCoins,
            asOf: snapshotAsOf,
            source: 'snapshot',
          })
        }
      },
    },
  },
})
