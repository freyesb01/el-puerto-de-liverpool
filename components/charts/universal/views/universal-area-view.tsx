'use client';

import React from 'react';
import type { UniversalChartMargin } from '../universal-chart-types';
import { getUniversalDatumColor, getUniversalSeriesColor } from '../universal-chart-colors';
import {
  UniversalAreaChart,
  UniversalCartesianGrid,
  UniversalXAxis,
  UniversalYAxis,
  UniversalChartTooltip,
  UniversalChartCursor,
  UNIVERSAL_CHART_LAYOUT,
  UNIVERSAL_TARGET_SERIES,
  UNIVERSAL_ACTUAL_SERIES,
  createUniversalDotRenderer,
  UniversalCategoryTick,
} from '..';
import { createUniversalTargetDotRenderer } from './universal-target-edge-extensions';

interface UniversalAreaViewTarget {
  dataKey: string;
  name: string;
  color?: string;
}

interface UniversalAreaViewActual {
  dataKey: string;
  name: string;
  color?: string;
}

interface UniversalAreaViewSeries {
  dataKey: string;
  name: string;
  color: string;
}

export interface UniversalAreaViewProps {
  data: any[];
  categoryKey: string;
  target?: UniversalAreaViewTarget;
  actual?: UniversalAreaViewActual;
  series?: UniversalAreaViewSeries[];
  valueFormatter: (val: number) => string;
  colorResolver: (actual: number, target: number) => string;
  accentColor?: string;
  tooltipContent?: any;
  customXAxisTick?: (props: any) => any;
  secondaryValueKey?: string;
  secondaryValueAccessor?: (datum: any) => React.ReactNode;
  secondaryColorAccessor?: (datum: any) => string;
  yAxisDomain?: any;
  yAxisTickFormatter?: (val: number) => string;
  xAxisHeight?: number;
  margin?: UniversalChartMargin;
  width?: number;
  height?: number;
}

const AREA_CONTRACT = {
  target: UNIVERSAL_TARGET_SERIES,
  actual: UNIVERSAL_ACTUAL_SERIES,
  series: UNIVERSAL_ACTUAL_SERIES,
} as const;

function makeDefaultTick(
  data: any[],
  categoryKey: string,
  secondaryValueKey?: string,
  secondaryValueAccessor?: (datum: any) => React.ReactNode,
  secondaryColorAccessor?: (datum: any) => string,
) {
  return (props: any) => {
    const categoryValue = props.payload?.value ?? '';
    const item = data.find((datum) => datum?.[categoryKey] === categoryValue);
    const secondary = item
      ? secondaryValueAccessor?.(item) ?? (secondaryValueKey ? item[secondaryValueKey] ?? '-' : undefined)
      : undefined;
    const color = getUniversalDatumColor(item,
      item && secondaryColorAccessor ? secondaryColorAccessor(item) : '#49454F');

    return (
      <UniversalCategoryTick
        {...props}
        polar={false}
        label={categoryValue}
        secondary={secondary}
        color={color}
      />
    );
  };
}

export function UniversalAreaView({
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
  width,
  height,
}: UniversalAreaViewProps) {
  const hasSeries = Boolean(series?.length);
  const targetColor = getUniversalSeriesColor(target, accentColor);
  const areas: any[] = [];

  if (target) {
    areas.push({
      type: 'monotone' as const,
      dataKey: target.dataKey,
      name: target.name,
      stroke: targetColor,
      fill: AREA_CONTRACT.target.fill,
      strokeWidth: AREA_CONTRACT.target.strokeWidth,
      strokeOpacity: AREA_CONTRACT.target.strokeOpacity,
      fillOpacity: AREA_CONTRACT.target.fillOpacity,
      dot: createUniversalTargetDotRenderer({
        dataLength: data.length,
        color: targetColor,
        size: AREA_CONTRACT.target.dotSize,
        fillOpacity: AREA_CONTRACT.target.dotFillOpacity,
        strokeWidth: AREA_CONTRACT.target.strokeWidth,
        strokeOpacity: AREA_CONTRACT.target.strokeOpacity,
        extendEdges: true,
      }),
      activeDot: createUniversalTargetDotRenderer({
        dataLength: data.length,
        color: targetColor,
        size: AREA_CONTRACT.target.activeDotSize,
        fillOpacity: AREA_CONTRACT.target.dotFillOpacity,
        strokeWidth: AREA_CONTRACT.target.strokeWidth,
        strokeOpacity: AREA_CONTRACT.target.strokeOpacity,
        active: true,
      }),
      animation: { isAnimationActive: UNIVERSAL_TARGET_SERIES.isAnimationActive },
    });
  }

  if (hasSeries) {
    series!.forEach((item) => {
      areas.push({
        type: 'monotone' as const,
        dataKey: item.dataKey,
        name: item.name,
        stroke: item.color,
        fill: item.color,
        strokeWidth: AREA_CONTRACT.series.strokeWidth,
        strokeOpacity: AREA_CONTRACT.series.strokeOpacity,
        fillOpacity: AREA_CONTRACT.series.fillOpacity,
        dot: createUniversalDotRenderer({
          size: AREA_CONTRACT.series.dotSize,
          fillOpacity: AREA_CONTRACT.series.dotFillOpacity,
          getColor: () => item.color,
        }),
        activeDot: createUniversalDotRenderer({
          isActive: true,
          size: AREA_CONTRACT.series.activeDotSize,
          fillOpacity: AREA_CONTRACT.series.dotFillOpacity,
          getColor: () => item.color,
        }),
      });
    });
  } else if (actual) {
    const actualColor = getUniversalSeriesColor(actual, accentColor);

    areas.push({
      type: 'monotone' as const,
      dataKey: actual.dataKey,
      name: actual.name,
      stroke: actualColor,
      fill: actualColor,
      strokeWidth: AREA_CONTRACT.actual.strokeWidth,
      strokeOpacity: AREA_CONTRACT.actual.strokeOpacity,
      fillOpacity: AREA_CONTRACT.actual.fillOpacity,
      dot: createUniversalDotRenderer({
        size: AREA_CONTRACT.actual.dotSize,
        fillOpacity: AREA_CONTRACT.actual.dotFillOpacity,
        getColor: (payload: any) => {
          const actualValue = payload?.[actual.dataKey] ?? 0;
          const targetValue = target ? payload?.[target.dataKey] ?? 100 : 100;
          return colorResolver(actualValue, targetValue);
        },
      }),
      activeDot: createUniversalDotRenderer({
        isActive: true,
        size: AREA_CONTRACT.actual.activeDotSize,
        fillOpacity: AREA_CONTRACT.actual.dotFillOpacity,
        getColor: (payload: any) => {
          const actualValue = payload?.[actual.dataKey] ?? 0;
          const targetValue = target ? payload?.[target.dataKey] ?? 100 : 100;
          return colorResolver(actualValue, targetValue);
        },
      }),
    });
  }

  const defaultTick = makeDefaultTick(
    data,
    categoryKey,
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
          chartType="area"
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
    <UniversalAreaChart
      data={data}
      margin={margin}
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
      areas={areas}
      width={width}
      height={height}
    />
  );
}
