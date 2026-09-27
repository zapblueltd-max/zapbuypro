/** Shape of the market data the UI consumes, plus the browser-side client for
 *  `/api/markets`. The route normalises the upstream provider's payload so this
 *  type is the only market contract the components know about. */

export type Coin = {
  id: string
  symbol: string
  name: string
  image: string
  rank: number
  price: number
  change24h: number
  change7d: number
  marketCap: number
  volume24h: number
  /** Hourly closes for the trailing 7 days, oldest first. */
  sparkline: number[]
}

export type MarketsPayload = {
  coins: Coin[]
  asOf: string
  /** `snapshot` means the upstream feed was unreachable and a stored snapshot
   *  was served instead, so the UI can say so rather than show stale data as live. */
  source: 'live' | 'snapshot'
}

export async function fetchMarkets(signal?: AbortSignal): Promise<MarketsPayload> {
  const response = await fetch('/api/markets', { signal })
  if (!response.ok) throw new Error(`Market feed responded ${response.status}`)
  return (await response.json()) as MarketsPayload
}

export function indexById(coins: Coin[]): Map<string, Coin> {
  return new Map(coins.map((coin) => [coin.id, coin]))
}
