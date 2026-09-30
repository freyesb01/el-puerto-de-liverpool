'use client'

import { useState } from 'react'
import { ChartLine } from "lucide-react";

import { Legend } from 'recharts'
import { ChartCard } from '@/components/charts/chart-card'
import type { CardTypePoint } from "@/lib/types"
import { CustomChartTooltip } from '@/components/ui/md3-tooltip'
import { BAR_GAP, BAR_CATEGORY_GAP } from '@/lib/chart-config'
import { renderSquareDot, renderSquareActiveDot } from './custom-dots'
import {
  UniversalLineChart,
  UniversalComposedChart,
  UniversalCartesianGrid,
  UniversalXAxis,
  UniversalYAxis,
  UniversalChartTooltip,
} from './universal'

const SERIES: { key: keyof CardTypePoint; color: string }[] = [
  { key: 'DILISA', color: '#833177' },
  { key: 'LPC', color: '#ff6d01' },
  { key: 'JUST ME', color: '#83317780' },
  { key: 'GARANTIZADA', color: '#ff6d0180' },
]

export function CardTypeLineChart({ data }: { data: CardTypePoint[] }) {
  const [viewType, setViewType] = useState<'line' | 'bar'>('line');

  const totalCards = data.reduce(
    (sum, item) => sum + ((item.DILISA || 0) + (item.LPC || 0) + (item['JUST ME'] || 0) + (item.GARANTIZADA || 0)),
    0
  );
  const kpiValue = totalCards > 0 ? totalCards.toLocaleString('es-MX') : '—';

  return (
    <ChartCard
      contentIcon={<ChartLine className="w-5 h-5" style={{ color: '#833177' }} aria-hidden="true" />}
      viewType={viewType}
      accentColor="#833177"
      kpiValue={kpiValue}
      onChartTypeChange={() => setViewType(prev => prev === 'line' ? 'bar' : 'line')}
      title="Evolución y dinámica mensual por tipo de tarjeta."
    >
      {viewType === 'line' ? (
        <UniversalLineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          grid={<UniversalCartesianGrid />}
          xAxis={<UniversalXAxis dataKey="mes" interval={0} height={35} />}
          yAxis={<UniversalYAxis tickFormatter={(val) => new Intl.NumberFormat('es-MX').format(val)} />}
          tooltip={
            <UniversalChartTooltip
              content={<CustomChartTooltip />}
              cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
          }
          legend={
            <Legend
              iconType="square"
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            />
          }
          lines={SERIES.map((s) => ({
            type: 'monotone',
            dataKey: s.key as string,
            name: s.key as string,
            color: s.color,
            strokeWidth: 2.5,
            dot: renderSquareDot,
            activeDot: renderSquareActiveDot,
          }))}
        />
      ) : (
        <UniversalComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          barGap={BAR_GAP}
          barCategoryGap={BAR_CATEGORY_GAP}
          grid={<UniversalCartesianGrid />}
          xAxis={<UniversalXAxis dataKey="mes" interval={0} height={35} />}
          yAxis={<UniversalYAxis tickFormatter={(val) => new Intl.NumberFormat('es-MX').format(val)} />}
          tooltip={<UniversalChartTooltip content={<CustomChartTooltip />} />}
          legend={
            <Legend
              iconType="square"
              wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            />
          }
          bars={SERIES.map((s) => ({
            dataKey: s.key as string,
            name: s.key as string,
            color: s.color,
            barSize: 12,
          }))}
        />
      )}
    </ChartCard>
  )
}
