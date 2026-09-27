import { Link } from '@tanstack/react-router'
import { BoltMark } from './Brand'

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-void">
      <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <BoltMark className="size-7" />
              <span className="display text-xl">Zapbuy</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-3">
              A portfolio tracker for people who want one honest number, not a
              trading floor. Read-only by design — Zapbuy never asks for an
              exchange key or a wallet signature.
            </p>
          </div>

          <nav className="flex gap-10 text-sm">
            <div className="flex flex-col gap-2">
              <span className="eyebrow">Product</span>
              <Link to="/portfolio" className="text-ink-2 hover:text-ink">
                Portfolio
              </Link>
            </div>
          </nav>
        </div>

        <p className="mt-10 border-t border-line-soft pt-6 text-xs leading-relaxed text-ink-3">
          Prices are supplied by CoinGecko and cached for up to a minute, so
          figures may lag the market. Zapbuy shows you your own numbers; it is not
          investment advice and does not execute trades.
        </p>
      </div>
    </footer>
  )
}
