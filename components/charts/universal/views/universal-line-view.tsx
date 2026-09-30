'use client';

import React from 'react';
import type { UniversalChartMargin } from '../universal-chart-types';
import { getUniversalDatumColor, getUniversalSeriesColor } from '../universal-chart-colors';
import {
  UniversalLineChart,
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

interface UniversalLineViewTarget {
  dataKey: string;
  name: string;
  color?: string;
}

interface UniversalLineViewActual {
  dataKey: string;
  name: string;
  color?: string;
}

interface UniversalLineViewSeries {
  dataKey: string;
  name: string;
  color: string;
}

export interface UniversalLineViewProps {
  data: any[];
  categoryKey: string;
  target?: UniversalLineViewTarget;
  actual?: UniversalLineViewActual;
  series?: UniversalLineViewSeries[];
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

const LINE_CONTRACT = {
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

export function UniversalLineView({
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
}: UniversalLineViewProps) {
  const hasSeries = Boolean(series?.length);
  const targetColor = getUniversalSeriesColor(target, accentColor);
  const lines: any[] = [];

  if (target) {
    lines.push({
      type: 'monotone' as const,
      dataKey: target.dataKey,
      name: target.name,
      stroke: targetColor,
      strokeWidth: LINE_CONTRACT.target.strokeWidth,
      strokeOpacity: LINE_CONTRACT.target.strokeOpacity,
      dot: createUniversalTargetDotRenderer({
        dataLength: data.length,
        color: targetColor,
        size: LINE_CONTRACT.target.dotSize,
        fillOpacity: LINE_CONTRACT.target.dotFillOpacity,
        strokeWidth: LINE_CONTRACT.target.strokeWidth,
        strokeOpacity: LINE_CONTRACT.target.strokeOpacity,
        extendEdges: true,
      }),
      activeDot: createUniversalTargetDotRenderer({
        dataLength: data.length,
        color: targetColor,
        size: LINE_CONTRACT.target.activeDotSize,
        fillOpacity: LINE_CONTRACT.target.dotFillOpacity,
        strokeWidth: LINE_CONTRACT.target.strokeWidth,
        strokeOpacity: LINE_CONTRACT.target.strokeOpacity,
        active: true,
      }),
      animation: { isAnimationActive: UNIVERSAL_TARGET_SERIES.isAnimationActive },
    });
  }

  if (hasSeries) {
    series!.forEach((item) => {
      lines.push({
        type: 'monotone' as const,
        dataKey: item.dataKey,
        name: item.name,
        stroke: item.color,
        strokeWidth: LINE_CONTRACT.series.strokeWidth,
        strokeOpacity: LINE_CONTRACT.series.strokeOpacity,
        dot: createUniversalDotRenderer({
          size: LINE_CONTRACT.series.dotSize,
          fillOpacity: LINE_CONTRACT.series.dotFillOpacity,
          getColor: () => item.color,
        }),
        activeDot: createUniversalDotRenderer({
          isActive: true,
          size: LINE_CONTRACT.series.activeDotSize,
          fillOpacity: LINE_CONTRACT.series.dotFillOpacity,
          getColor: () => item.color,
        }),
      });
    });
  } else if (actual) {
    const actualColor = getUniversalSeriesColor(actual, accentColor);

    lines.push({
      type: 'monotone' as const,
      dataKey: actual.dataKey,
      name: actual.name,
      stroke: actualColor,
      strokeWidth: LINE_CONTRACT.actual.strokeWidth,
      strokeOpacity: LINE_CONTRACT.actual.strokeOpacity,
      dot: createUniversalDotRenderer({
        size: LINE_CONTRACT.actual.dotSize,
        fillOpacity: LINE_CONTRACT.actual.dotFillOpacity,
        getColor: (payload: any) => {
          const actualValue = payload?.[actual.dataKey] ?? 0;
          const targetValue = target ? payload?.[target.dataKey] ?? 100 : 100;
          return colorResolver(actualValue, targetValue);
        },
      }),
      activeDot: createUniversalDotRenderer({
        isActive: true,
        size: LINE_CONTRACT.actual.activeDotSize,
        fillOpacity: LINE_CONTRACT.actual.dotFillOpacity,
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
          chartType="line"
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
    <UniversalLineChart
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
      lines={lines}
      width={width}
      height={height}
    />
  );
}
