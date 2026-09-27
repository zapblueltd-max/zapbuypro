import type { Coin } from './coins'

/**
 * Portfolio state and valuation.
 *
 * Holdings currently live in the browser's local storage. Everything that
 * touches persistence is confined to the `loadHoldings` / `saveHoldings` pair
 * below, so moving to per-account server storage is a change to two functions
 * rather than a change to the screens. See PLAN.md, milestone 3.
 */

const STORAGE_KEY = 'zapbuy.holdings.v1'

export type Holding = {
  id: string
  coinId: string
  symbol: string
  name: string
  /** Quantity of the token held. */
  amount: number
  /** Total amount paid, in USD, across every purchase of this position. */
  costBasis: number
  addedAt: string
}

export type ValuedHolding = {
  holding: Holding
  coin?: Coin
  price: number
  value: number
  cost: number
  profit: number
  profitPct: number
  /** Share of total portfolio value, 0–100. */
  weight: number
  change24hPct: number
  change24hValue: number
}

export type AllocationSlice = {
  label: string
  value: number
  weight: number
}

export type PortfolioSummary = {
  rows: ValuedHolding[]
  value: number
  cost: number
  profit: number
  profitPct: number
  change24hValue: number
  change24hPct: number
  allocation: AllocationSlice[]
  /** Portfolio value over the trailing 7 days, reconstructed from each held
   *  coin's price history at the quantities held today. */
  series: number[]
  best?: ValuedHolding
  worst?: ValuedHolding
}

/** Five named slices plus "Other" keeps the chart inside the validated part of
 *  the categorical palette and keeps the legend readable. */
const MAX_NAMED_SLICES = 5

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `h_${Math.random().toString(36).slice(2, 11)}`
}

export function loadHoldings(): Holding[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isHolding)
  } catch {
    return []
  }
}

export function saveHoldings(holdings: Holding[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
  } catch {
    // Storage can be full or blocked; the in-memory portfolio still works.
  }
}

function isHolding(value: unknown): value is Holding {
  if (!value || typeof value !== 'object') return false
  const h = value as Partial<Holding>
  return (
    typeof h.id === 'string' &&
    typeof h.coinId === 'string' &&
    typeof h.symbol === 'string' &&
    typeof h.amount === 'number' &&
    Number.isFinite(h.amount) &&
    typeof h.costBasis === 'number' &&
    Number.isFinite(h.costBasis)
  )
}

/** A worked example so a first-time visitor can see the tracker doing its job
 *  before committing their own numbers. Entry prices are deliberately mixed:
 *  some positions are up, some are down. */
export function demoHoldings(): Holding[] {
  const at = new Date().toISOString()
  const seed: Array<Omit<Holding, 'id' | 'addedAt'>> = [
    { coinId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', amount: 0.4182, costBasis: 26184.23 },
    { coinId: 'ethereum', symbol: 'ETH', name: 'Ethereum', amount: 7.34, costBasis: 22411.6 },
    { coinId: 'solana', symbol: 'SOL', name: 'Solana', amount: 63.5, costBasis: 9412.75 },
    { coinId: 'chainlink', symbol: 'LINK', name: 'Chainlink', amount: 412.7, costBasis: 6338.14 },
    { coinId: 'monero', symbol: 'XMR', name: 'Monero', amount: 9.2, costBasis: 2847.9 },
    { coinId: 'hyperliquid', symbol: 'HYPE', name: 'Hyperliquid', amount: 31.4, costBasis: 1204.88 },
  ]
  return seed.map((entry) => ({ ...entry, id: newId(), addedAt: at }))
}

export function summarise(
  holdings: Holding[],
  byId: Map<string, Coin>,
): PortfolioSummary {
  const rows: ValuedHolding[] = holdings.map((holding) => {
    const coin = byId.get(holding.coinId)
    const price = coin?.price ?? 0
    const value = price * holding.amount
    const cost = holding.costBasis
    const profit = value - cost
    const change24hPct = coin?.change24h ?? 0
    // Yesterday's value implied by the 24h move, so the day delta is in dollars.
    const previous = value / (1 + change24hPct / 100)
    return {
      holding,
      coin,
      price,
      value,
      cost,
      profit,
      profitPct: cost > 0 ? (profit / cost) * 100 : 0,
      weight: 0,
      change24hPct,
      change24hValue: Number.isFinite(previous) ? value - previous : 0,
    }
  })

  const value = rows.reduce((total, row) => total + row.value, 0)
  const cost = rows.reduce((total, row) => total + row.cost, 0)
  const change24hValue = rows.reduce((total, row) => total + row.change24hValue, 0)

  for (const row of rows) {
    row.weight = value > 0 ? (row.value / value) * 100 : 0
  }
  rows.sort((a, b) => b.value - a.value)

  const ranked = rows.filter((row) => row.cost > 0)
  const byReturn = [...ranked].sort((a, b) => b.profitPct - a.profitPct)

  const profit = value - cost
  const openingValue = value - change24hValue

  return {
    rows,
    value,
    cost,
    profit,
    profitPct: cost > 0 ? (profit / cost) * 100 : 0,
    change24hValue,
    change24hPct: openingValue > 0 ? (change24hValue / openingValue) * 100 : 0,
    allocation: allocate(rows),
    series: reconstructSeries(rows),
    best: byReturn[0],
    worst: byReturn.length > 1 ? byReturn[byReturn.length - 1] : undefined,
  }
}

function allocate(rows: ValuedHolding[]): AllocationSlice[] {
  const priced = rows.filter((row) => row.value > 0)
  if (priced.length === 0) return []

  const named = priced.slice(0, MAX_NAMED_SLICES).map((row) => ({
    label: row.holding.symbol,
    value: row.value,
    weight: row.weight,
  }))

  const rest = priced.slice(MAX_NAMED_SLICES)
  if (rest.length > 0) {
    named.push({
      label: 'Other',
      value: rest.reduce((total, row) => total + row.value, 0),
      weight: rest.reduce((total, row) => total + row.weight, 0),
    })
  }
  return named
}

/**
 * Rebuilds the portfolio's value curve by replaying each coin's own price
 * history at today's quantities. Series can differ in length between coins, so
 * they are aligned from the most recent point backwards and truncated to the
 * shortest one.
 */
function reconstructSeries(rows: ValuedHolding[]): number[] {
  const tracked = rows.filter(
    (row) => (row.coin?.sparkline.length ?? 0) > 1 && row.holding.amount > 0,
  )
  if (tracked.length === 0) return []

  const length = Math.min(
    ...tracked.map((row) => row.coin?.sparkline.length ?? 0),
  )
  if (length < 2) return []

  const series = new Array<number>(length).fill(0)
  for (const row of tracked) {
    const prices = row.coin?.sparkline ?? []
    const offset = prices.length - length
    for (let i = 0; i < length; i += 1) {
      series[i] += prices[offset + i] * row.holding.amount
    }
  }
  return series
}
