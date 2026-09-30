'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { CustomChartTooltip } from '@/components/ui/md3-tooltip';
import type { MonthlyPlanReal } from '@/lib/types';
import { formatNumber, getPercentageText } from '../helpers/formatters';
import { isPendingMonthlyDatum } from '../helpers/monthly-status';
import {
  useUniversalChartView,
  getUniversalSolidColor,
  UniversalBarView,
  UniversalLineView,
  UniversalAreaView,
  UniversalRadarView,
} from '@/components/charts/universal';

export interface VolumenDeOriginacionRealProps {
  data: MonthlyPlanReal[];
  aprobadas?: number;
  planAnual?: number;
  kpis?: {
    aprobadas: number;
    planAnual: number;
  };
}

export function VolumenDeOriginacionReal({
  data,
  aprobadas: directAprobadas,
  planAnual: directPlanAnual,
  kpis,
}: VolumenDeOriginacionRealProps) {
  const { viewType, handleChartTypeChange } = useUniversalChartView();

  const aprobadas = kpis?.aprobadas ?? directAprobadas ?? 0;
  const planAnual = kpis?.planAnual ?? directPlanAnual ?? 1;
  const volumenColor = getUniversalSolidColor(aprobadas, planAnual);
  const chartData = data.map((entry) => {
    const isPending = isPendingMonthlyDatum(entry);
    const percentage = entry.plan > 0 ? (entry.real / entry.plan) * 100 : 0;

    return {
      mes: entry.mes,
      plan: entry.plan,
      real: entry.real,
      porcentajeStr: isPending ? '-' : getPercentageText(entry, percentage),
      isPending,
    };
  });

  const mainValue = Number.isFinite(kpis?.aprobadas ?? directAprobadas)
    ? formatNumber(aprobadas) : '-';

  const colorResolver = (real: number, plan: number) => getUniversalSolidColor(real, plan);

  return (
    <ChartCard
      subtitle="Originación mensual aprobada frente al plan proyectado."
      title="Volumen de originación real"
      contentIcon={CreditCard}
      viewType={viewType}
      accentColor={volumenColor}
      kpiValue={mainValue}
      onChartTypeChange={handleChartTypeChange}
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
            name: 'Aprobadas',
          },
          valueFormatter: formatNumber,
          colorResolver,
          accentColor: volumenColor,
          tooltipContent: <CustomChartTooltip />,
          secondaryValueAccessor: (item: any) =>
            item.isPending ? '-' : formatNumber(item.real),
          secondaryColorAccessor: (item: any) =>
            getUniversalSolidColor(item.real, item.plan),
        };

        if (viewType === 'bar') {
          return <UniversalBarView {...baseProps} yAxisTickFormatter={formatNumber} />;
        } else if (viewType === 'line') {
          return <UniversalLineView {...baseProps} yAxisTickFormatter={formatNumber} />;
        } else if (viewType === 'area') {
          return <UniversalAreaView {...baseProps} yAxisTickFormatter={formatNumber} />;
        } else if (viewType === 'radar') {
          return <UniversalRadarView {...baseProps} polarRadiusAxisTickFormatter={formatNumber} />;
        }
        return <UniversalBarView {...baseProps} yAxisTickFormatter={formatNumber} />;
      })()}
    </ChartCard>
  );
}
