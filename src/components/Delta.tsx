import { deltaClass, formatPct } from '@/lib/format'

/**
 * A signed change. Direction is carried by the triangle and the sign as well as
 * the colour, so the value stays readable without colour vision.
 */
export function Delta({
  value,
  className = '',
  showGlyph = true,
}: {
  value: number
  className?: string
  showGlyph?: boolean
}) {
  const flat = Math.abs(value) < 0.005
  return (
    <span
      className={`tnum inline-flex items-center gap-1 ${deltaClass(value)} ${className}`}
    >
      {showGlyph && !flat && (
        <svg viewBox="0 0 10 8" className="size-2" fill="currentColor" aria-hidden="true">
          {value > 0 ? <path d="M5 0l5 8H0z" /> : <path d="M5 8L0 0h10z" />}
        </svg>
      )}
      {flat ? '0.00%' : formatPct(value)}
    </span>
  )
}
