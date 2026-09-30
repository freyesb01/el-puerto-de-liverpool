'use client';

import React from 'react';
import { Store } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { CustomChartTooltip } from '@/components/ui/md3-tooltip';
import { formatNumber, getPercentageText } from '../helpers/formatters';
import {
  useUniversalChartView,
  getUniversalSolidColor,
  UniversalBarView,
  UniversalLineView,
  UniversalAreaView,
  UniversalRadarView,
} from '@/components/charts/universal';

export type SeccionInput = [string, number] | { name: string; real: number; plan?: number };

export function DesempenoPorSeccion({ data }: { data: SeccionInput[] }) {
  const { viewType, handleChartTypeChange } = useUniversalChartView();

  const rawItems = data.map(item => {
    if (Array.isArray(item)) {
      return { name: item[0], real: item[1], isPending: !Number.isFinite(item[1]) };
    }
    return { name: item.name, real: item.real, plan: item.plan,
      isPending: ('isPending' in item && item.isPending === true) || !Number.isFinite(item.real) };
  });

  const maxVal = Math.max(...rawItems.map(i => i.real), 1);

  const chartData = rawItems.map((item) => {
    const plan = item.plan ?? maxVal;
    const percentage = plan > 0 ? (item.real / plan) * 100 : 0;

    return {
      name: item.name.toLocaleLowerCase('es-MX') === 'comunicación' ? 'Comunicación' : item.name,
      real: item.real,
      plan,
      comparisonBasis: item.plan === undefined ? 'maximum' as const : 'target' as const,
      porcentajeStr: item.isPending ? '-' : getPercentageText(item, percentage),
      isPending: item.isPending,
    };
  });

  const totalReal = chartData.reduce((acc, curr) => acc + (curr.real || 0), 0);
  const totalPlan = chartData.reduce((acc, curr) => acc + (curr.plan || 0), 0);
  const overallColor = getUniversalSolidColor(totalReal, totalPlan);
  const kpiValue = chartData.some((item) => !item.isPending)
    ? totalReal.toLocaleString('es-MX') : '-';

  const numberFormatter = formatNumber;
  const colorResolver = (real: number, plan: number) => getUniversalSolidColor(real, plan);

  return (
    <ChartCard 
      contentIcon={Store}
      viewType={viewType}
      accentColor={overallColor}
      kpiValue={kpiValue}
      onChartTypeChange={handleChartTypeChange}
      title="Desempeño por sección" 
      subtitle="Producción comercial por departamento y sección operativa."
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
          valueFormatter: numberFormatter,
          colorResolver,
          accentColor: overallColor,
          tooltipContent: <CustomChartTooltip />,
          secondaryValueAccessor: (item: any) => item.porcentajeStr,
          secondaryColorAccessor: (item: any) =>
            getUniversalSolidColor(item.real, item.plan),
        };

        if (viewType === 'bar') {
          return <UniversalBarView {...baseProps} yAxisTickFormatter={numberFormatter} />;
        } else if (viewType === 'line') {
          return <UniversalLineView {...baseProps} yAxisTickFormatter={numberFormatter} />;
        } else if (viewType === 'area') {
          return <UniversalAreaView {...baseProps} yAxisTickFormatter={numberFormatter} />;
        } else if (viewType === 'radar') {
          return <UniversalRadarView {...baseProps} polarRadiusAxisTickFormatter={numberFormatter} />;
        }
        return <UniversalBarView {...baseProps} yAxisTickFormatter={numberFormatter} />;
      })()}
    </ChartCard>
  );
}

export { DesempenoPorSeccion as SeccionesChart };
