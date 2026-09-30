'use client';

import React from 'react';
import { Target } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { CustomChartTooltip } from '@/components/ui/md3-tooltip';
import type { MonthlyPlanReal } from '@/lib/types';
import { isPendingMonthlyDatum } from '../helpers/monthly-status';
import { formatPercent, getPercentageText, parsePercentage } from '../helpers/formatters';
import {
  useUniversalChartView,
  getUniversalSolidColor,
  UniversalBarView,
  UniversalLineView,
  UniversalAreaView,
  UniversalRadarView,
} from '@/components/charts/universal';

function toFiniteNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;

  let normalized = value.trim().replace(/%/g, '').replace(/\s/g, '');
  if (!normalized) return 0;

  const comma = normalized.lastIndexOf(',');
  const dot = normalized.lastIndexOf('.');

  if (comma >= 0 && dot >= 0) {
    if (comma > dot) normalized = normalized.replace(/\./g, '').replace(',', '.');
    else normalized = normalized.replace(/,/g, '');
  } else if (comma >= 0) {
    const decimals = normalized.length - comma - 1;
    normalized = decimals === 3 ? normalized.replace(/,/g, '') : normalized.replace(',', '.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export interface IndiceDeEfectividadAnualProps {
  data: MonthlyPlanReal[];
  avanceAcumulado?: number;
  kpis?: {
    avanceAcumulado: number;
  };
}

export function IndiceDeEfectividadAnual({
  data,
  avanceAcumulado: directAvance,
  kpis,
}: IndiceDeEfectividadAnualProps) {
  const { viewType, handleChartTypeChange } = useUniversalChartView();

  const avanceAcumuladoRaw = kpis?.avanceAcumulado ?? directAvance ?? 0;
  const avanceAcumulado = parsePercentage(avanceAcumuladoRaw) ?? 0;
  const efectividadColor = getUniversalSolidColor(avanceAcumulado, 100);

  const chartData = data.map((entry) => {
    const rawPlan = toFiniteNumber(entry.plan);
    const rawReal = toFiniteNumber(entry.real);
    const isPending = isPendingMonthlyDatum(entry);

    const porcentaje = isPending
    ? 0
    : parsePercentage(entry.porcentajeStr) ?? (rawPlan > 0 ? (rawReal / rawPlan) * 100 : 0);

    return {
      mes: entry.mes,
      plan: 100,
      real: porcentaje,
      porcentajeStr: isPending ? '-' : getPercentageText(entry, porcentaje),
      isPending,
      rawReal,
      rawPlan,
    };
  });

  const mainValue = parsePercentage(kpis?.avanceAcumulado ?? directAvance) !== null
    ? formatPercent(avanceAcumulado) : '-';
  const colorResolver = (actual: number, target: number) => getUniversalSolidColor(actual, target);
  const maxEffectiveness = Math.max(100, ...chartData.map((entry) => entry.real));
  const yAxisMax = Math.max(180, Math.ceil(maxEffectiveness / 45) * 45);

  return (
    <ChartCard
      subtitle="Evolución porcentual mensual frente a la meta establecida."
      title="Índice de efectividad anual"
      contentIcon={Target}
      viewType={viewType}
      accentColor={efectividadColor}
      kpiValue={mainValue}
      onChartTypeChange={handleChartTypeChange}
    >
      {(() => {
        const baseProps = {
          data: chartData,
          categoryKey: 'mes',
          target: {
            dataKey: 'plan',
            name: 'Meta (100%)',
          },
          actual: {
            dataKey: 'real',
            name: 'Efectividad (%)',
          },
          valueFormatter: formatPercent,
          colorResolver,
          accentColor: efectividadColor,
          tooltipContent: <CustomChartTooltip />,
          secondaryValueKey: 'porcentajeStr',
          secondaryColorAccessor: (item: any) =>
            getUniversalSolidColor(item.real, item.plan),
        };

        if (viewType === 'bar') {
          return (
            <UniversalBarView
              {...baseProps}
              yAxisDomain={[0, yAxisMax]}
              yAxisTickFormatter={(val) => `${val}%`}
            />
          );
        } else if (viewType === 'line') {
          return (
            <UniversalLineView
              {...baseProps}
              yAxisDomain={[0, yAxisMax]}
              yAxisTickFormatter={(val) => `${val}%`}
            />
          );
        } else if (viewType === 'area') {
          return (
            <UniversalAreaView
              {...baseProps}
              yAxisDomain={[0, yAxisMax]}
              yAxisTickFormatter={(val) => `${val}%`}
            />
          );
        } else if (viewType === 'radar') {
          return (
            <UniversalRadarView
              {...baseProps}
              polarRadiusAxisDomain={[0, yAxisMax]}
              polarRadiusAxisTickFormatter={(val) => `${val}%`}
            />
          );
        }
        return (
          <UniversalBarView
            {...baseProps}
            yAxisDomain={[0, yAxisMax]}
            yAxisTickFormatter={(val) => `${val}%`}
          />
        );
      })()}
    </ChartCard>
  );
}
