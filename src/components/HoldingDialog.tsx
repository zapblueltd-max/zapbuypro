import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Coin } from '@/lib/coins'
import type { Holding } from '@/lib/portfolio'
import { formatMoney, formatUsd } from '@/lib/format'
import { CoinMark } from './CoinMark'

export type HoldingDraft = {
  coinId: string
  symbol: string
  name: string
  amount: number
  costBasis: number
}

type Props = {
  open: boolean
  coins: Coin[]
  /** Present when editing an existing position. */
  editing?: Holding
  /** Preselects a coin when the dialog is opened from a market row. */
  presetCoinId?: string
  onClose: () => void
  onSubmit: (draft: HoldingDraft) => void
}

/**
 * Add or edit a position. Quantity and average buy price are what people
 * actually remember, so cost basis is derived from them rather than typed.
 */
export function HoldingDialog({
  open,
  coins,
  editing,
  presetCoinId,
  onClose,
  onSubmit,
}: Props) {
  const [query, setQuery] = useState('')
  const [coinId, setCoinId] = useState('')
  const [amount, setAmount] = useState('')
  const [avgPrice, setAvgPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  const selected = useMemo(
    () => coins.find((coin) => coin.id === coinId),
    [coins, coinId],
  )

  // Reset the form each time the dialog opens so a cancelled edit leaves nothing behind.
  useEffect(() => {
    if (!open) return
    const startId = editing?.coinId ?? presetCoinId ?? ''
    setCoinId(startId)
    setQuery('')
    setError(null)
    setAmount(editing ? String(editing.amount) : '')
    if (editing && editing.amount > 0) {
      setAvgPrice((editing.costBasis / editing.amount).toFixed(2))
    } else {
      const start = coins.find((coin) => coin.id === startId)
      setAvgPrice(start ? String(Number(start.price.toPrecision(6))) : '')
    }
  }, [open, editing, presetCoinId, coins])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return coins.slice(0, 6)
    return coins
      .filter(
        (coin) =>
          coin.name.toLowerCase().includes(needle) ||
          coin.symbol.toLowerCase().includes(needle),
      )
      .slice(0, 6)
  }, [coins, query])

  if (!open) return null

  const parsedAmount = Number(amount)
  const parsedPrice = Number(avgPrice)
  const impliedCost =
    Number.isFinite(parsedAmount) && Number.isFinite(parsedPrice)
      ? parsedAmount * parsedPrice
      : 0

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!selected) return setError('Pick a coin to track.')
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return setError('Enter the quantity you hold — it has to be above zero.')
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return setError('Average buy price cannot be negative.')
    }
    onSubmit({
      coinId: selected.id,
      symbol: selected.symbol,
      name: selected.name,
      amount: parsedAmount,
      costBasis: parsedAmount * parsedPrice,
    })
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-void/80 backdrop-blur-sm"
      />

      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Edit position' : 'Add a position'}
        className="panel relative w-full max-w-md animate-rise rounded-b-none p-6 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="display text-2xl">
              {editing ? 'Edit position' : 'Add a position'}
            </h2>
            <p className="mt-1 text-sm text-ink-3">
              Zapbuy values it against the live price.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {/* Coin picker */}
          <div>
            <span className="eyebrow">Coin</span>
            {selected ? (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                <CoinMark src={selected.image} symbol={selected.symbol} size={26} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {selected.name}
                  <span className="ml-2 text-ink-3">{selected.symbol}</span>
                </span>
                <span className="tnum text-sm text-ink-2">
                  {formatUsd(selected.price)}
                </span>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => setCoinId('')}
                    className="text-xs text-volt hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-2">
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search Bitcoin, SOL, LINK…"
                  className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm placeholder:text-ink-3 focus:border-volt focus:outline-none"
                />
                <ul className="thin-scroll mt-2 max-h-56 overflow-y-auto rounded-xl border border-line-soft">
                  {matches.length === 0 && (
                    <li className="px-3 py-3 text-sm text-ink-3">
                      Nothing matches “{query}”. Zapbuy tracks the top 40 coins by
                      market cap today.
                    </li>
                  )}
                  {matches.map((coin) => (
                    <li key={coin.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setCoinId(coin.id)
                          setAvgPrice(String(Number(coin.price.toPrecision(6))))
                          setError(null)
                          requestAnimationFrame(() => amountRef.current?.focus())
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                      >
                        <CoinMark src={coin.image} symbol={coin.symbol} size={22} />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {coin.name}
                          <span className="ml-2 text-ink-3">{coin.symbol}</span>
                        </span>
                        <span className="tnum text-xs text-ink-2">
                          {formatUsd(coin.price)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="eyebrow">Quantity</span>
              <input
                ref={amountRef}
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value)
                  setError(null)
                }}
                inputMode="decimal"
                placeholder="0.4182"
                className="tnum mt-2 w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm placeholder:text-ink-3 focus:border-volt focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="eyebrow">Avg buy price</span>
              <input
                value={avgPrice}
                onChange={(event) => {
                  setAvgPrice(event.target.value)
                  setError(null)
                }}
                inputMode="decimal"
                placeholder="62612.00"
                className="tnum mt-2 w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm placeholder:text-ink-3 focus:border-volt focus:outline-none"
              />
            </label>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line-soft bg-surface-2/50 px-3 py-2.5 text-sm">
            <span className="text-ink-3">Cost basis</span>
            <span className="tnum text-ink">
              {impliedCost > 0 ? formatMoney(impliedCost) : '—'}
            </span>
          </div>

          {error && (
            <p className="rounded-xl border border-loss/40 bg-loss/10 px-3 py-2.5 text-sm text-loss">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-volt px-4 py-2.5 text-sm font-semibold text-void transition-colors hover:bg-volt-deep"
          >
            {editing ? 'Save changes' : 'Add position'}
          </button>
        </div>
      </form>
    </div>
  )
}
