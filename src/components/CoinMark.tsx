import { useState } from 'react'

/** Coin logo, resized at the edge by the Netlify Image CDN. Falls back to a
 *  lettered tile when the provider has no art for a token. */
export function CoinMark({
  src,
  symbol,
  size = 28,
}: {
  src?: string
  symbol: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full border border-line bg-surface-2 text-[10px] font-semibold text-ink-2"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {symbol.slice(0, 3)}
      </span>
    )
  }

  const density = size * 2
  return (
    <img
      src={`/.netlify/images?url=${encodeURIComponent(src)}&w=${density}&h=${density}&fit=cover&fm=webp`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full bg-surface-2"
      style={{ width: size, height: size }}
    />
  )
}
