'use client'

import React from 'react'
import { ResponsiveContainer } from 'recharts'

import type { ManagerRankingItem } from '@/components/dashboard/vista-general/helpers/manager-ranking'
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

export interface ManagerTopCardChartProps {
  item: ManagerRankingItem
  viewType: ViewType
  yAxisMax: number
  height?: number
}

/**
 * Mini visualización Universal para una tarjeta Top 3.
 *
 * No inventa histórico: Barras usa el único dato real del jefe; Línea, Área y
 * Radar repiten el mismo corte actual en varios puntos neutrales únicamente
 * para poder representar la geometría de esas vistas sin atribuirle meses o
 * tendencias inexistentes.
 */
export function ManagerTopCardChart({
  item,
  viewType,
  yAxisMax,
  height = 140,
}: ManagerTopCardChartProps) {
  const accentColor = getUniversalSolidColor(item.avance, 100)
  const repeats = viewType === 'bar' ? 1 : viewType === 'radar' ? 4 : 3
  const data = Array.from({ length: repeats }, (_, index) => ({
    ...item,
    name: item.name,
    plan: 100,
    avance: item.isPending ? 0 : item.avance,
    porcentajeStr: item.isPending ? '-' : item.porcentajeStr,
    isPending: item.isPending,
    personType: 'manager' as const,
    miniSlot: `slot-${index + 1}`,
  }))

  const ManagerMiniTooltip = (props: CustomChartTooltipProps) => (
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
      name: 'Meta (100%)',
    },
    actual: {
      dataKey: 'avance',
      name: 'Efectividad (%)',
    },
    valueFormatter: formatPercent,
    colorResolver: (actual: number, target: number) => getUniversalSolidColor(actual, target),
    accentColor,
    tooltipContent: <ManagerMiniTooltip />,
    customXAxisTick: () => null,
    secondaryValueAccessor: () => null,
    secondaryColorAccessor: () => accentColor,
  }

  const cartesianProps = {
    ...commonProps,
    yAxisDomain: [0, yAxisMax],
    yAxisTickFormatter: (value: number) => `${value}%`,
    xAxisHeight: 10,
    margin: { top: 10, right: 8, bottom: 0, left: 0 },
  }

  const chart = (() => {
    if (viewType === 'line') {
      return <UniversalLineView {...cartesianProps} />
    }

    if (viewType === 'area') {
      return <UniversalAreaView {...cartesianProps} />
    }

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
    <div className="mt-[5px] w-full min-w-0" style={{ height }} data-manager-top-mini-chart data-chart-type={viewType}>
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        {chart}
      </ResponsiveContainer>
    </div>
  )
}
