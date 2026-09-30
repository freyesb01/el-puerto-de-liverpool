'use client'

import React from 'react'
import { UserRoundCheck } from 'lucide-react'

import { ChartCard } from '@/components/charts/chart-card'
import { CustomChartTooltip } from '@/components/ui/md3-tooltip'
import { formatPercent } from '@/components/dashboard/vista-general/helpers/formatters'
import type { ViewType } from '@/components/charts/chart-types'
import {
  UniversalChartScope,
  UniversalBarView,
  UniversalLineView,
  UniversalAreaView,
  UniversalRadarView,
  getUniversalSolidColor,
  useUniversalChartView,
} from '@/components/charts/universal'
import type { PromoterEffectivenessItem } from './promoter-top-card-chart'

export interface PromoterEffectivenessChartProps {
  data: PromoterEffectivenessItem[]
  viewType?: ViewType
  onChartTypeChange?: (viewType?: ViewType) => void
  headerActions?: React.ReactNode
}

export function PromoterEffectivenessChart({
  data,
  viewType: controlledViewType,
  onChartTypeChange,
  headerActions,
}: PromoterEffectivenessChartProps) {
  const localView = useUniversalChartView()
  const viewType = controlledViewType ?? localView.viewType
  const handleChartTypeChange = onChartTypeChange ?? localView.handleChartTypeChange

  const evaluatedRows = data.filter(
    (item) => !item.isPending && Number.isFinite(item.avance),
  )
  const averageEffectiveness = evaluatedRows.length > 0
    ? evaluatedRows.reduce((sum, item) => sum + item.avance, 0) / evaluatedRows.length
    : 0

  const accentColor = evaluatedRows.length > 0
    ? getUniversalSolidColor(averageEffectiveness, 100)
    : '#e5e7eb'
  const kpiValue = evaluatedRows.length > 0 ? formatPercent(averageEffectiveness) : '-'
  const maxEffectiveness = Math.max(100, ...evaluatedRows.map((item) => item.avance))
  const yAxisMax = Math.max(120, Math.ceil((maxEffectiveness * 1.1) / 10) * 10)
  const colorResolver = (actual: number, target: number) => getUniversalSolidColor(actual, target)

  const baseProps = {
    data,
    categoryKey: 'name',
    target: {
      dataKey: 'plan',
      name: 'Plan (100%)',
    },
    actual: {
      dataKey: 'avance',
      name: 'Avance real (%)',
    },
    valueFormatter: formatPercent,
    colorResolver,
    accentColor,
    tooltipContent: <CustomChartTooltip comparisonFormat="percentage" />,
    secondaryValueAccessor: (item: PromoterEffectivenessItem) =>
      item.isPending ? '-' : item.porcentajeStr,
    secondaryColorAccessor: (item: PromoterEffectivenessItem) =>
      item.isPending ? '#e5e7eb' : getUniversalSolidColor(item.avance, 100),
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
        subtitle="Avance real por promotor frente al plan asignado."
        title="Índice de efectividad de promotores"
        contentIcon={UserRoundCheck}
        viewType={viewType}
        accentColor={accentColor}
        kpiValue={kpiValue}
        onChartTypeChange={handleChartTypeChange}
        headerActions={headerActions}
      >
        {chart}
      </ChartCard>
    </UniversalChartScope>
  )
}
