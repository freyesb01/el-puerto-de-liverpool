'use client';

import React from 'react';
import { Network } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import type { ParticipacionCanal } from '@/lib/types';
import { CustomChartTooltip } from '@/components/ui/md3-tooltip';
import { formatPercent, getPercentageText } from '../helpers/formatters';
import {
  useUniversalChartView,
  getUniversalSolidColor,
  UniversalBarView,
  UniversalLineView,
  UniversalAreaView,
  UniversalRadarView,
} from '@/components/charts/universal';

export function ParticipacionPorCanal({ data }: { data: ParticipacionCanal[] }) {
  const { viewType, handleChartTypeChange } = useUniversalChartView();

  const total = data.reduce((sum, d) => sum + d.value, 0);

  const channelPlans: Record<string, number> = {
    Ventas: 2712,
    Crédito: 619,
    Promotores: 102,
  };

  const chartData = data.map((d) => {
    const real = total > 0 ? (d.value / total) * 100 : 0;
    const isPending = ('isPending' in d && d.isPending === true) || !Number.isFinite(d.value);

    return {
      name: d.name,
      plan: 100,
      real,
      comparisonBasis: 'participation' as const,
      totalUnidades: total,
      porcentajeStr: isPending ? '-' : getPercentageText(d, real),
      isPending,
      unidades: d.value,
      planUnidades:
        channelPlans[d.name] ||
        (d.name === 'Ventas' ? Math.round(total * 0.75) : Math.round(total * 0.25)),
    };
  });
  const totalUnidades = chartData.reduce((sum, d) => sum + d.unidades, 0);
  const totalPlanUnidades = chartData.reduce((sum, d) => sum + d.planUnidades, 0);
  const overallColor = getUniversalSolidColor(totalUnidades, totalPlanUnidades);
  const kpiValue = chartData.some((item) => !item.isPending)
    ? totalUnidades.toLocaleString('es-MX') : '-';

  const colorResolver = (actual: number, target: number) => getUniversalSolidColor(actual, target);

  return (
    <ChartCard
      contentIcon={Network}
      viewType={viewType}
      accentColor={overallColor}
      kpiValue={kpiValue}
      onChartTypeChange={handleChartTypeChange}
      title="Participación por canal comercial"
      subtitle="Distribución estratégica de originación por canal."
    >
      {(() => {
        const baseProps = {
          data: chartData,
          categoryKey: 'name',
          target: {
            dataKey: 'plan',
            name: 'Plan',
          },
          actual: {
            dataKey: 'real',
            name: 'Real',
          },
          valueFormatter: formatPercent,
          colorResolver,
          accentColor: overallColor,
          tooltipContent: <CustomChartTooltip comparisonFormat="percentage" />,
          secondaryValueAccessor: (item: any) => item.porcentajeStr,
          secondaryColorAccessor: (item: any) =>
            getUniversalSolidColor(item.real, 100),
        };

        if (viewType === 'bar') {
          return (
            <UniversalBarView
              {...baseProps}
              yAxisDomain={[0, 100]}
              yAxisTickFormatter={(val) => `${val}%`}
            />
          );
        } else if (viewType === 'line') {
          return (
            <UniversalLineView
              {...baseProps}
              yAxisDomain={[0, 100]}
              yAxisTickFormatter={(val) => `${val}%`}
            />
          );
        } else if (viewType === 'area') {
          return (
            <UniversalAreaView
              {...baseProps}
              yAxisDomain={[0, 100]}
              yAxisTickFormatter={(val) => `${val}%`}
            />
          );
        } else if (viewType === 'radar') {
          return (
            <UniversalRadarView
              {...baseProps}
              polarRadiusAxisDomain={[0, 100]}
              polarRadiusAxisTickFormatter={(val) => `${val}%`}
            />
          );
        }
        return (
          <UniversalBarView
            {...baseProps}
            yAxisDomain={[0, 100]}
            yAxisTickFormatter={(val) => `${val}%`}
          />
        );
      })()}
    </ChartCard>
  );
}

export { ParticipacionPorCanal as ChannelDonutChart };
