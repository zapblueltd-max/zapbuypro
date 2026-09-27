import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, KeyRound, Plus, Scale } from 'lucide-react'
import { useMarkets } from '@/lib/useMarkets'
import { formatCompactUsd, formatUsd } from '@/lib/format'
import { Ticker } from '@/components/Ticker'
import { Delta } from '@/components/Delta'
import { CoinMark } from '@/components/CoinMark'
import { Sparkline } from '@/components/Sparkline'
import { FeedStatus } from '@/components/FeedStatus'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const img = (file: string, w: number) =>
  `/.netlify/images?url=/img/${file}&w=${w}&fm=webp`

function LandingPage() {
  const markets = useMarkets(90_000)
  const coins = markets.data?.coins ?? []
  const leaders = coins.slice(0, 6)

  return (
    <>
      <Ticker coins={coins.slice(0, 14)} />

      {/* Hero: split, left-weighted. The product claim sits against the mark. */}
      <section className="relative overflow-hidden">
        <div className="rule-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-12">
          <div className="animate-rise lg:col-span-7">
            <p className="eyebrow">Crypto portfolio tracker</p>
            <h1 className="display mt-5 text-5xl sm:text-6xl lg:text-7xl">
              Know what you hold,
              <br />
              <span className="text-volt italic">to the cent.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
              Zapbuy values every position against the live market and gives you
              one honest number — what it is worth now, what it cost you, and
              which coin is carrying the rest. No exchange keys. No wallet
              signature. Nothing to sign up for.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 rounded-xl bg-volt px-5 py-3 text-sm font-semibold text-void transition-colors hover:bg-volt-deep"
              >
                <Plus className="size-4" />
                Build your portfolio
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                See a sample portfolio
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-8">
              <FeedStatus
                source={markets.data?.source ?? 'live'}
                asOf={markets.data?.asOf}
              />
            </div>
          </div>

          <div
            className="animate-rise lg:col-span-5"
            style={{ animationDelay: '120ms' }}
          >
            <div className="panel overflow-hidden p-2">
              <img
                src={img('hero-stack.png', 900)}
                alt="Three matte black discs with a filament of light tracing around them"
                className="aspect-[3/2] w-full rounded-xl object-cover"
                width={900}
                height={600}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Live leaders — the product's own data, on the front page. */}
      <section className="mx-auto max-w-[1240px] px-5 pb-16 sm:px-8">
        <div className="panel p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-2xl">Moving right now</h2>
            <Link
              to="/portfolio"
              className="text-xs text-volt hover:underline"
            >
              Track any of these
            </Link>
          </div>

          <ul className="mt-6 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {leaders.length === 0 &&
              Array.from({ length: 6 }, (_, i) => (
                <li key={i} className="h-16 animate-pulse rounded-lg bg-surface-2/50" />
              ))}
            {leaders.map((coin) => (
              <li
                key={coin.id}
                className="flex items-center gap-3 border-b border-line-soft py-3.5 last:border-0"
              >
                <CoinMark src={coin.image} symbol={coin.symbol} size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{coin.name}</p>
                  <p className="tnum text-xs text-ink-3">
                    {formatCompactUsd(coin.marketCap)} cap
                  </p>
                </div>
                <Sparkline
                  values={coin.sparkline}
                  positive={coin.change7d >= 0}
                  width={56}
                  height={24}
                />
                <div className="w-24 text-right">
                  <p className="tnum text-sm">{formatUsd(coin.price)}</p>
                  <Delta value={coin.change24h} className="text-xs" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Full-bleed band: the reconstructed value curve, as a promise. */}
      <section className="relative border-y border-line-soft">
        <img
          src={img('ridge.png', 1800)}
          alt=""
          aria-hidden="true"
          className="h-72 w-full object-cover opacity-70 sm:h-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/70 to-transparent" />
        <div className="absolute inset-0 mx-auto flex max-w-[1240px] flex-col justify-center px-5 sm:px-8">
          <h2 className="display max-w-lg text-3xl sm:text-4xl">
            Your whole week, rebuilt from your own quantities.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-2">
            Zapbuy replays each coin&rsquo;s price history at the amounts you
            actually hold, so the curve on your dashboard is your portfolio —
            not an index someone else picked.
          </p>
        </div>
      </section>

      {/* Two claims, unequal weight. */}
      <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="panel p-8 lg:col-span-3">
            <Scale className="size-5 text-volt" />
            <h3 className="display mt-5 text-2xl">
              Cost basis is the point, not a footnote
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-2">
              Most trackers show you a price. Zapbuy shows you the gap between
              what you paid and what it is worth — per position, weighted by how
              much of your portfolio it actually is. Buy more of something you
              already hold and it tops up the position instead of splitting it in
              two.
            </p>
          </div>

          <div className="panel p-8 lg:col-span-2">
            <KeyRound className="size-5 text-volt" />
            <h3 className="display mt-5 text-2xl">Read-only, always</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              There is no exchange integration to authorise and no wallet to
              connect, because Zapbuy never needs to move anything. You type what
              you hold; it does the arithmetic.
            </p>
          </div>
        </div>

        <div className="panel mt-4 flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div>
            <h3 className="display text-2xl">Start with one position</h3>
            <p className="mt-2 text-sm text-ink-2">
              It takes a quantity and a price. Everything else is derived.
            </p>
          </div>
          <Link
            to="/portfolio"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-volt px-5 py-3 text-sm font-semibold text-void transition-colors hover:bg-volt-deep"
          >
            Open the tracker
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
