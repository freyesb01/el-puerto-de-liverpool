'use client';

import React from 'react';
import type { UniversalChartMargin } from '../universal-chart-types';
import { getUniversalDatumColor, getUniversalSeriesColor } from '../universal-chart-colors';
import { Cell } from 'recharts';
import {
  UniversalComposedChart,
  UniversalCartesianGrid,
  UniversalXAxis,
  UniversalYAxis,
  UniversalChartTooltip,
  UniversalChartCursor,
  UNIVERSAL_CHART_LAYOUT,
  VerticalMD3Bar,
  UNIVERSAL_TARGET_SERIES,
  UniversalCategoryTick,
} from '..';
import { BAR_SIZE, BAR_GAP, BAR_CATEGORY_GAP } from '@/lib/chart-config';
import { createUniversalTargetDotRenderer } from './universal-target-edge-extensions';

export interface UniversalBarViewTarget {
  dataKey: string;
  name: string;
  color?: string;
}

export interface UniversalBarViewActual {
  dataKey: string;
  name: string;
  color?: string;
  barSize?: number;
  shape?: React.ReactElement;
}

export interface UniversalBarViewSeries {
  dataKey: string;
  name: string;
  color: string;
  barSize?: number;
  shape?: React.ReactElement;
}

export interface UniversalBarViewProps {
  data: any[];
  categoryKey: string;
  target?: UniversalBarViewTarget;
  actual?: UniversalBarViewActual;
  series?: UniversalBarViewSeries[];
  valueFormatter: (val: number) => string;
  colorResolver: (actual: number, target: number) => string;
  accentColor?: string;
  tooltipContent?: any;
  customXAxisTick?: (props: any) => any;
  customPolarTick?: (props: any) => any;
  secondaryValueKey?: string;
  secondaryValueAccessor?: (datum: any) => React.ReactNode;
  secondaryColorAccessor?: (datum: any) => string;
  yAxisDomain?: any;
  yAxisTickFormatter?: (val: number) => string;
  xAxisHeight?: number;
  margin?: UniversalChartMargin;
  barGap?: number;
  barCategoryGap?: number;
  width?: number;
  height?: number;
}

const BAR_CONTRACT = {
  target: UNIVERSAL_TARGET_SERIES,
  actual: { barSize: BAR_SIZE },
  series: { barSize: BAR_SIZE },
} as const;

function findDatum(data: any[], categoryKey: string, categoryValue: unknown) {
  return data.find((datum) => datum?.[categoryKey] === categoryValue);
}

function makeDefaultTick(
  data: any[],
  categoryKey: string,
  polar: boolean,
  secondaryValueKey?: string,
  secondaryValueAccessor?: (datum: any) => React.ReactNode,
  secondaryColorAccessor?: (datum: any) => string,
) {
  return (props: any) => {
    const categoryValue = props.payload?.value ?? '';
    const item = findDatum(data, categoryKey, categoryValue);
    const secondary = item
      ? secondaryValueAccessor?.(item) ?? (secondaryValueKey ? item[secondaryValueKey] ?? '-' : undefined)
      : undefined;
    const color = getUniversalDatumColor(item,
      item && secondaryColorAccessor ? secondaryColorAccessor(item) : '#49454F');

    return (
      <UniversalCategoryTick
        {...props}
        polar={polar}
        label={categoryValue}
        secondary={secondary}
        color={color}
      />
    );
  };
}

export function UniversalBarView({
  data,
  categoryKey,
  target,
  actual,
  series,
  valueFormatter,
  colorResolver,
  accentColor,
  tooltipContent,
  customXAxisTick,
  secondaryValueKey,
  secondaryValueAccessor,
  secondaryColorAccessor,
  yAxisDomain = [0, 'auto'],
  yAxisTickFormatter,
  xAxisHeight = UNIVERSAL_CHART_LAYOUT.xAxisHeight,
  margin = UNIVERSAL_CHART_LAYOUT.margin,
  barGap = BAR_GAP,
  barCategoryGap = BAR_CATEGORY_GAP,
  width,
  height,
}: UniversalBarViewProps) {
  const hasSeries = Boolean(series?.length);

  const targetColor = getUniversalSeriesColor(target, accentColor);

  const lines = target
    ? [
        {
          type: 'monotone' as const,
          dataKey: target.dataKey,
          name: target.name,
          stroke: targetColor,
          strokeWidth: BAR_CONTRACT.target.strokeWidth,
          strokeOpacity: BAR_CONTRACT.target.strokeOpacity,
          dot: createUniversalTargetDotRenderer({
            dataLength: data.length,
            color: targetColor,
            size: BAR_CONTRACT.target.dotSize,
            fillOpacity: BAR_CONTRACT.target.dotFillOpacity,
            strokeWidth: BAR_CONTRACT.target.strokeWidth,
            strokeOpacity: BAR_CONTRACT.target.strokeOpacity,
            extendEdges: true,
          }),
          activeDot: createUniversalTargetDotRenderer({
            dataLength: data.length,
            color: targetColor,
            size: BAR_CONTRACT.target.activeDotSize,
            fillOpacity: BAR_CONTRACT.target.dotFillOpacity,
            strokeWidth: BAR_CONTRACT.target.strokeWidth,
            strokeOpacity: BAR_CONTRACT.target.strokeOpacity,
            active: true,
          }),
          animation: { isAnimationActive: UNIVERSAL_TARGET_SERIES.isAnimationActive },
        },
      ]
    : [];

  const bars: any[] = [];

  if (hasSeries) {
    series!.forEach((item, seriesIndex) => {
      bars.push({
        dataKey: item.dataKey,
        name: item.name,
        color: item.color,
        barSize: item.barSize ?? BAR_CONTRACT.series.barSize,
        shape: item.shape ?? <VerticalMD3Bar />,
        cells: (entry: any, index: number) => (
          <Cell key={`series-${seriesIndex}-cell-${index}`} fill={getUniversalDatumColor(entry, item.color)} />
        ),
      });
    });
  } else if (actual) {
    bars.push({
      dataKey: actual.dataKey,
      name: actual.name,
      color: getUniversalSeriesColor(actual, accentColor),
      barSize: actual.barSize ?? BAR_CONTRACT.actual.barSize,
      shape: actual.shape ?? <VerticalMD3Bar />,
      cells: (entry: any, index: number) => {
        const targetValue = target ? entry?.[target.dataKey] ?? 0 : 100;
        return (
          <Cell
            key={`actual-cell-${index}`}
            fill={getUniversalDatumColor(entry, colorResolver(entry?.[actual.dataKey] ?? 0, targetValue))}
          />
        );
      },
    });
  }

  const defaultTick = makeDefaultTick(
    data,
    categoryKey,
    false,
    secondaryValueKey,
    secondaryValueAccessor,
    secondaryColorAccessor,
  );
  const xAxisTick = (props: any) =>
    customXAxisTick ? customXAxisTick({ ...props, data }) : defaultTick(props);

  const tooltip = (
    <UniversalChartTooltip
      content={tooltipContent ?? undefined}
      cursor={
        <UniversalChartCursor
          data={data}
          chartType="composed"
          getDatumColor={(entry: any) => {
            if (hasSeries) return series?.[0]?.color ?? '#833177';
            const actualValue = actual ? entry?.[actual.dataKey] ?? 0 : 0;
            const targetValue = target ? entry?.[target.dataKey] ?? 100 : 100;
            return colorResolver(actualValue, targetValue);
          }}
        />
      }
    />
  );

  return (
    <UniversalComposedChart
      data={data}
      margin={margin}
      barGap={barGap}
      barCategoryGap={barCategoryGap}
      grid={<UniversalCartesianGrid />}
      tooltip={tooltip}
      xAxis={
        <UniversalXAxis
          dataKey={categoryKey}
          height={xAxisHeight}
          interval={0}
          tick={xAxisTick}
        />
      }
      yAxis={
        <UniversalYAxis
          domain={yAxisDomain}
          tickFormatter={yAxisTickFormatter ?? valueFormatter}
        />
      }
      bars={bars}
      lines={lines}
      width={width}
      height={height}
    />
  );
}
