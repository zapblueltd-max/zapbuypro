import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import type { ChartOptions, ScriptableContext } from 'chart.js'
import { crosshair, tooltipStyle, viz } from '@/lib/charts'
import { formatCompactUsd, formatMoney } from '@/lib/format'
import { useMounted } from '@/lib/useMounted'

/** Snapshots are three hours apart, so 56 points cover a week. */
const HOURS_PER_POINT = 3

function labelFor(index: number, total: number): string {
  const hoursAgo = (total - 1 - index) * HOURS_PER_POINT
  const at = new Date(Date.now() - hoursAgo * 3_600_000)
  return at.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
  })
}

/**
 * Portfolio value across the trailing week. One series, so no legend box — the
 * panel heading names it. A crosshair and tooltip make individual points
 * readable, which a bare line cannot do.
 */
export function PerformanceChart({ series }: { series: number[] }) {
  const mounted = useMounted()

  const labels = useMemo(
    () => series.map((_, index) => labelFor(index, series.length)),
    [series],
  )

  const options = useMemo<ChartOptions<'line'>>(() => {
    const rising = series.length > 1 && series[series.length - 1] >= series[0]
    const accent = rising ? viz.volt : viz.loss
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle,
          callbacks: {
            label: (item) => formatMoney(item.parsed.y),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: viz.axis },
          ticks: {
            color: viz.ink3,
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 6,
            font: { family: '"Schibsted Grotesk", sans-serif', size: 11 },
          },
        },
        y: {
          position: 'right',
          grid: { color: viz.grid },
          border: { display: false },
          ticks: {
            color: viz.ink3,
            maxTicksLimit: 5,
            padding: 8,
            callback: (value) => formatCompactUsd(Number(value)),
            font: { family: '"IBM Plex Mono", monospace', size: 11 },
          },
        },
      },
      elements: {
        line: { borderColor: accent, borderWidth: 2, tension: 0.25 },
        point: {
          radius: 0,
          hitRadius: 14,
          hoverRadius: 4.5,
          hoverBorderWidth: 2,
          hoverBorderColor: viz.surface,
          hoverBackgroundColor: accent,
        },
      },
    }
  }, [series])

  const data = useMemo(() => {
    const rising = series.length > 1 && series[series.length - 1] >= series[0]
    const accent = rising ? viz.volt : viz.loss
    return {
      labels,
      datasets: [
        {
          label: 'Portfolio value',
          data: series,
          fill: true,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const { ctx, chartArea } = context.chart
            if (!chartArea) return 'transparent'
            const gradient = ctx.createLinearGradient(
              0,
              chartArea.top,
              0,
              chartArea.bottom,
            )
            gradient.addColorStop(0, `${accent}33`)
            gradient.addColorStop(1, `${accent}00`)
            return gradient
          },
        },
      ],
    }
  }, [labels, series])

  if (!mounted) {
    return <div className="h-64 animate-pulse rounded-xl bg-surface-2/60" />
  }

  return (
    <div className="h-64">
      <Line data={data} options={options} plugins={[crosshair]} />
    </div>
  )
}
