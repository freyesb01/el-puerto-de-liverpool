'use client';

import React from 'react';
import type { ViewType } from '@/components/charts/chart-types';
import { PieChart } from 'lucide-react';
import { ChartCard } from '@/components/charts/chart-card';
import { CustomChartTooltip } from '@/components/ui/md3-tooltip';
import type { CardTypePoint } from '@/lib/types';
import { BAR_SIZE, BAR_GAP, BAR_CATEGORY_GAP } from '@/lib/chart-config';
import { formatNumber, formatPercent } from '../helpers/formatters';
import { VerticalMD3Bar } from '@/components/charts/universal/universal-vertical-bar';
import { createUniversalTargetDotRenderer } from '@/components/charts/universal/views/universal-target-edge-extensions';
import {
  useUniversalChartView,
  UniversalCategoryTick,
  UNIVERSAL_CHART_LAYOUT,
  UNIVERSAL_TARGET_SERIES,
  UNIVERSAL_ACTUAL_SERIES,
  UNIVERSAL_RADAR_SERIES,
  UniversalComposedChart,
  UniversalLineChart,
  UniversalAreaChart,
  UniversalRadarChart,
  UniversalCartesianGrid,
  UniversalXAxis,
  UniversalYAxis,
  UniversalPolarAngleAxis,
  UniversalPolarRadiusAxis,
  UniversalChartTooltip,
  UniversalChartCursor,
  createUniversalDotRenderer,
} from '@/components/charts/universal';

export interface MezclaDePortafolioFinancieroProps {
  data: CardTypePoint[];
  participacionVentas?: number;
  kpis?: {
    participacionVentas: number;
  };
}

const PRODUCTS = [
  {
    name: 'DILISA',
    realKey: 'DILISA',
    planKey: 'DILISA_PLAN',
    color: '#833177',
  },
  {
    name: 'LPC',
    realKey: 'LPC',
    planKey: 'LPC_PLAN',
    color: '#e10098',
  },
  {
    name: 'JUST ME',
    realKey: 'JUST ME',
    planKey: 'JUST ME_PLAN',
    color: '#ff6d01',
  },
  {
    name: 'GARANTIZADA',
    realKey: 'GARANTIZADA',
    planKey: 'GARANTIZADA_PLAN',
    color: '#49454F',
  },
] as const;

const LEGEND_SERIES = PRODUCTS.map((product) => ({
  dataKey: product.realKey,
  name: product.name,
  color: product.color,
}));

const TOOLTIP_GROUPS = PRODUCTS.map((product) => ({
  name: product.name,
  actualKey: product.realKey,
  targetKey: product.planKey,
  color: product.color,
}));

function PortfolioTooltip(props: any) {
  return <CustomChartTooltip {...props} comparisonGroups={TOOLTIP_GROUPS} />;
}

function PortfolioComposedPlot({ series: _series, ...props }: any) {
  return <UniversalComposedChart {...props} />;
}

function PortfolioLinePlot({ series: _series, ...props }: any) {
  return <UniversalLineChart {...props} />;
}

function PortfolioAreaPlot({ series: _series, ...props }: any) {
  return <UniversalAreaChart {...props} />;
}

function PortfolioRadarPlot({
  series: _series,
  radarSeries,
  polarMargin: _polarMargin,
  ...props
}: any) {
  return <UniversalRadarChart {...props} series={radarSeries} />;
}

function ProductTick({
  data,
  polar = false,
  payload,
  accentColor = '#833177',
  ...props
}: any) {
  const item = data?.find((entry: any) => entry.mes === payload?.value);
  const secondary = item?.subStr ?? '-';
  const color = item?.isPending ? '#ff6d01' : accentColor;

  return (
    <UniversalCategoryTick
      {...props}
      polar={polar}
      label={payload?.value ?? ''}
      secondary={secondary}
      color={color}
    />
  );
}

export function MezclaDePortafolioFinanciero({
  data,
}: MezclaDePortafolioFinancieroProps) {
  const { viewType, handleChartTypeChange } = useUniversalChartView();

  const chartData = data.map((entry) => {
    const totalPlan =
      (entry.DILISA_PLAN || 0) +
      (entry.LPC_PLAN || 0) +
      (entry['JUST ME_PLAN'] || 0) +
      (entry.GARANTIZADA_PLAN || 0);

    const totalReal =
      (entry.DILISA || 0) +
      (entry.LPC || 0) +
      (entry['JUST ME'] || 0) +
      (entry.GARANTIZADA || 0);

    const isPending = entry.isPending === true;

    return {
      mes: entry.mes,
      DILISA_PLAN: entry.DILISA_PLAN || 0,
      DILISA: entry.DILISA || 0,
      LPC_PLAN: entry.LPC_PLAN || 0,
      LPC: entry.LPC || 0,
      'JUST ME_PLAN': entry['JUST ME_PLAN'] || 0,
      'JUST ME': entry['JUST ME'] || 0,
      GARANTIZADA_PLAN: entry.GARANTIZADA_PLAN || 0,
      GARANTIZADA: entry.GARANTIZADA || 0,
      totalPlan,
      totalReal,
      total: totalReal,
      subStr: isPending ? '-' : formatNumber(totalReal),
      isPending,
    };
  });

  const productTotals = PRODUCTS.map((product) => ({
    ...product,
    total: chartData.reduce(
      (sum, item) => sum + Number(item[product.realKey] || 0),
      0,
    ),
  }));

  const portfolioTotal = productTotals.reduce(
    (sum, product) => sum + product.total,
    0,
  );

  const dominantProduct = productTotals.reduce(
    (leader, product) =>
      product.total > leader.total ? product : leader,
    productTotals[0],
  );

  const dominantShare =
    portfolioTotal > 0
      ? (dominantProduct.total / portfolioTotal) * 100
      : 0;

  const carteraColor = dominantProduct.color;
  const mainValue = chartData.some((item) => !item.isPending) ? formatPercent(dominantShare) : '-';

  const tooltipElement = (chartType: ViewType) => (
    <UniversalChartTooltip
      content={<PortfolioTooltip />}
      cursor={
        <UniversalChartCursor
          data={chartData}
          chartType={(chartType === 'bar' ? 'composed' : chartType) as any}
          getDatumColor={(entry: any) =>
            entry?.isPending ? '#ff6d01' : carteraColor
          }
        />
      }
    />
  );

  const targetLines = PRODUCTS.map((product) => ({
    type: 'monotone' as const,
    dataKey: product.planKey,
    name: `Meta ${product.name}`,
    stroke: product.color,
    color: product.color,
    strokeWidth: UNIVERSAL_TARGET_SERIES.strokeWidth,
    strokeOpacity: UNIVERSAL_TARGET_SERIES.strokeOpacity,
    dot: createUniversalTargetDotRenderer({
      dataLength: chartData.length,
      color: product.color,
      size: UNIVERSAL_TARGET_SERIES.dotSize,
      fillOpacity: UNIVERSAL_TARGET_SERIES.dotFillOpacity,
      strokeWidth: UNIVERSAL_TARGET_SERIES.strokeWidth,
      strokeOpacity: UNIVERSAL_TARGET_SERIES.strokeOpacity,
      extendEdges: true,
    }),
    activeDot: createUniversalTargetDotRenderer({
      dataLength: chartData.length,
      color: product.color,
      size: UNIVERSAL_TARGET_SERIES.activeDotSize,
      fillOpacity: UNIVERSAL_TARGET_SERIES.dotFillOpacity,
      strokeWidth: UNIVERSAL_TARGET_SERIES.strokeWidth,
      strokeOpacity: UNIVERSAL_TARGET_SERIES.strokeOpacity,
      active: true,
    }),
    animation: {
      isAnimationActive: UNIVERSAL_TARGET_SERIES.isAnimationActive,
    },
  }));

  const realLines = PRODUCTS.map((product) => ({
    type: 'monotone' as const,
    dataKey: product.realKey,
    name: product.name,
    stroke: product.color,
    color: product.color,
    strokeWidth: UNIVERSAL_ACTUAL_SERIES.strokeWidth,
    strokeOpacity: UNIVERSAL_ACTUAL_SERIES.strokeOpacity,
    dot: createUniversalDotRenderer({
      size: UNIVERSAL_ACTUAL_SERIES.dotSize,
      fillOpacity: UNIVERSAL_ACTUAL_SERIES.dotFillOpacity,
      getColor: (payload: any) =>
        payload?.isPending ? '#ff6d01' : product.color,
    }),
    activeDot: createUniversalDotRenderer({
      isActive: true,
      size: UNIVERSAL_ACTUAL_SERIES.activeDotSize,
      fillOpacity: UNIVERSAL_ACTUAL_SERIES.dotFillOpacity,
      getColor: (payload: any) =>
        payload?.isPending ? '#ff6d01' : product.color,
    }),
  }));

  const realAreas = PRODUCTS.map((product) => ({
    type: 'monotone' as const,
    dataKey: product.realKey,
    name: product.name,
    stroke: product.color,
    color: product.color,
    fill: product.color,
    strokeWidth: UNIVERSAL_ACTUAL_SERIES.strokeWidth,
    strokeOpacity: UNIVERSAL_ACTUAL_SERIES.strokeOpacity,
    fillOpacity: UNIVERSAL_ACTUAL_SERIES.fillOpacity,
    dot: createUniversalDotRenderer({
      size: UNIVERSAL_ACTUAL_SERIES.dotSize,
      fillOpacity: UNIVERSAL_ACTUAL_SERIES.dotFillOpacity,
      getColor: (payload: any) =>
        payload?.isPending ? '#ff6d01' : product.color,
    }),
    activeDot: createUniversalDotRenderer({
      isActive: true,
      size: UNIVERSAL_ACTUAL_SERIES.activeDotSize,
      fillOpacity: UNIVERSAL_ACTUAL_SERIES.dotFillOpacity,
      getColor: (payload: any) =>
        payload?.isPending ? '#ff6d01' : product.color,
    }),
  }));

  const targetAreas = targetLines.map((line) => ({
    ...line,
    fill: UNIVERSAL_TARGET_SERIES.fill,
    fillOpacity: UNIVERSAL_TARGET_SERIES.fillOpacity,
  }));

  const bars = PRODUCTS.map((product) => ({
    dataKey: product.realKey,
    name: product.name,
    color: product.color,
    barSize: BAR_SIZE,
    shape: <VerticalMD3Bar />,
    getColor: (entry: any) => entry?.isPending ? '#ff6d01' : product.color,
  }));

  const radarSeries = PRODUCTS.flatMap((product) => [
    {
      name: `Meta ${product.name}`,
      dataKey: product.planKey,
      color: product.color,
      stroke: product.color,
      fill: product.color,
      ...UNIVERSAL_RADAR_SERIES.target,
    },
    {
      name: product.name,
      dataKey: product.realKey,
      color: product.color,
      stroke: product.color,
      fill: product.color,
      ...UNIVERSAL_RADAR_SERIES.series,
    },
  ]);

  return (
    <ChartCard
      comparisonKey
      subtitle="Distribución mensual de originación por producto financiero."
      title="Mezcla de portafolio financiero"
      contentIcon={PieChart}
      viewType={viewType}
      accentColor={carteraColor}
      kpiValue={mainValue}
      onChartTypeChange={handleChartTypeChange}
    >
      {(() => {
        if (viewType === 'bar') {
          return (
            <PortfolioComposedPlot
              data={chartData}
              series={LEGEND_SERIES}
              margin={UNIVERSAL_CHART_LAYOUT.margin}
              barGap={BAR_GAP}
              barCategoryGap={BAR_CATEGORY_GAP}
              grid={<UniversalCartesianGrid />}
              tooltip={tooltipElement('bar')}
              xAxis={
                <UniversalXAxis
                  dataKey="mes"
                  height={UNIVERSAL_CHART_LAYOUT.xAxisHeight}
                  interval={0}
                  tick={<ProductTick data={chartData} accentColor={carteraColor} />}
                />
              }
              yAxis={<UniversalYAxis tickFormatter={formatNumber} />}
              lines={targetLines}
              bars={bars}
            />
          );
        }

        if (viewType === 'line') {
          return (
            <PortfolioLinePlot
              data={chartData}
              series={LEGEND_SERIES}
              margin={UNIVERSAL_CHART_LAYOUT.margin}
              grid={<UniversalCartesianGrid />}
              tooltip={tooltipElement('line')}
              xAxis={
                <UniversalXAxis
                  dataKey="mes"
                  height={UNIVERSAL_CHART_LAYOUT.xAxisHeight}
                  interval={0}
                  tick={<ProductTick data={chartData} accentColor={carteraColor} />}
                />
              }
              yAxis={<UniversalYAxis tickFormatter={formatNumber} />}
              lines={[...targetLines, ...realLines]}
            />
          );
        }

        if (viewType === 'area') {
          return (
            <PortfolioAreaPlot
              data={chartData}
              series={LEGEND_SERIES}
              margin={UNIVERSAL_CHART_LAYOUT.margin}
              grid={<UniversalCartesianGrid />}
              tooltip={tooltipElement('area')}
              xAxis={
                <UniversalXAxis
                  dataKey="mes"
                  height={UNIVERSAL_CHART_LAYOUT.xAxisHeight}
                  interval={0}
                  tick={<ProductTick data={chartData} accentColor={carteraColor} />}
                />
              }
              yAxis={<UniversalYAxis tickFormatter={formatNumber} />}
              areas={[...targetAreas, ...realAreas]}
            />
          );
        }

        if (viewType === 'radar') {
          return (
            <PortfolioRadarPlot
              data={chartData}
              series={LEGEND_SERIES}
              radarSeries={radarSeries}
              margin={UNIVERSAL_CHART_LAYOUT.polarMargin}
              polarMargin={UNIVERSAL_CHART_LAYOUT.polarMargin}
              outerRadius={UNIVERSAL_CHART_LAYOUT.outerRadius}
              polarAngleAxis={
                <UniversalPolarAngleAxis
                  dataKey="mes"
                  tick={
                    <ProductTick
                      data={chartData}
                      polar
                      accentColor={carteraColor}
                    />
                  }
                />
              }
              polarRadiusAxis={
                <UniversalPolarRadiusAxis
                  angle={90}
                  domain={[0, 'auto']}
                  tickFormatter={formatNumber}
                />
              }
              tooltip={tooltipElement('radar')}
            />
          );
        }

        return null;
      })()}
    </ChartCard>
  );
}
