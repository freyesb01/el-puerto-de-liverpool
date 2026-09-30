'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { CustomChartTooltip } from '@/components/ui/md3-tooltip';
import { formatPersonName } from '@/lib/utils';
import { MANAGER_DISPLAY_NAMES } from '@/lib/person-names';
import { formatPercent, getPercentageText } from '../helpers/formatters';
import { getTop3Managers, type ManagerRankingItem } from '../helpers/manager-ranking';
import {
  useUniversalChartView,
  getUniversalSolidColor,
  getUniversalDatumColor,
  UniversalBarView,
  UniversalLineView,
  UniversalAreaView,
  UniversalRadarView,
} from '@/components/charts/universal';

export interface TopJefeItem extends ManagerRankingItem {}

// Compatibilidad con imports anteriores; la lógica vive ahora en el helper compartido.
export const NAME_DICTIONARY = MANAGER_DISPLAY_NAMES;
export const toTitleCase = (str: string) => formatPersonName(str);
export const getTop3Jefes = getTop3Managers;


export interface RankingDeJefesDeVentasProps {
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

export function RankingDeJefesDeVentas({
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
}: RankingDeJefesDeVentasProps) {
  const { viewType, handleChartTypeChange } = useUniversalChartView();

  const colA = namesArray || rangoA || rangeA || columnA;
  const colAE = percentagesArray || rangoAE || rangeAE || columnAE;

  let top3Jefes: TopJefeItem[] = [];

  if (colA && colAE && colA.length > 0 && colAE.length > 0) {
    top3Jefes = getTop3Jefes(colA, colAE);
  } else {
    const rawList = rawData || data;
    if (rawList && rawList.length > 0) {
      top3Jefes = getTop3Jefes(rawList);
    }
  }

  const leaderAvance = top3Jefes[0]?.avance ?? 0;
  const overallColor = getUniversalDatumColor(top3Jefes[0], getUniversalSolidColor(leaderAvance, 100));
  const kpiValue = top3Jefes.length > 0 ? top3Jefes[0].porcentajeStr : '-';
  const maxAvance = Math.max(100, ...top3Jefes.map((item) => item.avance));
  const yAxisMax = Math.max(120, Math.ceil((maxAvance * 1.1) / 10) * 10);

  const colorResolver = (avance: number, plan: number) => getUniversalSolidColor(avance, plan);

  return (
    <ChartCard
      contentIcon={Trophy}
      viewType={viewType}
      accentColor={overallColor}
      kpiValue={kpiValue}
      onChartTypeChange={handleChartTypeChange}
      title="Ranking de jefes de ventas"
      subtitle="Top 3 por avance acumulado frente al plan estratégico."
    >
      {(() => {
        const baseProps = {
          data: top3Jefes,
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

export { RankingDeJefesDeVentas as JefesVentasChart };
