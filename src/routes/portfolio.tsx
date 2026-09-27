import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Sparkles, TriangleAlert } from 'lucide-react'
import { indexById } from '@/lib/coins'
import { useMarkets } from '@/lib/useMarkets'
import {
  demoHoldings,
  loadHoldings,
  newId,
  saveHoldings,
  summarise,
} from '@/lib/portfolio'
import type { Holding } from '@/lib/portfolio'
import {
  deltaClass,
  formatMoney,
  formatMoneySigned,
  formatPct,
} from '@/lib/format'
import { AllocationChart } from '@/components/AllocationChart'
import { PerformanceChart } from '@/components/PerformanceChart'
import { HoldingsTable } from '@/components/HoldingsTable'
import { HoldingDialog } from '@/components/HoldingDialog'
import type { HoldingDraft } from '@/components/HoldingDialog'
import { FeedStatus } from '@/components/FeedStatus'
import { BoltMark } from '@/components/Brand'

export const Route = createFileRoute('/portfolio')({
  component: PortfolioPage,
})

function StatTile({
  label,
  value,
  valueClass = 'text-ink',
  note,
  delay = 0,
}: {
  label: string
  value: string
  valueClass?: string
  note?: React.ReactNode
  delay?: number
}) {
  return (
    <div
      className="panel animate-rise p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="eyebrow">{label}</p>
      <p className={`tnum mt-2 text-2xl ${valueClass}`}>{value}</p>
      {note && <p className="mt-1 text-xs text-ink-3">{note}</p>}
    </div>
  )
}

function PortfolioPage() {
  const markets = useMarkets()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [dialog, setDialog] = useState<{
    open: boolean
    editing?: Holding
    presetCoinId?: string
  }>({ open: false })

  // Holdings live in the browser, so they load after the first paint.
  useEffect(() => {
    setHoldings(loadHoldings())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveHoldings(holdings)
  }, [holdings, hydrated])

  const coins = markets.data?.coins ?? []
  const summary = useMemo(
    () => summarise(holdings, indexById(coins)),
    [holdings, coins],
  )

  function upsert(draft: HoldingDraft) {
    setHoldings((current) => {
      if (dialog.editing) {
        return current.map((holding) =>
          holding.id === dialog.editing?.id
            ? { ...holding, amount: draft.amount, costBasis: draft.costBasis }
            : holding,
        )
      }
      // Buying more of something already tracked tops up the existing position
      // rather than splitting it into two rows.
      const existing = current.find((holding) => holding.coinId === draft.coinId)
      if (existing) {
        return current.map((holding) =>
          holding.id === existing.id
            ? {
                ...holding,
                amount: holding.amount + draft.amount,
                costBasis: holding.costBasis + draft.costBasis,
              }
            : holding,
        )
      }
      return [
        ...current,
        { ...draft, id: newId(), addedAt: new Date().toISOString() },
      ]
    })
    setDialog({ open: false })
  }

  const loadingFeed = markets.status === 'loading'
  const feedDown = markets.status === 'error'
  const empty = hydrated && holdings.length === 0

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-14">
      {/* Headline: value first, everything else in support of it. */}
      <header className="animate-rise">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Portfolio value</p>
            <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
              <span className="tnum text-5xl leading-none font-medium sm:text-6xl">
                {loadingFeed && !hydrated ? '—' : formatMoney(summary.value)}
              </span>
              {summary.value > 0 && (
                <span
                  className={`tnum pb-1 text-base ${deltaClass(summary.change24hValue)}`}
                >
                  {formatMoneySigned(summary.change24hValue)} (
                  {formatPct(summary.change24hPct)}) today
                </span>
              )}
            </div>
            <div className="mt-4">
              <FeedStatus
                source={markets.data?.source ?? 'live'}
                asOf={markets.data?.asOf}
                refreshing={markets.refreshing}
                onRefresh={markets.refresh}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDialog({ open: true })}
              className="inline-flex items-center gap-2 rounded-xl bg-volt px-4 py-2.5 text-sm font-semibold text-void transition-colors hover:bg-volt-deep"
            >
              <Plus className="size-4" />
              Add position
            </button>
          </div>
        </div>
      </header>

      {markets.data?.source === 'snapshot' && (
        <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-loss/30 bg-loss/5 px-4 py-3 text-sm text-ink-2">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-loss" />
          The live price feed did not answer, so these figures come from the last
          stored snapshot. Your positions are untouched — refresh to try again.
        </p>
      )}

      {feedDown && (
        <div className="panel mt-8 p-8 text-center">
          <p className="display text-2xl">The market feed is unreachable</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-3">
            {markets.error}. Your positions are stored on this device and are
            safe; only the prices are missing.
          </p>
          <button
            type="button"
            onClick={markets.refresh}
            className="mt-5 rounded-xl bg-volt px-4 py-2.5 text-sm font-semibold text-void"
          >
            Try again
          </button>
        </div>
      )}

      {!feedDown && empty && <EmptyState onAdd={() => setDialog({ open: true })} onDemo={() => setHoldings(demoHoldings())} />}

      {!feedDown && !empty && (
        <>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Cost basis"
              value={formatMoney(summary.cost)}
              note={`${summary.rows.length} position${summary.rows.length === 1 ? '' : 's'} tracked`}
              delay={40}
            />
            <StatTile
              label="All-time profit / loss"
              value={formatMoneySigned(summary.profit)}
              valueClass={deltaClass(summary.profit)}
              note={formatPct(summary.profitPct)}
              delay={80}
            />
            <StatTile
              label="Change today"
              value={formatMoneySigned(summary.change24hValue)}
              valueClass={deltaClass(summary.change24hValue)}
              note={formatPct(summary.change24hPct)}
              delay={120}
            />
            <StatTile
              label="Best performer"
              value={summary.best ? summary.best.holding.symbol : '—'}
              note={
                summary.best ? (
                  <span className={deltaClass(summary.best.profitPct)}>
                    {formatPct(summary.best.profitPct)} since you bought
                  </span>
                ) : (
                  'Add a cost basis to rank returns'
                )
              }
              delay={160}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <section
              className="panel animate-rise p-6 lg:col-span-2"
              style={{ animationDelay: '200ms' }}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="display text-xl">Value over the last 7 days</h2>
                <span className="text-xs text-ink-3">
                  Your quantities at each day&rsquo;s prices
                </span>
              </div>
              <div className="mt-5">
                {summary.series.length > 1 ? (
                  <PerformanceChart series={summary.series} />
                ) : (
                  <div className="grid h-64 place-content-center text-center text-sm text-ink-3">
                    Price history arrives with the next refresh.
                  </div>
                )}
              </div>
            </section>

            <section
              className="panel animate-rise p-6"
              style={{ animationDelay: '240ms' }}
            >
              <h2 className="display text-xl">Allocation</h2>
              <div className="mt-6">
                <AllocationChart slices={summary.allocation} total={summary.value} />
              </div>
            </section>
          </div>

          <section
            className="panel animate-rise mt-4 p-6"
            style={{ animationDelay: '280ms' }}
          >
            <div className="flex items-baseline justify-between">
              <h2 className="display text-xl">Positions</h2>
              {summary.worst && (
                <span className="hidden text-xs text-ink-3 sm:block">
                  Weakest: {summary.worst.holding.symbol}{' '}
                  <span className={deltaClass(summary.worst.profitPct)}>
                    {formatPct(summary.worst.profitPct)}
                  </span>
                </span>
              )}
            </div>
            <div className="mt-5">
              <HoldingsTable
                rows={summary.rows}
                onEdit={(holding) => setDialog({ open: true, editing: holding })}
                onRemove={(id) =>
                  setHoldings((current) =>
                    current.filter((holding) => holding.id !== id),
                  )
                }
              />
            </div>
          </section>
        </>
      )}

      <HoldingDialog
        open={dialog.open}
        coins={coins}
        editing={dialog.editing}
        presetCoinId={dialog.presetCoinId}
        onClose={() => setDialog({ open: false })}
        onSubmit={upsert}
      />
    </div>
  )
}

function EmptyState({
  onAdd,
  onDemo,
}: {
  onAdd: () => void
  onDemo: () => void
}) {
  return (
    <div className="panel animate-rise mt-10 overflow-hidden">
      <div className="rule-grid px-8 py-14 text-center">
        <BoltMark className="mx-auto size-11" />
        <h2 className="display mt-6 text-3xl">Nothing tracked yet</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-2">
          Add what you hold and how much you paid. Zapbuy does the rest — live
          valuation, weight, and profit or loss per position. No exchange
          connection, no wallet signature.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-volt px-5 py-2.5 text-sm font-semibold text-void transition-colors hover:bg-volt-deep"
          >
            <Plus className="size-4" />
            Add your first position
          </button>
          <button
            type="button"
            onClick={onDemo}
            className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Sparkles className="size-4" />
            Load a sample portfolio
          </button>
        </div>
      </div>
    </div>
  )
}
