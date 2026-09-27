/**
 * Seven-day price shape for a table row. Deliberately axis-free and unlabelled:
 * the exact numbers live in the adjacent price and change columns, and this
 * only has to communicate the shape of the week.
 */
export function Sparkline({
  values,
  positive,
  width = 104,
  height = 32,
}: {
  values: number[]
  positive: boolean
  width?: number
  height?: number
}) {
  if (values.length < 2) {
    return <div style={{ width, height }} aria-hidden="true" />
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pad = 2
  const usable = height - pad * 2

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width
    const y = pad + usable - ((value - min) / span) * usable
    return [x, y] as const
  })

  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} ${width},${height} 0,${height}`
  const stroke = positive ? 'var(--color-gain)' : 'var(--color-loss)'
  const id = `spark-${positive ? 'up' : 'down'}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
