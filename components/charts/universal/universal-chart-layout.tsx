'use client'

import React, { createContext, useContext } from 'react'
import styles from './universal-chart.module.css'

// Reference: the existing lower ChartCard uses a 300 px plot and 15 px padding.
export const UNIVERSAL_CHART_LAYOUT = {
  height: 300,
  padding: 15,
  gap: 5,
  margin: { top: 20, right: 30, bottom: 20, left: 20 },
  polarMargin: { top: 20, right: 40, bottom: 20, left: 40 },
  outerRadius: '65%',
  /** Normal x-axis height (no rotation needed). Target: ~200 px useful plot area. */
  xAxisHeight: 60,
  /** Rotated x-axis height when labels must rotate to fit (-55°). */
  rotatedXAxisHeight: 85,
  /** @deprecated Use rotatedXAxisHeight. Kept for backward compatibility. */
  compactXAxisHeight: 85,
  /**
   * Slot-width threshold below which month labels are abbreviated (e.g. "Enero" → "Ene").
   * Above this value the full label is rendered; below it the short form is used.
   */
  compactLabelThreshold: 65,
  /**
   * Slot-width threshold below which labels are rotated -55°.
   * Smaller than compactLabelThreshold so abbreviation is tried first.
   */
  rotateLabelThreshold: 42,
  yAxisWidth: 60,
  labelSize: 10,
  secondaryLabelSize: 9,
  labelLineHeight: 15,
  tooltipWidth: 280,
} as const

const ChartSystemContext = createContext(false)
export const useUniversalChartSystem = () => useContext(ChartSystemContext)

export const UniversalChartMetricsContext = createContext({ width: 0, count: 0 })
export const useUniversalChartMetrics = () => useContext(UniversalChartMetricsContext)

export function UniversalChartScope({ children }: { children: React.ReactNode }) {
  return (
    <ChartSystemContext.Provider value={true}>
      {children}
    </ChartSystemContext.Provider>
  )
}

export function UniversalChartDashboard({ children }: { children: React.ReactNode }) {
  return (
    <UniversalChartScope>
      <div className={styles.dashboard} data-chart-dashboard>
        <div className={styles.grid}>{children}</div>
      </div>
    </UniversalChartScope>
  )
}

// The same KPI component is also used by Periodos, which keeps its existing layout.
export function UniversalKpiGroup({ children }: { children: React.ReactNode }) {
  const unified = useUniversalChartSystem()
  return (
    <section aria-label="Indicadores clave" className={unified ? styles.kpiGroup : 'relative z-30 grid grid-cols-1 gap-[5px] sm:grid-cols-2 xl:grid-cols-4 items-start'}>
      {children}
    </section>
  )
}
