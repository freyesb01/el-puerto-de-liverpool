'use client';

import React from 'react';
import { Goal } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import type { MonthlyPlanReal } from '@/lib/types';
import { CustomChartTooltip } from '@/components/ui/md3-tooltip';
import { isPendingMonthlyDatum } from '../helpers/monthly-status';
import { formatNumber, formatPercent, getPercentageText } from '../helpers/formatters';
import {
  useUniversalChartView,
  getUniversalSolidColor,
  UniversalBarView,
  UniversalLineView,
  UniversalAreaView,
  UniversalRadarView,
} from '@/components/charts/universal';

export function CumplimientoMensualDeMeta({ data }: { data: MonthlyPlanReal[] }) {
  const { viewType, handleChartTypeChange } = useUniversalChartView();

  const chartData = data.map((entry) => {
    const isPending = isPendingMonthlyDatum(entry);
    const percentage = entry.plan > 0 ? (entry.real / entry.plan) * 100 : 0;

    return {
      ...entry,
      porcentajeStr: isPending ? '-' : getPercentageText(entry, percentage),
      isPending,
    };
  });

  const totalReal = chartData.reduce((acc, curr) => acc + (curr.real || 0), 0);
  const totalPlan = chartData.reduce((acc, curr) => acc + (curr.plan || 0), 0);
  const overallColor = getUniversalSolidColor(totalReal, totalPlan);
  const kpiRatio = chartData.some((item) => !item.isPending && Number.isFinite(item.real)) && totalPlan > 0
    ? formatPercent((totalReal / totalPlan) * 100) : '-';

  const yFormatter = formatNumber;

  const colorResolver = (real: number, plan: number) => getUniversalSolidColor(real, plan);

  return (
    <ChartCard
      contentIcon={Goal}
      viewType={viewType}
      accentColor={overallColor}
      kpiValue={kpiRatio}
      onChartTypeChange={handleChartTypeChange}
      title="Cumplimiento mensual de meta"
      subtitle="Comparación del resultado mensual frente al plan proyectado."
    >
      {(() => {
        const baseProps = {
          data: chartData,
          categoryKey: 'mes',
          target: {
            dataKey: 'plan',
            name: 'Plan',
          },
          actual: {
            dataKey: 'real',
            name: 'Real',
          },
          valueFormatter: yFormatter,
          colorResolver,
          accentColor: overallColor,
          tooltipContent: <CustomChartTooltip />,
          secondaryValueAccessor: (item: MonthlyPlanReal & { isPending?: boolean }) =>
            item.isPending
              ? '-'
              : getPercentageText(
                  item,
                  item.plan > 0 && item.real !== undefined
                    ? (item.real / item.plan) * 100
                    : undefined,
                ),
          secondaryColorAccessor: (item: MonthlyPlanReal) =>
            getUniversalSolidColor(item.real, item.plan),
        };

        if (viewType === 'bar') {
          return <UniversalBarView {...baseProps} yAxisTickFormatter={yFormatter} />;
        } else if (viewType === 'line') {
          return <UniversalLineView {...baseProps} yAxisTickFormatter={yFormatter} />;
        } else if (viewType === 'area') {
          return <UniversalAreaView {...baseProps} yAxisTickFormatter={yFormatter} />;
        } else if (viewType === 'radar') {
          return (
            <UniversalRadarView
              {...baseProps}
              polarRadiusAxisTickFormatter={yFormatter}
            />
          );
        }
        return <UniversalBarView {...baseProps} yAxisTickFormatter={yFormatter} />;
      })()}
    </ChartCard>
  );
}

export { CumplimientoMensualDeMeta as PlanVsRealChart };
