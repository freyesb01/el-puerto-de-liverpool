"use client"

import React from 'react'
import { Activity, AlertTriangle, LayoutGrid, Trophy } from "lucide-react"

import type { SalesLead } from "@/lib/types"

import { getManagerIdentityKey } from '@/lib/person-names'
import {
  getManagerRanking,
  type ManagerRankingItem,
} from '@/components/dashboard/vista-general/helpers/manager-ranking'
import {
  getUniversalDatumColor,
  getUniversalPerformanceBand,
  getUniversalSolidColor,
  UNIVERSAL_PERFORMANCE_SEMANTICS,
  UniversalChartViewSelector,
  useUniversalChartView,
} from '@/components/charts/universal'
import { ManagerEffectivenessChart } from './manager-effectiveness-chart'
import { ManagerTopCardChart } from './manager-top-card-chart'

type FilterOption = 'all' | 'high' | 'medium' | 'low'

const FILTER_BUTTONS: Array<{
  value: FilterOption
  label: string
  color: string
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}> = [
  { value: 'all', label: 'Todos', color: '#833177', Icon: LayoutGrid },
  { value: 'high', label: UNIVERSAL_PERFORMANCE_SEMANTICS.high.filterLabel, color: UNIVERSAL_PERFORMANCE_SEMANTICS.high.color, Icon: Trophy },
  { value: 'medium', label: UNIVERSAL_PERFORMANCE_SEMANTICS.medium.filterLabel, color: UNIVERSAL_PERFORMANCE_SEMANTICS.medium.color, Icon: Activity },
  { value: 'low', label: UNIVERSAL_PERFORMANCE_SEMANTICS.low.filterLabel, color: UNIVERSAL_PERFORMANCE_SEMANTICS.low.color, Icon: AlertTriangle },
]

type ManagerChartRow = ManagerRankingItem & {
  tarjetas: number
  lead?: SalesLead
  rawReal: number
  rawPlan: number
  color: string
}

function getInitials(name: string): string {
  const normalized = name.trim()
  if (!normalized) return '--'
  return normalized.slice(0, 2).toLocaleUpperCase('es-MX')
}

function PerformanceFilterSelector({
  value,
  onChange,
}: {
  value: FilterOption
  onChange: (value: FilterOption) => void
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement | null>(null)
  const current = FILTER_BUTTONS.find((option) => option.value === value) ?? FILTER_BUTTONS[0]
  const CurrentIcon = current.Icon

  React.useEffect(() => {
    if (!open) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div className="relative z-10" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-none transition-colors focus-visible:outline-none cursor-liverpool-pointer"
        style={{ color: current.color, backgroundColor: `${current.color}18` }}
        aria-label={`Filtro actual: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        title={`Filtro actual: ${current.label}`}
      >
        <CurrentIcon className="w-5 h-5" aria-hidden={true} />
      </button>

      {open && (
        <div className="absolute top-[50px] right-0 flex flex-col gap-[5px]" role="menu" aria-label="Filtros de efectividad">
          {FILTER_BUTTONS.map(({ value: option, label, color, Icon }) => {
            const isActive = value === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                }}
                className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-none transition-colors focus-visible:outline-none cursor-liverpool-pointer"
                style={{
                  color,
                  backgroundColor: `${color}${isActive ? '24' : '12'}`,
                }}
                role="menuitemradio"
                aria-checked={isActive}
                aria-label={label}
                title={label}
              >
                <Icon className="w-5 h-5" aria-hidden={true} />
                <span className="sr-only">{label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ManagerTopCard({
  item,
  yAxisMax,
  onSelect,
}: {
  item: ManagerChartRow
  yAxisMax: number
  onSelect?: (lead: SalesLead) => void
}) {
  // Cada tarjeta controla su propia vista. No comparte estado con sus hermanas
  // ni con la gráfica principal inferior.
  const { viewType, handleChartTypeChange } = useUniversalChartView()
  const band = item.isPending
    ? 'pending'
    : getUniversalPerformanceBand(item.avance, 100)
  const semantic = UNIVERSAL_PERFORMANCE_SEMANTICS[band]
  const color = semantic.color
  const percentageText = item.isPending ? '—' : `${item.avance.toFixed(1)}%`

  const canNavigate = Boolean(item.lead && onSelect)

  return (
    <article
      className={`flex flex-col gap-[5px] rounded-none bg-card p-[15px] border border-border ${canNavigate ? 'cursor-liverpool-pointer' : ''}`}
      role={canNavigate ? 'button' : undefined}
      tabIndex={canNavigate ? 0 : undefined}
      onClick={canNavigate ? () => onSelect?.(item.lead!) : undefined}
      onKeyDown={canNavigate ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.(item.lead!)
        }
      } : undefined}
      aria-label={canNavigate ? `Abrir equipo de ${item.name}` : undefined}
    >
      <div className="flex items-start justify-between gap-[10px]">
        <div className="min-w-0 flex flex-col gap-[5px]">
          <span
            className="text-[10px] leading-[15px] font-medium text-left sm:text-[10px] sm:leading-[17.5px] break-words"
            style={{ color }}
          >
            {item.name}
          </span>
          <span
            className="flex items-center gap-[5px] text-[10px] leading-[12.5px] font-medium"
            style={{ color }}
          >
            <span
              className="w-[7.5px] h-[7.5px] shrink-0 rounded-none"
              style={{ backgroundColor: color }}
              aria-hidden={true}
            />
            {semantic.filterLabel}
          </span>
        </div>

        <div className="flex shrink-0 items-start gap-[5px]" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
          <UniversalChartViewSelector
            viewType={viewType}
            accentColor={color}
            label={`Top 3: ${item.name}`}
            onChange={handleChartTypeChange}
          />
          <span
            className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-none transition-colors font-bold text-[10px] leading-[17.5px]"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {getInitials(item.name)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-[5px]">
        <div className="flex flex-row items-center gap-[5px]">
          <svg width="5" height="12.5" className="shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden={true}>
            <rect width="5" height="12.5" fill={color} />
          </svg>
          <p
            className="font-mono text-[10px] leading-[30px] font-bold tabular-nums tracking-tight text-left"
            style={{ color }}
          >
            {percentageText}
          </p>
        </div>
        <p className="text-[10px] leading-[12.5px] text-[#49454F] text-left">
          {new Intl.NumberFormat('es-MX').format(item.tarjetas)} tarjetas
        </p>
      </div>

      <ManagerTopCardChart
        item={item}
        viewType={viewType}
        yAxisMax={yAxisMax}
      />
    </article>
  )
}

export function SalesLeadsTable({
  data,
  rankingNames,
  rankingPercentages,
  onSelect,
}: {
  data: SalesLead[]
  rankingNames?: string[]
  rankingPercentages?: (string | number)[]
  onSelect?: (lead: SalesLead) => void
}) {
  const [filterState, setFilterState] = React.useState<FilterOption>('all')
  const bottomChartView = useUniversalChartView()

  const salesByManager = new Map(
    data
      .map((lead) => [getManagerIdentityKey(lead.jefe), lead] as const)
      .filter(([key]) => Boolean(key)),
  )

  // Misma fuente y mismo adaptador que "Ranking de jefes de ventas" en Vista General.
  const officialRanking = getManagerRanking(rankingNames, rankingPercentages)
  const managerRanking = officialRanking.length > 0
    ? officialRanking
    : getManagerRanking(data)

  const chartRows: ManagerChartRow[] = managerRanking.map((item) => {
    const lead = salesByManager.get(item.managerKey)
    const color = getUniversalDatumColor(
      item,
      getUniversalSolidColor(item.avance, 100),
    )

    return {
      ...item,
      plan: 100,
      real: item.avance,
      rawPlan: 100,
      rawReal: item.avance,
      tarjetas: lead?.real ?? 0,
      lead,
      color,
    }
  })

  const top3 = chartRows.slice(0, 3)
  const top3MaxEffectiveness = Math.max(100, ...top3.map((item) => item.avance))
  const top3YAxisMax = Math.max(180, Math.ceil(top3MaxEffectiveness / 45) * 45)

  const filteredData = chartRows.filter((item) => {
    if (filterState === 'all') return true

    const band = item.isPending
      ? 'pending'
      : getUniversalPerformanceBand(item.avance, 100)

    return band === filterState
  })


  return (
    <>
      <div className="col-span-full grid grid-cols-1 gap-[5px] md:grid-cols-3">
        {top3.map((item) => (
          <ManagerTopCard
            key={item.managerKey}
            item={item}
            yAxisMax={top3YAxisMax}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="col-span-full">
        <ManagerEffectivenessChart
          data={filteredData}
          viewType={bottomChartView.viewType}
          onChartTypeChange={bottomChartView.handleChartTypeChange}
          headerActions={
            <PerformanceFilterSelector value={filterState} onChange={setFilterState} />
          }
          onSelectItem={(item) => {
            const lead = salesByManager.get(item.managerKey)
            if (lead) onSelect?.(lead)
          }}
        />
      </div>
    </>
  )
}
