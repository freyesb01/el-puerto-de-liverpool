'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { ResponsiveContainer } from 'recharts'
import type { ChartCardProps } from '../chart-card'
import { getChartTypeIcon, UNIVERSAL_VIEW_TYPES, type ViewType } from '../chart-types'
import { UNIVERSAL_CHART_LAYOUT as layout, UniversalChartMetricsContext } from './universal-chart-layout'
import { UniversalChartLegend, type UniversalLegendItem } from './universal-chart-legend'
import styles from './universal-chart.module.css'
import { UNIVERSAL_TARGET_SERIES } from './universal-chart-config'
import { UNIVERSAL_AXIS_TICK } from './universal-chart-axis'
import { getUniversalSeriesColor } from './universal-chart-colors'

type SemanticSeries = {
  dataKey: string
  name?: string
  color?: string
}

type PlotProps = {
  data?: unknown[]
  target?: SemanticSeries
  actual?: SemanticSeries
  series?: SemanticSeries[]
  lines?: UniversalLegendItem[]
  bars?: UniversalLegendItem[]
  areas?: UniversalLegendItem[]
  xAxis?: React.ReactElement<Record<string, unknown>>
  yAxis?: React.ReactElement<Record<string, unknown>>
  polarRadiusAxis?: React.ReactElement<Record<string, unknown>>
  tooltip?: React.ReactElement<Record<string, unknown>>
  margin?: object
  outerRadius?: string | number
  xAxisHeight?: number
  polarMargin?: object
}

const VIEW_LABELS: Record<ViewType, string> = {
  bar: 'Barras',
  line: 'Líneas',
  area: 'Área',
  radar: 'Radar',
}

function uniqueLegend(items: UniversalLegendItem[]) {
  return items.filter(
    (item, index) => items.findIndex((candidate) => candidate.dataKey === item.dataKey) === index,
  )
}

export function UniversalChartCard({
  title,
  subtitle,
  contentIcon,
  icon,
  viewType = 'bar',
  accentColor = '#833177',
  kpiValue,
  onChartTypeChange,
  children,
  className = '',
  comparisonKey,
  headerActions,
}: ChartCardProps) {
  const id = useId()
  const [width, setWidth] = useState(0)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const selectorRef = useRef<HTMLDivElement | null>(null)
  const normalizedViewType: ViewType =
    viewType === 'bar' || viewType === 'line' || viewType === 'area' || viewType === 'radar'
      ? viewType
      : 'bar'

  useEffect(() => {
    if (!selectorOpen) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) {
        setSelectorOpen(false)
      }
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectorOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [selectorOpen])

  const chart = React.isValidElement<PlotProps>(children) ? children : null
  const props = chart?.props
  const count = props?.data?.length ?? 0
  const slot =
    width > 0
      ? (width - layout.yAxisWidth - layout.margin.left - layout.margin.right) /
        Math.max(count, 1)
      : Infinity
  const shouldRotate = slot < layout.rotateLabelThreshold
  const xHeight = shouldRotate ? layout.rotatedXAxisHeight : layout.xAxisHeight
  const ControlIcon = getChartTypeIcon(normalizedViewType)
  const content = contentIcon ?? icon
  const Icon = content as React.ElementType

  const semanticLegend: UniversalLegendItem[] = []
  if (props?.target) {
    semanticLegend.push({
      dataKey: props.target.dataKey,
      name: props.target.name,
      color: getUniversalSeriesColor(props.target, accentColor),
      opacity: UNIVERSAL_TARGET_SERIES.strokeOpacity,
    })
  }
  if (props?.series?.length) {
    semanticLegend.push(
      ...props.series.map((item) => ({
        dataKey: item.dataKey,
        name: item.name,
        color: getUniversalSeriesColor(item, accentColor),
        opacity: 1,
      })),
    )
  } else if (props?.actual) {
    semanticLegend.push({
      dataKey: props.actual.dataKey,
      name: props.actual.name,
      color: getUniversalSeriesColor(props.actual, accentColor),
      opacity: 1,
    })
  }

  const lowLevelLegend = [
    ...(props?.lines ?? []),
    ...(props?.bars ?? []),
    ...(props?.areas ?? []),
  ]
  const items = uniqueLegend(semanticLegend.length > 0 ? semanticLegend : lowLevelLegend)

  const clone = (
    element: React.ReactElement<Record<string, unknown>> | undefined,
    extra: Record<string, unknown>,
  ) => (element ? React.cloneElement(element, extra) : element)

  const plot =
    chart &&
    React.cloneElement(chart, {
      margin: normalizedViewType === 'radar' ? props?.margin : layout.margin,
      polarMargin: layout.polarMargin,
      outerRadius: layout.outerRadius,
      xAxisHeight: xHeight,
      xAxis: clone(props?.xAxis, { height: xHeight }),
      yAxis: clone(props?.yAxis, {
        width: layout.yAxisWidth,
        tick: UNIVERSAL_AXIS_TICK,
        tickMargin: 8,
        tickLine: false,
        axisLine: false,
      }),
      polarRadiusAxis: clone(props?.polarRadiusAxis, {
        tick: UNIVERSAL_AXIS_TICK,
      }),
    })

  const selectView = (nextViewType: ViewType) => {
    if (nextViewType !== normalizedViewType) {
      onChartTypeChange?.(nextViewType)
    }
    setSelectorOpen(false)
  }

  return (
    <section
      className={`${styles.card} ${className}`}
      aria-labelledby={id}
      data-universal-chart-card
      data-chart-type={normalizedViewType}
    >
      <header className={styles.header}>
        <span className={styles.icon} style={{ color: accentColor }} aria-hidden="true">
          {React.isValidElement(content) ? content : content ? <Icon size={20} /> : null}
        </span>
        <div className={styles.heading}>
          <h2 id={id} className={styles.title}>
            {title}
          </h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {(onChartTypeChange || headerActions) && (
          <div className={styles.headerControls}>
            {onChartTypeChange && (
              <div className={styles.controlGroup} ref={selectorRef}>
                <button
                  type="button"
                  onClick={() => setSelectorOpen((open) => !open)}
                  className={styles.control}
                  style={{
                    color: accentColor,
                    backgroundColor: `color-mix(in srgb, ${accentColor} 9.4%, #ffffff)`,
                  }}
                  aria-label={`Elegir tipo de gráfica de ${title}`}
                  aria-expanded={selectorOpen}
                  aria-haspopup="menu"
                  title={`Tipo actual: ${VIEW_LABELS[normalizedViewType]}`}
                >
                  <ControlIcon size={20} aria-hidden="true" />
                </button>

                {selectorOpen && (
                  <div className={styles.viewSelector} role="menu" aria-label={`Tipo de gráfica para ${title}`}>
                    {UNIVERSAL_VIEW_TYPES.map((option) => {
                      const OptionIcon = getChartTypeIcon(option)
                      const optionColor = accentColor
                      const selected = option === normalizedViewType
                      return (
                        <button
                          key={option}
                          type="button"
                          className={styles.viewSelectorButton}
                          style={{
                            color: optionColor,
                            backgroundColor: selected ? `color-mix(in srgb, ${optionColor} 14.1%, #ffffff)` : `color-mix(in srgb, ${optionColor} 7.1%, #ffffff)`,
                          }}
                          onClick={() => selectView(option)}
                          role="menuitemradio"
                          aria-checked={selected}
                          aria-label={`Ver como ${VIEW_LABELS[option]}`}
                          title={VIEW_LABELS[option]}
                        >
                          <OptionIcon size={20} aria-hidden="true" />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            {headerActions}
          </div>
        )}
      </header>

      <div className={styles.kpi} style={{ color: accentColor }}>
        <span className={styles.kpiMarker} aria-hidden="true" />
        <p className={styles.value} data-chart-value>
          {kpiValue !== undefined && kpiValue !== null && kpiValue !== '' ? kpiValue : '-'}
        </p>
      </div>

      <UniversalChartMetricsContext.Provider value={{ width, count }}>
        <div className={styles.plot} style={{ height: layout.height }}>
          {count > 0 && plot ? (
            <ResponsiveContainer
              width="100%"
              height={layout.height}
              minWidth={0}
              onResize={(next) => setWidth(next)}
            >
              {plot}
            </ResponsiveContainer>
          ) : (
            <div className={styles.empty}>Sin datos disponibles</div>
          )}
        </div>
        <UniversalChartLegend items={items} fallbackColor={accentColor} comparisonKey={comparisonKey} />
      </UniversalChartMetricsContext.Provider>
    </section>
  )
}
