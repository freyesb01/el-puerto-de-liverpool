'use client';

import React from 'react';
import { UserRoundCheck } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { CustomChartTooltip } from '@/components/ui/md3-tooltip';
import { formatPromoterLabel, PROMOTER_DISPLAY_NAMES } from '@/lib/person-names';
import { formatPercent, getPercentageText } from '../helpers/formatters';
import { getRankingPercentage } from '../helpers/ranking-percentage';
import {
  useUniversalChartView,
  getUniversalSolidColor,
  getUniversalDatumColor,
  UniversalBarView,
  UniversalLineView,
  UniversalAreaView,
  UniversalRadarView,
} from '@/components/charts/universal';

export interface PromotorItem {
  name: string;
  avance: number;
  isPending?: boolean;
  porcentajeStr?: string;
  real?: number;
  plan?: number;
  [key: string]: any;
}

export const PROMOTOR_DICTIONARY = PROMOTER_DISPLAY_NAMES;

export const getPromotoresData = (
  namesArray?: string[] | any[] | null,
  percentagesArray?: (string | number)[] | null
): PromotorItem[] => {
  if (!namesArray) return [];
  const objectRows = (!percentagesArray || percentagesArray.length === 0) &&
    namesArray.length > 0 && typeof namesArray[0] === 'object' && namesArray[0] !== null;
  if (!objectRows && !percentagesArray) return [];

  const mappedData = namesArray.map((entry, index) => {
    const item = objectRows ? entry : undefined;
    const name = item ? (item.name || item.nombre || item.canal || '') : entry;
    const real = item ? (item.real ?? item.aprobadas) : undefined;
    const fallback = typeof real === 'number'
      ? (typeof item.plan === 'number' && item.plan > 0 ? (real / item.plan) * 100 : real)
      : undefined;
    const percentage = getRankingPercentage(
      item ? item.avance : percentagesArray?.[index], item, fallback,
    );
    const rawName = String(name || '').trim();
    const cleanName = formatPromoterLabel(rawName);

    return { name: cleanName, ...percentage };
  });

  return mappedData;
};


export interface RankingDePromotoresProps {
  namesArray?: string[];
  percentagesArray?: (number | string)[];
  rangoA?: string[];
  rangoAE?: (number | string)[];
  rangeA?: string[];
  rangeAE?: (number | string)[];
  columnA?: string[];
  columnAE?: (number | string)[];
  data?: any[];
  rawData?: any[];
}

export function RankingDePromotores({
  namesArray,
  percentagesArray,
  rangoA,
  rangoAE,
  rangeA,
  rangeAE,
  columnA,
  columnAE,
  data,
  rawData,
}: RankingDePromotoresProps) {
  const { viewType, handleChartTypeChange } = useUniversalChartView();

  const colA = namesArray || rangoA || rangeA || columnA;
  const colAE = percentagesArray || rangoAE || rangeAE || columnAE;

  let chartData: PromotorItem[] = [];

  if (colA && colAE && colA.length > 0 && colAE.length > 0) {
    chartData = getPromotoresData(colA, colAE);
  } else {
    const rawList = rawData || data;
    if (rawList && rawList.length > 0) {
      chartData = getPromotoresData(rawList);
    }
  }

  const leaderAvance = chartData[0]?.avance ?? 0;
  const overallColor = getUniversalDatumColor(chartData[0], getUniversalSolidColor(leaderAvance, 100));
  const kpiValue = chartData.length > 0 ? chartData[0].porcentajeStr : '-';
  const maxAvance = Math.max(100, ...chartData.map((item) => item.avance));
  const yAxisMax = Math.max(120, Math.ceil((maxAvance * 1.1) / 10) * 10);

  const colorResolver = (avance: number, plan: number) => getUniversalSolidColor(avance, plan);

  return (
    <ChartCard
    contentIcon={UserRoundCheck}
    viewType={viewType}
    accentColor={overallColor}
    kpiValue={kpiValue}
    onChartTypeChange={handleChartTypeChange}
    title="Ranking de promotores"
    subtitle="Clasificación de rendimiento operativo acumulado por promotor."
    >
    {(() => {
      const baseProps = {
        data: chartData,
        categoryKey: 'name',
        target: {
          dataKey: 'plan',
          name: 'Plan (100%)',
        },
        actual: {
          dataKey: 'avance',
          name: 'Avance Real',
        },
        valueFormatter: formatPercent,
      colorResolver,
      accentColor: overallColor,
      tooltipContent: <CustomChartTooltip />,
      secondaryValueAccessor: (item: any) =>
        item.isPending ? '-' : getPercentageText(item, Number(item.avance || 0)),
      secondaryColorAccessor: (item: any) =>
      getUniversalSolidColor(item.avance, 100),
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

export { RankingDePromotores as PromotoresRankingChart };
export { RankingDePromotores as PromotoresChart };
