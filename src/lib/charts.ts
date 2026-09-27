import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import type { Chart, Plugin, TooltipOptions } from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
)

/** Chart-facing design tokens. Mirrors the CSS custom properties in styles.css;
 *  Chart.js draws to a canvas and cannot read them. */
export const viz = {
  surface: '#13161c',
  grid: '#1b202a',
  axis: '#242a35',
  ink: '#f2f4f7',
  ink2: '#9ba3b0',
  ink3: '#6b7280',
  volt: '#d6f25c',
  gain: '#2fb675',
  loss: '#e5484d',
  /** Categorical slots in fixed order — a series keeps its colour regardless of
   *  how many other series are on screen. */
  series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300'],
} as const

/** Shared tooltip chrome: a panel that matches the surrounding UI, with values
 *  set in mono so digits line up. */
export const tooltipStyle: Partial<TooltipOptions> = {
  backgroundColor: '#20252f',
  borderColor: '#2f3745',
  borderWidth: 1,
  cornerRadius: 10,
  padding: 12,
  displayColors: false,
  titleColor: viz.ink3,
  titleFont: { family: '"Schibsted Grotesk", sans-serif', size: 11, weight: 500 },
  titleMarginBottom: 6,
  bodyColor: viz.ink,
  bodyFont: { family: '"IBM Plex Mono", monospace', size: 13, weight: 500 },
}

/**
 * Draws the vertical crosshair that a time series needs for reading a single
 * point out of a continuous line. Chart.js ships the tooltip but not the rule.
 */
export const crosshair: Plugin<'line'> = {
  id: 'zapbuyCrosshair',
  afterDatasetsDraw(chart: Chart<'line'>) {
    const active = chart.getActiveElements()
    if (active.length === 0) return

    const { x } = active[0].element
    const { top, bottom } = chart.chartArea
    const ctx = chart.ctx

    ctx.save()
    ctx.beginPath()
    ctx.setLineDash([3, 3])
    ctx.lineWidth = 1
    ctx.strokeStyle = '#3a4353'
    ctx.moveTo(x, top)
    ctx.lineTo(x, bottom)
    ctx.stroke()
    ctx.restore()
  },
}
