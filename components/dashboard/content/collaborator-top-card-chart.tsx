'use client'

import React from 'react'
import { ResponsiveContainer } from 'recharts'

import type { ViewType } from '@/components/charts/chart-types'
import {
  UniversalAreaView,
  UniversalBarView,
  UniversalLineView,
  UniversalRadarView,
  getUniversalSolidColor,
} from '@/components/charts/universal'

export interface CollaboratorChartRow {
  employeeKey: string
  numeroPersonal?: string
  name: string
  seccion: string
  aprobadas: number
  declinadas: number
  ingresadas: number
  approvalRate: number
  porcentajeStr: string
  isPending: boolean
  color: string
}

export interface CollaboratorTopCardChartProps {
  item: CollaboratorChartRow
  viewType: ViewType
  height?: number
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace('.', ',')}%`
}

/**
 * Mini gráfica equivalente a la usada en Top 3 de Jefes, pero sin inventar meta.
 * La métrica es tasa real de aprobación = aprobadas / ingresadas.
 */
export function CollaboratorTopCardChart({
  item,
  viewType,
  height = 140,
}: CollaboratorTopCardChartProps) {
  const repeats = viewType === 'bar' ? 1 : viewType === 'radar' ? 4 : 3
  const data = Array.from({ length: repeats }, (_, index) => ({
    ...item,
    miniSlot: `slot-${index + 1}`,
    approvalRate: item.isPending ? 0 : item.approvalRate,
  }))

  const accentColor = item.color
  const commonProps = {
    data,
    categoryKey: 'miniSlot',
    actual: {
      dataKey: 'approvalRate',
      name: 'Aprobación (%)',
    },
    valueFormatter: formatPercent,
    colorResolver: (actual: number) => getUniversalSolidColor(actual, 100),
    accentColor,
    customXAxisTick: () => null,
    secondaryValueAccessor: () => null,
    secondaryColorAccessor: () => accentColor,
  }

  const cartesianProps = {
    ...commonProps,
    yAxisDomain: [0, 100],
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
          polarRadiusAxisDomain={[0, 100]}
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
      data-collaborator-top-mini-chart
      data-chart-type={viewType}
    >
      <ResponsiveContainer width="100%" height={height} minWidth={0}>
        {chart}
      </ResponsiveContainer>
    </div>
  )
}
