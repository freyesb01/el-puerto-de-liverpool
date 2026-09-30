'use client'

import { useState } from 'react'
import { Package } from "lucide-react";

import { Cell } from 'recharts'
import { ChartCard } from '@/components/charts/chart-card'
import type { ProductPerformance } from "@/lib/types"
import { CustomChartTooltip } from '@/components/ui/md3-tooltip'
import { VerticalMD3Bar } from '@/components/ui/vertical-md3-bar'
import { BAR_SIZE, BAR_GAP, BAR_CATEGORY_GAP } from '@/lib/chart-config'
import { getPerformanceColor, formatPercentage } from '@/lib/utils'
import {
  UniversalComposedChart,
  UniversalRadarChart,
  UniversalCartesianGrid,
  UniversalXAxis,
  UniversalYAxis,
  UniversalPolarAngleAxis,
  UniversalPolarRadiusAxis,
  UniversalChartTooltip,
} from './universal'

const CustomXAxisTick = (props: any) => {
  const { x, y, payload, data } = props;
  const item = data?.find((d: any) => d.producto === payload.value);
  
  const calc = (item?.plan > 0 && item?.real) ? (item.real / item.plan) * 100 : 0;
  const pctStr = formatPercentage(calc);
  
  let cellColor = '#49454F';
  if (item) {
    const isPending = item.real === 0 || item.plan === 0;
    cellColor = isPending ? '#e5e7eb' : getPerformanceColor(item.real, item.plan);
  }
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fill="#49454F" fontSize={10}>
        <tspan x={0}>{payload.value}</tspan>
        <tspan x={0} dy={15} fill={cellColor} opacity={0.7} fontSize={9}>{pctStr}</tspan>
      </text>
    </g>
  );
};

const CustomPolarTick = (props: any) => {
  const { x, y, payload, data, textAnchor } = props;
  const item = data?.find((d: any) => d.producto === payload.value);
  
  const calc = (item?.plan > 0 && item?.real) ? (item.real / item.plan) * 100 : 0;
  const pctStr = formatPercentage(calc);
  
  let cellColor = '#49454F';
  if (item) {
    const isPending = item.real === 0 || item.plan === 0;
    cellColor = isPending ? '#e5e7eb' : getPerformanceColor(item.real, item.plan);
  }
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={0} textAnchor={textAnchor} fill="#49454F" fontSize={10}>
        <tspan x={0}>{payload.value}</tspan>
        <tspan x={0} dy={15} fill={cellColor} opacity={0.7} fontSize={9}>{pctStr}</tspan>
      </text>
    </g>
  );
};

export function ProductPerformanceChart({ data }: { data: ProductPerformance[] }) {
  const [viewType, setViewType] = useState<'bar' | 'radar'>('bar');

  const totalReal = data.reduce((acc, curr) => acc + (curr.real || 0), 0);
  const totalPlan = data.reduce((acc, curr) => acc + (curr.plan || 0), 0);
  const overallColor = getPerformanceColor(totalReal, totalPlan);
  const kpiValue = totalPlan > 0 ? `${((totalReal / totalPlan) * 100).toFixed(1).replace('.', ',')}%` : (totalReal > 0 ? totalReal.toLocaleString('es-MX') : '—');

  return (
    <ChartCard
      contentIcon={Package}
      viewType={viewType}
      accentColor={overallColor}
      kpiValue={kpiValue}
      onChartTypeChange={() => setViewType(prev => prev === 'bar' ? 'radar' : 'bar')}
      title="Rendimiento y colocación por producto financiero."
    >
      {viewType === 'bar' ? (
        <UniversalComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          barGap={BAR_GAP}
          barCategoryGap={BAR_CATEGORY_GAP}
          grid={<UniversalCartesianGrid />}
          xAxis={
            <UniversalXAxis
              dataKey="producto"
              height={60}
              interval={0}
              tick={<CustomXAxisTick data={data} />}
            />
          }
          yAxis={<UniversalYAxis tickFormatter={(val) => new Intl.NumberFormat('es-MX').format(val)} />}
          tooltip={<UniversalChartTooltip content={<CustomChartTooltip />} />}
          bars={[
            {
              dataKey: 'plan',
              name: 'Plan',
              color: typeof overallColor !== 'undefined' ? overallColor + '40' : '#83317740',
              barSize: BAR_SIZE,
              shape: <VerticalMD3Bar />,
              background: { fill: 'transparent' },
              cells: (entry, index) => {
                const isPending = entry.real === 0 || entry.plan === 0;
                const color = isPending ? '#e5e7eb' : getPerformanceColor(entry.real, entry.plan);
                return <Cell key={`plan-cell-${index}`} fill={`${color}40`} />;
              },
            },
            {
              dataKey: 'real',
              name: 'Real',
              color: overallColor,
              barSize: BAR_SIZE,
              shape: <VerticalMD3Bar />,
              background: { fill: 'transparent' },
              cells: (entry, index) => (
                <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.real, entry.plan)} />
              ),
            },
          ]}
        />
      ) : (
        <UniversalRadarChart
          cx="50%"
          cy="50%"
          outerRadius="65%"
          margin={{ top: 20, right: 40, bottom: 20, left: 40 }}
          data={data}
          polarAngleAxis={
            <UniversalPolarAngleAxis
              dataKey="producto"
              tick={(props) => <CustomPolarTick data={data} {...props} />}
            />
          }
          polarRadiusAxis={
            <UniversalPolarRadiusAxis
              angle={90}
              domain={[0, 'auto']}
              tickFormatter={(val) => new Intl.NumberFormat('es-MX').format(val)}
            />
          }
          tooltip={<UniversalChartTooltip content={<CustomChartTooltip />} />}
          series={[
            {
              name: 'Plan',
              dataKey: 'plan',
              stroke: typeof overallColor !== 'undefined' ? overallColor + '40' : '#83317740',
              fill: typeof overallColor !== 'undefined' ? overallColor + '40' : '#83317740',
              fillOpacity: 0.6,
            },
            {
              name: 'Real',
              dataKey: 'real',
              stroke: overallColor,
              fill: overallColor,
              fillOpacity: 0.6,
            },
          ]}
        />
      )}
    </ChartCard>
  )
}
