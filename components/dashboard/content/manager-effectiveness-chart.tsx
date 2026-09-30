'use client'

import React from 'react'
import type { ViewType } from '@/components/charts/chart-types'
import { Target } from 'lucide-react'

import { ChartCard } from '@/components/charts/chart-card'
import { CustomChartTooltip } from '@/components/ui/md3-tooltip'
import type { ManagerRankingItem } from '@/components/dashboard/vista-general/helpers/manager-ranking'
import { formatPercent } from '@/components/dashboard/vista-general/helpers/formatters'
import {
  UniversalChartScope,
  UniversalBarView,
  UniversalLineView,
  UniversalAreaView,
  UniversalRadarView,
  getUniversalSolidColor,
  useUniversalChartView,
  UniversalCategoryTick,
} from '@/components/charts/universal'

export interface ManagerEffectivenessChartProps {
  data: ManagerRankingItem[]
  viewType?: ViewType
  onChartTypeChange?: (viewType?: ViewType) => void
  showChartTypeControl?: boolean
  headerActions?: React.ReactNode
  onSelectItem?: (item: ManagerRankingItem) => void
}

/**
 * Versión hermana de "Índice de efectividad anual" para la pantalla de Jefes.
 * Comparte exactamente el mismo contrato universal de vistas; cambia únicamente
 * la dimensión: aquí cada categoría es un jefe y su meta estratégica es 100%.
 */
export function ManagerEffectivenessChart({
  data,
  viewType: controlledViewType,
  onChartTypeChange,
  showChartTypeControl = true,
  headerActions,
  onSelectItem,
}: ManagerEffectivenessChartProps) {
  const localView = useUniversalChartView()
  const viewType = controlledViewType ?? localView.viewType
  const handleChartTypeChange = onChartTypeChange ?? localView.handleChartTypeChange

  const evaluatedRows = data.filter(
    (item) => !item.isPending && Number.isFinite(item.avance),
  )
  const averageEffectiveness = evaluatedRows.length > 0
    ? evaluatedRows.reduce((sum, item) => sum + item.avance, 0) / evaluatedRows.length
    : 0

  const accentColor = getUniversalSolidColor(averageEffectiveness, 100)
  const kpiValue = evaluatedRows.length > 0 ? formatPercent(averageEffectiveness) : '-'
  const maxEffectiveness = Math.max(100, ...data.map((item) => item.avance))
  const yAxisMax = Math.max(180, Math.ceil(maxEffectiveness / 45) * 45)
  const colorResolver = (actual: number, target: number) => getUniversalSolidColor(actual, target)

  const renderInteractiveTick = (props: any, polar = false) => {
    const categoryValue = props.payload?.value ?? ''
    const item = data.find((row) => row.name === categoryValue)
    if (!item) return null

    const color = getUniversalSolidColor(item.avance, 100)
    const activate = () => onSelectItem?.(item)

    return (
      <g
        role={onSelectItem ? 'button' : undefined}
        tabIndex={onSelectItem ? 0 : undefined}
        onClick={onSelectItem ? activate : undefined}
        onKeyDown={onSelectItem ? (event: React.KeyboardEvent<SVGGElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            activate()
          }
        } : undefined}
        style={{ cursor: onSelectItem ? 'pointer' : 'default' }}
        aria-label={onSelectItem ? `Abrir ${item.name}` : undefined}
      >
        <UniversalCategoryTick
          {...props}
          polar={polar}
          label={item.name}
          secondary={item.isPending ? '-' : item.porcentajeStr}
          color={color}
        />
      </g>
    )
  }

  const baseProps = {
    data,
    categoryKey: 'name',
    target: {
      dataKey: 'plan',
      name: 'Meta (100%)',
    },
    actual: {
      dataKey: 'avance',
      name: 'Efectividad (%)',
    },
    valueFormatter: formatPercent,
    colorResolver,
    accentColor,
    tooltipContent: <CustomChartTooltip comparisonFormat="percentage" />,
    secondaryValueAccessor: (item: ManagerRankingItem) =>
      item.isPending ? '-' : item.porcentajeStr,
    secondaryColorAccessor: (item: ManagerRankingItem) =>
      getUniversalSolidColor(item.avance, 100),
    customXAxisTick: onSelectItem ? (props: any) => renderInteractiveTick(props, false) : undefined,
  }

  const chart = (() => {
    if (viewType === 'line') {
      return (
        <UniversalLineView
          {...baseProps}
          yAxisDomain={[0, yAxisMax]}
          yAxisTickFormatter={(value) => `${value}%`}
        />
      )
    }

    if (viewType === 'area') {
      return (
        <UniversalAreaView
          {...baseProps}
          yAxisDomain={[0, yAxisMax]}
          yAxisTickFormatter={(value) => `${value}%`}
        />
      )
    }

    if (viewType === 'radar') {
      return (
        <UniversalRadarView
          {...baseProps}
          polarRadiusAxisDomain={[0, yAxisMax]}
          polarRadiusAxisTickFormatter={(value) => `${value}%`}
          customPolarTick={onSelectItem ? (props: any) => renderInteractiveTick(props, true) : undefined}
        />
      )
    }

    return (
      <UniversalBarView
        {...baseProps}
        yAxisDomain={[0, yAxisMax]}
        yAxisTickFormatter={(value) => `${value}%`}
      />
    )
  })()

  return (
    <UniversalChartScope>
      <ChartCard
        subtitle="Avance acumulado por jefe frente a la meta estratégica."
        title="Índice de efectividad de jefes"
        contentIcon={Target}
        viewType={viewType}
        accentColor={accentColor}
        kpiValue={kpiValue}
        onChartTypeChange={showChartTypeControl ? handleChartTypeChange : undefined}
        headerActions={headerActions}
      >
        {chart}
      </ChartCard>
    </UniversalChartScope>
  )
}
