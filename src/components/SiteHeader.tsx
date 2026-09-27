import { Link } from '@tanstack/react-router'
import { BoltMark, Wordmark } from './Brand'

const links = [{ to: '/portfolio', label: 'Portfolio' }] as const

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-3 px-5 sm:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <BoltMark className="size-8" />
          <Wordmark />
        </Link>

        <nav className="ml-3 flex items-center gap-1 sm:ml-8">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              activeProps={{ className: 'bg-surface-2 text-ink' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          to="/portfolio"
          className="ml-auto hidden rounded-lg bg-volt px-4 py-2 text-sm font-semibold text-void transition-colors hover:bg-volt-deep sm:block"
        >
          Open tracker
        </Link>
      </div>
    </header>
  )
}
