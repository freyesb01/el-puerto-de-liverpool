'use client'

import React, { useEffect, useRef, useState, type ReactNode } from 'react'
import { UniversalChartCard } from './universal/universal-chart-card'
import { useUniversalChartSystem } from './universal/universal-chart-layout'
import { ResponsiveContainer } from 'recharts'
import { getChartTypeIcon, UNIVERSAL_VIEW_TYPES, type ViewType } from './chart-types'
import { getUniversalViewColor } from './universal/universal-chart-colors'

export type ChartCardProps = {
  title: string
  subtitle?: string
  contentIcon?: ReactNode | React.ElementType
  icon?: ReactNode | React.ElementType
  viewType?: ViewType | string
  accentColor?: string
  kpiValue?: string | number | null
  onChartTypeChange?: (viewType?: ViewType) => void
  children: ReactNode
  className?: string
  comparisonKey?: boolean
  headerActions?: ReactNode
}

export function ChartCard({
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
  const unified = useUniversalChartSystem()
  const [selectorOpen, setSelectorOpen] = useState(false)
  const selectorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!selectorOpen) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) setSelectorOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectorOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [selectorOpen])

  if (unified) return <UniversalChartCard {...{ title, subtitle, contentIcon, icon, viewType, accentColor, kpiValue, onChartTypeChange, children, className, comparisonKey, headerActions }} />

  const effectiveContentIcon = contentIcon ?? icon

  const renderContentIcon = () => {
    if (React.isValidElement(effectiveContentIcon)) {
      return effectiveContentIcon
    }
    if (
      typeof effectiveContentIcon === 'function' ||
      (typeof effectiveContentIcon === 'object' && effectiveContentIcon !== null)
    ) {
      const Component = effectiveContentIcon as React.ElementType
      return (
        <Component
          size={20}
          style={{ color: accentColor }}
          className="shrink-0"
          aria-hidden="true"
        />
      )
    }
    return null
  }

  const formattedKpi =
    kpiValue !== undefined && kpiValue !== null && kpiValue !== '' ? kpiValue : '—'

  const renderContent = () => {
    if (!React.isValidElement(children)) {
      return children
    }

    // If children is already a ResponsiveContainer or HTML element (like a div)
    if (typeof children.type === 'string') {
      return children
    }

    // Check if it's already ResponsiveContainer
    const componentName =
      (children.type as any)?.displayName || (children.type as any)?.name || ''
    if (componentName === 'ResponsiveContainer') {
      return children
    }

    // Wrap Recharts charts in ResponsiveContainer width="100%" height={300}
    return (
      <ResponsiveContainer width="100%" height={300}>
        {children as any}
      </ResponsiveContainer>
    )
  }

  const normalizedViewType: ViewType =
    viewType === 'bar' || viewType === 'line' || viewType === 'area' || viewType === 'radar'
      ? viewType
      : 'bar'

  const ControlIcon = getChartTypeIcon(normalizedViewType)
  const controlColor = getUniversalViewColor(normalizedViewType)

  return (
    <section
      className={`flex flex-col rounded-none bg-card p-[15px] border border-border w-full ${className}`}
    >
      <header className="mb-[15px] flex items-center justify-between gap-[10px]">
        <div className="flex items-center gap-[10px] min-w-0 flex-1">
          <div
            className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-none bg-secondary text-primary"
            aria-hidden="true"
          >
            {renderContentIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[10px] leading-[15px] font-medium text-[#1D1B20] text-left sm:text-[10px] sm:leading-[17.5px] break-words">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] leading-[12.5px] text-[#49454F] text-left mt-0.5 break-words">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {(onChartTypeChange || headerActions) && (
          <div className="flex shrink-0 items-center gap-[5px]">
            {onChartTypeChange && (
              <div className="relative h-[45px] w-[45px] shrink-0" ref={selectorRef}>
                <button
                  type="button"
                  onClick={() => setSelectorOpen((open) => !open)}
                  aria-label={`Elegir tipo de gráfica de ${title}`}
                  aria-expanded={selectorOpen}
                  aria-haspopup="menu"
                  title={`Tipo actual: ${normalizedViewType}`}
                  className="flex h-[45px] w-[45px] items-center justify-center rounded-none border transition-colors cursor-liverpool-pointer hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ color: controlColor, backgroundColor: `${controlColor}18`, borderColor: `${controlColor}40` }}
                >
                  <ControlIcon size={20} aria-hidden="true" />
                </button>
                {selectorOpen && (
                  <div className="absolute right-0 top-[50px] z-40 flex flex-col gap-[5px]" role="menu" aria-label={`Tipo de gráfica para ${title}`}>
                    {UNIVERSAL_VIEW_TYPES.map((option) => {
                      const OptionIcon = getChartTypeIcon(option)
                      const optionColor = getUniversalViewColor(option)
                      const selected = option === normalizedViewType
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            onChartTypeChange(option)
                            setSelectorOpen(false)
                          }}
                          role="menuitemradio"
                          aria-checked={selected}
                          aria-label={`Cambiar a ${option}`}
                          title={option}
                          className="flex h-[45px] w-[45px] items-center justify-center border rounded-none cursor-liverpool-pointer hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          style={{
                            color: optionColor,
                            backgroundColor: `${optionColor}${selected ? '2B' : '16'}`,
                            borderColor: `${optionColor}40`,
                            boxShadow: selected ? `inset 0 0 0 1px ${optionColor}` : undefined,
                          }}
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

      {/* KPI obligatorio */}
      <div className="flex flex-col gap-[5px] mb-[15px]">
        <div className="flex flex-row items-center gap-[5px]">
          <svg
            width="5"
            height="12.5"
            className="shrink-0"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="5" height="12.5" fill={accentColor} />
          </svg>
          <p
            className="font-mono text-[10px] leading-[30px] font-bold tabular-nums tracking-tight text-left select-text"
            style={{ color: accentColor }}
          >
            {formattedKpi}
          </p>
        </div>
      </div>

      {/* Gráfica estandarizada */}
      <div className="min-h-[280px] flex-1">
        {renderContent()}
      </div>
    </section>
  )
}

export function ChartTooltip({
  active,
  payload,
  label,
  suffix = '',
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
  suffix?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-none border border-border bg-popover px-[10px] py-[5px] text-popover-foreground transition-all duration-300 ease-out origin-bottom animate-in fade-in zoom-in-[0.98]">
      {label && (
        <p className="mb-[5px] text-[10px] leading-[12.5px] font-medium text-[#49454F]">{label}</p>
      )}
      <ul className="flex flex-col gap-[5px]">
        {payload.map((entry, i) => (
          <li key={i} className="flex items-center gap-2 text-[10px] leading-[15px]">
            <span
              className="h-2.5 w-2.5 rounded-none"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-[#49454F]">{entry.name}:</span>
            <span className="font-mono font-bold tabular-nums">
              {new Intl.NumberFormat('es-MX').format(entry.value ?? 0)}
              {suffix}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
