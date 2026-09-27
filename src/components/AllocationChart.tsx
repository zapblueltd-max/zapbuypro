import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import { tooltipStyle, viz } from '@/lib/charts'
import { formatCompactUsd, formatMoney } from '@/lib/format'
import { useMounted } from '@/lib/useMounted'
import type { AllocationSlice } from '@/lib/portfolio'

/**
 * Portfolio weight by position. The ring carries the proportions; the list
 * beside it is both the legend and the readable table of the same numbers, so
 * identity never rests on colour alone.
 */
export function AllocationChart({
  slices,
  total,
}: {
  slices: AllocationSlice[]
  total: number
}) {
  const mounted = useMounted()

  const data = useMemo(
    () => ({
      labels: slices.map((slice) => slice.label),
      datasets: [
        {
          data: slices.map((slice) => slice.value),
          backgroundColor: slices.map(
            (_, index) => viz.series[index % viz.series.length],
          ),
          // A 2px gap in the surface colour keeps adjacent arcs from reading as one.
          borderColor: viz.surface,
          borderWidth: 2,
          hoverOffset: 6,
          hoverBorderColor: viz.surface,
        },
      ],
    }),
    [slices],
  )

  const options = useMemo<ChartOptions<'doughnut'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            title: (items) => String(items[0]?.label ?? ''),
            label: (item) => {
              const value = Number(item.parsed)
              const share = total > 0 ? (value / total) * 100 : 0
              return `${formatMoney(value)}  ·  ${share.toFixed(1)}%`
            },
          },
        },
      },
    }),
    [total],
  )

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="relative mx-auto size-44 shrink-0">
        {mounted ? (
          <Doughnut data={data} options={options} />
        ) : (
          <div className="size-full animate-pulse rounded-full bg-surface-2/60" />
        )}
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <span className="eyebrow">Held</span>
          <span className="tnum text-lg font-medium text-ink">
            {formatCompactUsd(total)}
          </span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {slices.map((slice, index) => (
          <li key={slice.label} className="flex items-center gap-3 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ background: viz.series[index % viz.series.length] }}
              aria-hidden="true"
            />
            <span className="w-16 shrink-0 font-medium text-ink">
              {slice.label}
            </span>
            <span className="tnum w-14 shrink-0 text-right text-ink-2">
              {slice.weight.toFixed(1)}%
            </span>
            <span className="tnum flex-1 text-right text-ink-2">
              {formatMoney(slice.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
