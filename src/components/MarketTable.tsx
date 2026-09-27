import { Check, Plus } from 'lucide-react'
import type { Coin } from '@/lib/coins'
import { formatCompactUsd, formatUsd } from '@/lib/format'
import { CoinMark } from './CoinMark'
import { Delta } from './Delta'
import { Sparkline } from './Sparkline'

type Props = {
  coins: Coin[]
  heldIds: Set<string>
  onAdd: (coinId: string) => void
}

function AddButton({
  coin,
  held,
  onAdd,
}: {
  coin: Coin
  held: boolean
  onAdd: (coinId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(coin.id)}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        held
          ? 'border-line-soft text-ink-3 hover:border-line hover:text-ink'
          : 'border-line text-ink-2 hover:border-volt hover:bg-volt hover:text-void'
      }`}
      aria-label={
        held ? `Add to your ${coin.symbol} position` : `Track ${coin.name}`
      }
    >
      {held ? <Check className="size-3" /> : <Plus className="size-3" />}
      {held ? 'Held' : 'Track'}
    </button>
  )
}

export function MarketTable({ coins, heldIds, onAdd }: Props) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="pb-3 pr-3 text-[11px] font-medium tracking-[0.12em] uppercase text-ink-3">
                #
              </th>
              <th className="pb-3 text-[11px] font-medium tracking-[0.12em] uppercase text-ink-3">
                Coin
              </th>
              {['Price', '24h', '7d', 'Market cap'].map((heading) => (
                <th
                  key={heading}
                  className="pb-3 text-right text-[11px] font-medium tracking-[0.12em] uppercase text-ink-3"
                >
                  {heading}
                </th>
              ))}
              <th className="pb-3 pl-6 text-[11px] font-medium tracking-[0.12em] uppercase text-ink-3">
                Last 7 days
              </th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {coins.map((coin) => (
              <tr
                key={coin.id}
                className="border-b border-line-soft transition-colors last:border-0 hover:bg-surface-2/60"
              >
                <td className="tnum py-3.5 pr-3 text-xs text-ink-3">{coin.rank}</td>
                <td className="py-3.5">
                  <div className="flex items-center gap-3">
                    <CoinMark src={coin.image} symbol={coin.symbol} size={26} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{coin.name}</p>
                      <p className="text-xs text-ink-3">{coin.symbol}</p>
                    </div>
                  </div>
                </td>
                <td className="tnum py-3.5 text-right text-ink">
                  {formatUsd(coin.price)}
                </td>
                <td className="py-3.5 text-right">
                  <Delta value={coin.change24h} />
                </td>
                <td className="py-3.5 text-right">
                  <Delta value={coin.change7d} />
                </td>
                <td className="tnum py-3.5 text-right text-ink-2">
                  {formatCompactUsd(coin.marketCap)}
                </td>
                <td className="py-3.5 pl-6">
                  <Sparkline
                    values={coin.sparkline}
                    positive={coin.change7d >= 0}
                  />
                </td>
                <td className="py-3.5 pl-4 text-right">
                  <AddButton
                    coin={coin}
                    held={heldIds.has(coin.id)}
                    onAdd={onAdd}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line-soft md:hidden">
        {coins.map((coin) => (
          <li key={coin.id} className="flex items-center gap-3 py-3.5">
            <CoinMark src={coin.image} symbol={coin.symbol} size={30} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{coin.name}</p>
              <p className="tnum text-xs text-ink-3">{formatUsd(coin.price)}</p>
            </div>
            <Sparkline
              values={coin.sparkline}
              positive={coin.change7d >= 0}
              width={64}
              height={26}
            />
            <div className="w-20 text-right">
              <Delta value={coin.change24h} className="text-xs" />
            </div>
            <AddButton coin={coin} held={heldIds.has(coin.id)} onAdd={onAdd} />
          </li>
        ))}
      </ul>
    </>
  )
}
