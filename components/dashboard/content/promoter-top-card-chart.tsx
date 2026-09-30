'use client'

import React from 'react'
import { ResponsiveContainer } from 'recharts'

import { formatPercent } from '@/components/dashboard/vista-general/helpers/formatters'
import { CustomChartTooltip, type CustomChartTooltipProps } from '@/components/ui/md3-tooltip'
import type { ViewType } from '@/components/charts/chart-types'
import {
  UniversalAreaView,
  UniversalBarView,
  UniversalLineView,
  UniversalRadarView,
  getUniversalSolidColor,
} from '@/components/charts/universal'

export interface PromoterEffectivenessItem {
  name: string
  avance: number
  plan: number
  isPending: boolean
  porcentajeStr: string
  aprobadas: number
  ingresadas: number
  declinadas: number
  personType: 'promoter'
  [key: string]: unknown
}

export interface PromoterTopCardChartProps {
  item: PromoterEffectivenessItem
  viewType: ViewType
  yAxisMax: number
  height?: number
}

/**
 * Mini visualización Universal del corte actual del promotor.
 * El avance proviene de la relación REAL / PLAN del bloque de promotores
 * en Plan 2026. La visualización normaliza esa relación contra 100%.
 */
export function PromoterTopCardChart({
  item,
  viewType,
  yAxisMax,
  height = 140,
}: PromoterTopCardChartProps) {
  const accentColor = item.isPending
    ? '#e5e7eb'
    : getUniversalSolidColor(item.avance, 100)
  const repeats = viewType === 'bar' ? 1 : viewType === 'radar' ? 4 : 3
  const data = Array.from({ length: repeats }, (_, index) => ({
    ...item,
    plan: 100,
    avance: item.isPending ? 0 : item.avance,
    miniSlot: `slot-${index + 1}`,
  }))

  const PromoterMiniTooltip = (props: CustomChartTooltipProps) => (
    <CustomChartTooltip
      {...props}
      label={item.name}
      comparisonFormat="percentage"
    />
  )

  const commonProps = {
    data,
    categoryKey: 'miniSlot',
    target: {
      dataKey: 'plan',
      name: 'Plan (100%)',
    },
    actual: {
      dataKey: 'avance',
      name: 'Avance real (%)',
    },
    valueFormatter: formatPercent,
    colorResolver: (actual: number, target: number) => getUniversalSolidColor(actual, target),
    accentColor,
    tooltipContent: <PromoterMiniTooltip />,
    customXAxisTick: () => null,
    secondaryValueAccessor: () => null,
    secondaryColorAccessor: () => accentColor,
  }

  const cartesianProps = {
    ...commonProps,
    yAxisDomain: [0, yAxisMax] as [number, number],
    yAxisTickFormatter: (value: number) => `${value}%`,
    xAxisHeight: 10,
    margin: { top: 10, right: 8, bottom: 0, left: 0 },
  }

  const chart = (() => {
    if (viewType === 'line') return <UniversalLineView {...cartesianProps} />
    if (viewType === 'area') return <UniversalAreaView {...cartesianProps} />
    if (viewType === 'radar') {
      return (
        <UniversalRadarView
          {...commonProps}
          customPolarTick={() => null}
          polarRadiusAxisDomain={[0, yAxisMax]}
          polarRadiusAxisTickFormatter={(value) => `${value}%`}
          polarMargin={{ top: 8, right: 18, bottom: 8, left: 18 }}
          outerRadius="72%"
        />
      )
    }
    return <UniversalBarView {...cartesianProps} />
  })()

  return (
    <div
      className="mt-[5px] w-full min-w-0"
      style={{ height }}
      data-promoter-top-mini-chart
      data-chart-type={viewType}
    >
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        {chart}
      </ResponsiveContainer>
    </div>
  )
}
