'use client';

import React from 'react';
import { ChartLine } from 'lucide-react';
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

export interface DesviacionOperativaProps {
  data: MonthlyPlanReal[];
  diferenciaGlobal?: number;
  aprobadas?: number;
  planAnual?: number;
  kpis?: {
    diferenciaGlobal: number;
    aprobadas: number;
    planAnual: number;
  };
}

export function DesviacionOperativa({
  data,
  diferenciaGlobal: directDiferencia,
  aprobadas: directAprobadas,
  planAnual: directPlanAnual,
  kpis,
}: DesviacionOperativaProps) {
  const { viewType, handleChartTypeChange } = useUniversalChartView();

  const diferenciaGlobal = kpis?.diferenciaGlobal ?? directDiferencia ?? 0;
  const aprobadas = kpis?.aprobadas ?? directAprobadas ?? 0;
  const planAnual = kpis?.planAnual ?? directPlanAnual ?? 1;
  const diferenciaPositiva = diferenciaGlobal > 0;
  const desviacionColor = getUniversalSolidColor(aprobadas, planAnual);

  const chartData = data.map((entry) => {
    const isPending = isPendingMonthlyDatum(entry);
    const diff = entry.real - entry.plan;
    return {
      mes: entry.mes,
      plan: entry.plan,
      real: entry.real,
      diferencia: isPending ? null : diff,
      isPending,
      porcentajeStr: isPending
        ? '-'
        : getPercentageText(
            entry,
            entry.plan > 0 ? (entry.real / entry.plan) * 100 : 0,
          ),
      subStr: isPending ? '-' : `${diff > 0 ? '+' : ''}${formatNumber(diff)}`,
    };
  });

  const mainValue = Number.isFinite(kpis?.diferenciaGlobal ?? directDiferencia)
    ? `${diferenciaPositiva ? '+' : ''}${formatNumber(diferenciaGlobal)}` : '-';

  const colorResolver = (real: number, plan: number) => getUniversalSolidColor(real, plan);

  return (
    <ChartCard
      subtitle="Diferencia mensual entre el resultado real y el plan proyectado."
      title="Desviación operativa"
      contentIcon={ChartLine}
      viewType={viewType}
      accentColor={desviacionColor}
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
            name: 'Real',
          },
          valueFormatter: formatNumber,
          colorResolver,
          accentColor: desviacionColor,
          tooltipContent: <CustomChartTooltip />,
          secondaryValueKey: 'subStr',
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
