export const REVENUE_CHART_Y_MAX = 60000
export const REVENUE_CHART_HEIGHT = 286
export const REVENUE_Y_AXIS_TICKS = [60000, 45000, 30000, 15000, 0]

export type RevenueAxisConfig = {
  yMax?: number
  ticks?: number[]
  tickLabels?: string[]
  format?: string
}

export function getRevenueChartYMax(axis?: RevenueAxisConfig | null) {
  return axis?.yMax ?? REVENUE_CHART_Y_MAX
}

export function getRevenueAxisTicks(axis?: RevenueAxisConfig | null) {
  return axis?.ticks ?? REVENUE_Y_AXIS_TICKS
}

export function formatRevenueAxisLabel(value: number, axis?: RevenueAxisConfig | null) {
  if (axis?.tickLabels && axis?.ticks) {
    const idx = axis.ticks.indexOf(value)
    if (idx !== -1 && axis.tickLabels[idx]) return axis.tickLabels[idx]
  }
  return `R${Math.round(value / 1000)}k`
}

export function getRevenuePlotHeight(value: number, axis?: RevenueAxisConfig | null) {
  const yMax = getRevenueChartYMax(axis)
  return Math.max(26, (value / yMax) * REVENUE_CHART_HEIGHT)
}

export function buildRevenueLinePoints(
  months: Array<{ month: string; actual: number; target: number }>,
  axis?: RevenueAxisConfig | null,
) {
  const yMax = getRevenueChartYMax(axis)
  return months
    .map((item, index) => {
      const x = months.length <= 1 ? 0 : (index / (months.length - 1)) * 100
      const plottedHeight = Math.max(26, (item.actual / yMax) * REVENUE_CHART_HEIGHT)
      const y = 100 - (Math.min(plottedHeight, REVENUE_CHART_HEIGHT) / REVENUE_CHART_HEIGHT) * 100
      return `${x},${y}`
    })
    .join(' ')
}
