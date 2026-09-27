/** Number formatting. Every figure the user reads passes through here so that
 *  precision rules stay consistent between the tables, tiles and charts. */

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
})

/** Prices span nine orders of magnitude in this asset class, so precision is
 *  chosen from the value rather than fixed at two decimals. */
export function formatUsd(value: number): string {
  const abs = Math.abs(value)
  const digits = abs >= 1000 ? 0 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

/** Money that always wants cents: totals, cost basis, profit and loss. */
export function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatMoneySigned(value: number): string {
  return `${value < 0 ? '−' : '+'}${formatMoney(Math.abs(value))}`
}

export function formatCompactUsd(value: number): string {
  return `$${compact.format(value)}`
}

export function formatPct(value: number, digits = 2): string {
  return `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(digits)}%`
}

/** Token quantities: trim trailing zeros but never round a holding to nothing. */
export function formatAmount(value: number): string {
  const abs = Math.abs(value)
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 8
  return value
    .toFixed(digits)
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '')
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Delta colour is only ever a reinforcement — a sign and a value are always
 *  rendered alongside it, so direction never rests on hue alone. */
export function deltaClass(value: number): string {
  if (value > 0) return 'text-gain'
  if (value < 0) return 'text-loss'
  return 'text-ink-2'
}
