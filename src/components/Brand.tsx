/** The Zapbuy mark: a bolt cut out of a solid tile. Used at every size, so the
 *  bolt is drawn on a 24-unit grid and scales without hinting artefacts. */
export function BoltMark({ className = 'size-9' }: { className?: string }) {
  return (
    <span
      className={`${className} grid place-items-center rounded-[10px] bg-volt text-void`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" fill="currentColor">
        <path d="M13.9 2 5 13.4h5.2L9.4 22l9-11.7h-5.3z" />
      </svg>
    </span>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`display text-[1.45rem] leading-none ${className}`}>
      Zapbuy
    </span>
  )
}
