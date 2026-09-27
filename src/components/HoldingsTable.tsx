import { Pencil, Trash2 } from 'lucide-react'
import type { Holding, ValuedHolding } from '@/lib/portfolio'
import {
  formatAmount,
  formatMoney,
  formatMoneySigned,
  formatUsd,
  deltaClass,
} from '@/lib/format'
import { CoinMark } from './CoinMark'
import { Delta } from './Delta'

type Props = {
  rows: ValuedHolding[]
  onEdit: (holding: Holding) => void
  onRemove: (id: string) => void
}

function WeightBar({ weight }: { weight: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-14 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-volt"
          style={{ width: `${Math.max(weight, 1.5)}%` }}
        />
      </div>
      <span className="tnum text-xs text-ink-2">{weight.toFixed(1)}%</span>
    </div>
  )
}

function RowActions({ row, onEdit, onRemove }: Props & { row: ValuedHolding }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit(row.holding)}
        className="rounded-lg p-2 text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
        aria-label={`Edit ${row.holding.name} position`}
      >
        <Pencil className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onRemove(row.holding.id)}
        className="rounded-lg p-2 text-ink-3 transition-colors hover:bg-surface-3 hover:text-loss"
        aria-label={`Remove ${row.holding.name} position`}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}

export function HoldingsTable(props: Props) {
  const { rows, onEdit, onRemove } = props

  return (
    <>
      {/* Desktop: the full ledger. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {['Position', 'Price', 'Holdings', 'Cost basis', 'Profit / loss', 'Weight', ''].map(
                (heading, index) => (
                  <th
                    key={heading || 'actions'}
                    className={`pb-3 text-[11px] font-medium tracking-[0.12em] uppercase text-ink-3 ${
                      index > 0 && index < 6 ? 'text-right' : ''
                    } ${index === 6 ? 'text-right' : ''}`}
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.holding.id}
                className="border-b border-line-soft transition-colors last:border-0 hover:bg-surface-2/60"
              >
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-3">
                    <CoinMark src={row.coin?.image} symbol={row.holding.symbol} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">
                        {row.holding.name}
                      </p>
                      <p className="tnum text-xs text-ink-3">
                        {formatAmount(row.holding.amount)} {row.holding.symbol}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <p className="tnum text-ink">{formatUsd(row.price)}</p>
                  <Delta value={row.change24hPct} className="text-xs" />
                </td>
                <td className="tnum py-4 text-right text-ink">
                  {formatMoney(row.value)}
                </td>
                <td className="tnum py-4 text-right text-ink-2">
                  {formatMoney(row.cost)}
                </td>
                <td className="py-4 text-right">
                  <p className={`tnum ${deltaClass(row.profit)}`}>
                    {formatMoneySigned(row.profit)}
                  </p>
                  <Delta value={row.profitPct} className="text-xs" />
                </td>
                <td className="py-4">
                  <div className="flex justify-end">
                    <WeightBar weight={row.weight} />
                  </div>
                </td>
                <td className="py-4">
                  <RowActions {...props} row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: one card per position, value first. */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={row.holding.id}
            className="rounded-xl border border-line-soft bg-surface-2/40 p-4"
          >
            <div className="flex items-center gap-3">
              <CoinMark src={row.coin?.image} symbol={row.holding.symbol} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.holding.name}</p>
                <p className="tnum text-xs text-ink-3">
                  {formatAmount(row.holding.amount)} {row.holding.symbol} ·{' '}
                  {formatUsd(row.price)}
                </p>
              </div>
              <div className="text-right">
                <p className="tnum font-medium">{formatMoney(row.value)}</p>
                <Delta value={row.change24hPct} className="text-xs" />
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between border-t border-line-soft pt-3">
              <div>
                <p className="eyebrow">Profit / loss</p>
                <p className={`tnum text-sm ${deltaClass(row.profit)}`}>
                  {formatMoneySigned(row.profit)}{' '}
                  <span className="text-xs">({row.profitPct.toFixed(1)}%)</span>
                </p>
              </div>
              <RowActions rows={rows} onEdit={onEdit} onRemove={onRemove} row={row} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
