'use client'

import React from 'react'
import { Activity, AlertTriangle, LayoutGrid, Target, Trophy } from 'lucide-react'

import type { TeamMember } from '@/lib/types'
import { ChartCard } from '@/components/charts/chart-card'
import {
  getUniversalPerformanceBand,
  getUniversalSolidColor,
  UNIVERSAL_PERFORMANCE_SEMANTICS,
  UniversalAreaView,
  UniversalBarView,
  UniversalChartScope,
  UniversalChartViewSelector,
  UniversalLineView,
  UniversalRadarView,
  UniversalTooltipSurface,
  useUniversalChartView,
} from '@/components/charts/universal'
import {
  CollaboratorTopCardChart,
  type CollaboratorChartRow,
} from './collaborator-top-card-chart'

type FilterOption = 'all' | 'high' | 'medium' | 'low' | 'pending'

const FILTER_BUTTONS: Array<{
  value: Exclude<FilterOption, 'pending'>
  label: string
  color: string
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}> = [
  { value: 'all', label: 'Todos', color: '#833177', Icon: LayoutGrid },
  { value: 'high', label: UNIVERSAL_PERFORMANCE_SEMANTICS.high.filterLabel, color: UNIVERSAL_PERFORMANCE_SEMANTICS.high.color, Icon: Trophy },
  { value: 'medium', label: UNIVERSAL_PERFORMANCE_SEMANTICS.medium.filterLabel, color: UNIVERSAL_PERFORMANCE_SEMANTICS.medium.color, Icon: Activity },
  { value: 'low', label: UNIVERSAL_PERFORMANCE_SEMANTICS.low.filterLabel, color: UNIVERSAL_PERFORMANCE_SEMANTICS.low.color, Icon: AlertTriangle },
]

function formatPercent(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '--'
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('es-MX')
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toLocaleUpperCase('es-MX')
}

function toChartRow(member: TeamMember): CollaboratorChartRow {
  const aprobadas = Number(member.total || 0)
  const declinadas = Number(member.declinadas || 0)
  const ingresadas = Number(member.ingresadas ?? (aprobadas + declinadas))
  const isPending = ingresadas <= 0
  const approvalRate = isPending ? 0 : (aprobadas / ingresadas) * 100
  const color = getUniversalSolidColor(isPending ? null : approvalRate, 100)

  return {
    employeeKey: member.numeroPersonal || member.nombre,
    numeroPersonal: member.numeroPersonal,
    name: member.nombre,
    seccion: member.seccion,
    aprobadas,
    declinadas,
    ingresadas,
    approvalRate,
    porcentajeStr: isPending ? '-' : formatPercent(approvalRate),
    isPending,
    color,
  }
}

function CollaboratorTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload as CollaboratorChartRow | undefined
  if (!item) return null

  return (
    <UniversalTooltipSurface accentColor={item.color}>
      <div className="flex flex-col gap-[7.5px]">
        <div>
          <p className="text-[10px] font-medium" style={{ color: item.color }}>{item.name}</p>
          <p className="text-[10px] text-[#49454F]">{item.seccion || 'Sin sección'}</p>
          {item.numeroPersonal && (
            <p className="text-[10px] text-[#49454F]">N. Personal: {item.numeroPersonal}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-[15px]">
          <span>Aprobadas</span>
          <span className="font-mono tabular-nums">{item.aprobadas}</span>
        </div>
        <div className="flex items-center justify-between gap-[15px]">
          <span>Declinadas</span>
          <span className="font-mono tabular-nums">{item.declinadas}</span>
        </div>
        <div className="flex items-center justify-between gap-[15px]">
          <span>Ingresadas</span>
          <span className="font-mono tabular-nums">{item.ingresadas}</span>
        </div>
        <div className="flex items-center justify-between gap-[15px] border-t border-border pt-[7.5px]">
          <span>Tasa de aprobación</span>
          <span className="font-mono tabular-nums" style={{ color: item.color }}>
            {item.porcentajeStr}
          </span>
        </div>
      </div>
    </UniversalTooltipSurface>
  )
}

function PerformanceFilterSelector({
  value,
  onChange,
}: {
  value: Exclude<FilterOption, 'pending'>
  onChange: (value: Exclude<FilterOption, 'pending'>) => void
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement | null>(null)
  const current = FILTER_BUTTONS.find((option) => option.value === value) ?? FILTER_BUTTONS[0]
  const CurrentIcon = current.Icon

  React.useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  return (
    <div className="relative z-10" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-none transition-colors focus-visible:outline-none cursor-liverpool-pointer"
        style={{
          color: current.color,
          backgroundColor: `color-mix(in srgb, ${current.color} 9.4%, #ffffff)`,
        }}
        aria-label={`Filtro actual: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        title={`Filtro actual: ${current.label}`}
      >
        <CurrentIcon className="h-5 w-5" aria-hidden={true} />
      </button>

      {open && (
        <div className="absolute right-0 top-[50px] flex flex-col gap-[5px]" role="menu" aria-label="Filtros de aprobación">
          {FILTER_BUTTONS.map(({ value: option, label, color, Icon }) => {
            const active = value === option
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
                  backgroundColor: active
                    ? `color-mix(in srgb, ${color} 14.1%, #ffffff)`
                    : `color-mix(in srgb, ${color} 7.1%, #ffffff)`,
                }}
                role="menuitemradio"
                aria-checked={active}
                aria-label={label}
                title={label}
              >
                <Icon className="h-5 w-5" aria-hidden={true} />
                <span className="sr-only">{label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CollaboratorTopCard({ item }: { item: CollaboratorChartRow }) {
  const { viewType, handleChartTypeChange } = useUniversalChartView()
  const band = item.isPending
    ? 'pending'
    : getUniversalPerformanceBand(item.approvalRate, 100)
  const semantic = UNIVERSAL_PERFORMANCE_SEMANTICS[band]
  const color = semantic.color

  return (
    <article className="flex flex-col gap-[5px] rounded-none bg-card p-[15px] border border-border">
      <div className="flex items-start justify-between gap-[10px]">
        <div className="min-w-0 flex flex-col gap-[5px]">
          <span
            className="break-words text-left text-[10px] font-medium leading-[15px] sm:leading-[17.5px]"
            style={{ color }}
          >
            {item.name}
          </span>
          <span className="flex items-center gap-[5px] text-[10px] font-medium leading-[12.5px]" style={{ color }}>
            <span className="h-[7.5px] w-[7.5px] shrink-0" style={{ backgroundColor: color }} aria-hidden={true} />
            {item.isPending ? 'Sin solicitudes' : semantic.filterLabel}
          </span>
        </div>

        <div className="flex shrink-0 items-start gap-[5px]">
          <UniversalChartViewSelector
            viewType={viewType}
            accentColor={color}
            label={`Top 3 colaborador: ${item.name}`}
            onChange={handleChartTypeChange}
          />
          <span
            className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-none font-bold text-[10px] leading-[17.5px]"
            style={{
              color,
              backgroundColor: `color-mix(in srgb, ${color} 8.2%, #ffffff)`,
            }}
          >
            {getInitials(item.name)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-[5px]">
        <div className="flex items-center gap-[5px]">
          <svg width="5" height="12.5" className="shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden={true}>
            <rect width="5" height="12.5" fill={color} />
          </svg>
          <p className="font-mono text-[10px] font-bold leading-[30px] tabular-nums tracking-tight" style={{ color }}>
            {item.porcentajeStr}
          </p>
        </div>
        <p className="text-[10px] leading-[12.5px] text-[#49454F]">
          {new Intl.NumberFormat('es-MX').format(item.aprobadas)} aprobadas · {new Intl.NumberFormat('es-MX').format(item.ingresadas)} ingresadas
        </p>
      </div>

      <CollaboratorTopCardChart item={item} viewType={viewType} />
    </article>
  )
}

export function CollaboratorPerformanceView({
  members,
  managerName,
  rosterLabel,
}: {
  members: TeamMember[]
  managerName: string
  rosterLabel: string
}) {
  const [filterState, setFilterState] = React.useState<Exclude<FilterOption, 'pending'>>('all')
  const chartView = useUniversalChartView()

  const rows = React.useMemo(() => {
    return members
      .map(toChartRow)
      .sort((a, b) => {
        if (a.isPending !== b.isPending) return a.isPending ? 1 : -1
        if (b.approvalRate !== a.approvalRate) return b.approvalRate - a.approvalRate
        return b.aprobadas - a.aprobadas
      })
  }, [members])

  const top3 = rows.filter((item) => !item.isPending).slice(0, 3)
  const filteredRows = rows.filter((item) => {
    if (filterState === 'all') return true
    if (item.isPending) return false
    return getUniversalPerformanceBand(item.approvalRate, 100) === filterState
  })

  const evaluated = filteredRows.filter((item) => !item.isPending)
  const weightedIngresadas = evaluated.reduce((sum, item) => sum + item.ingresadas, 0)
  const weightedAprobadas = evaluated.reduce((sum, item) => sum + item.aprobadas, 0)
  const overallRate = weightedIngresadas > 0 ? (weightedAprobadas / weightedIngresadas) * 100 : 0
  const accentColor = getUniversalSolidColor(weightedIngresadas > 0 ? overallRate : null, 100)
  const kpiValue = weightedIngresadas > 0 ? formatPercent(overallRate) : '-'

  const baseProps = {
    data: filteredRows,
    categoryKey: 'name',
    actual: {
      dataKey: 'approvalRate',
      name: 'Aprobación (%)',
    },
    valueFormatter: formatPercent,
    colorResolver: (actual: number) => getUniversalSolidColor(actual, 100),
    accentColor,
    tooltipContent: <CollaboratorTooltip />,
    secondaryValueAccessor: (item: CollaboratorChartRow) => item.porcentajeStr,
    secondaryColorAccessor: (item: CollaboratorChartRow) => item.color,
  }

  const chart = (() => {
    if (chartView.viewType === 'line') {
      return (
        <UniversalLineView
          {...baseProps}
          yAxisDomain={[0, 100]}
          yAxisTickFormatter={(value) => `${value}%`}
        />
      )
    }

    if (chartView.viewType === 'area') {
      return (
        <UniversalAreaView
          {...baseProps}
          yAxisDomain={[0, 100]}
          yAxisTickFormatter={(value) => `${value}%`}
        />
      )
    }

    if (chartView.viewType === 'radar') {
      return (
        <UniversalRadarView
          {...baseProps}
          polarRadiusAxisDomain={[0, 100]}
          polarRadiusAxisTickFormatter={(value) => `${value}%`}
        />
      )
    }

    return (
      <UniversalBarView
        {...baseProps}
        yAxisDomain={[0, 100]}
        yAxisTickFormatter={(value) => `${value}%`}
      />
    )
  })()

  return (
    <div className="grid grid-cols-1 gap-[5px] lg:grid-cols-2">
      <div className="col-span-full grid grid-cols-1 gap-[5px] md:grid-cols-3">
        {top3.map((item) => (
          <CollaboratorTopCard key={item.employeeKey} item={item} />
        ))}
      </div>

      <div className="col-span-full">
        <UniversalChartScope>
          <ChartCard
            subtitle={`${rosterLabel}. Aprobadas sobre solicitudes ingresadas mientras cada colaborador estuvo asignado a ${managerName}.`}
            title="Índice de aprobación de colaboradores"
            contentIcon={Target}
            viewType={chartView.viewType}
            accentColor={accentColor}
            kpiValue={kpiValue}
            onChartTypeChange={chartView.handleChartTypeChange}
            headerActions={
              <PerformanceFilterSelector value={filterState} onChange={setFilterState} />
            }
          >
            {chart}
          </ChartCard>
        </UniversalChartScope>
      </div>
    </div>
  )
}
