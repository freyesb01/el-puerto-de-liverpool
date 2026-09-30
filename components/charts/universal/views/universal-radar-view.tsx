'use client';

import React from 'react';
import type { UniversalChartMargin } from '../universal-chart-types';
import { UNIVERSAL_RADAR_SERIES } from '../universal-chart-config';
import { getUniversalDatumColor, getUniversalSeriesColor } from '../universal-chart-colors';
import {
  UniversalRadarChart,
  UniversalPolarAngleAxis,
  UniversalPolarRadiusAxis,
  UniversalChartTooltip,
  UniversalChartCursor,
  UNIVERSAL_CHART_LAYOUT,
  UniversalCategoryTick,
} from '..';

interface UniversalRadarViewTarget {
  dataKey: string;
  name: string;
  color?: string;
}

interface UniversalRadarViewActual {
  dataKey: string;
  name: string;
  color?: string;
}

interface UniversalRadarViewSeries {
  dataKey: string;
  name: string;
  color: string;
}

export interface UniversalRadarViewProps {
  data: any[];
  categoryKey: string;
  target?: UniversalRadarViewTarget;
  actual?: UniversalRadarViewActual;
  series?: UniversalRadarViewSeries[];
  valueFormatter: (val: number) => string;
  colorResolver: (actual: number, target: number) => string;
  accentColor?: string;
  tooltipContent?: any;
  customPolarTick?: (props: any) => any;
  secondaryValueKey?: string;
  secondaryValueAccessor?: (datum: any) => React.ReactNode;
  secondaryColorAccessor?: (datum: any) => string;
  outerRadius?: string | number;
  polarMargin?: UniversalChartMargin;
  polarRadiusAxisDomain?: any;
  polarRadiusAxisTickFormatter?: (val: number) => string;
  width?: number;
  height?: number;
}

const RADAR_CONTRACT = UNIVERSAL_RADAR_SERIES;

function makeDefaultPolarTick(
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
        polar
        label={categoryValue}
        secondary={secondary}
        color={color}
      />
    );
  };
}

export function UniversalRadarView({
  data,
  categoryKey,
  target,
  actual,
  series,
  valueFormatter,
  colorResolver,
  accentColor,
  tooltipContent,
  customPolarTick,
  secondaryValueKey,
  secondaryValueAccessor,
  secondaryColorAccessor,
  outerRadius = UNIVERSAL_CHART_LAYOUT.outerRadius,
  polarMargin = UNIVERSAL_CHART_LAYOUT.polarMargin,
  polarRadiusAxisDomain = [0, 'auto'],
  polarRadiusAxisTickFormatter,
  width,
  height,
}: UniversalRadarViewProps) {
  const hasSeries = Boolean(series?.length);
  const radarSeries: any[] = [];

  if (target) {
    const targetColor = getUniversalSeriesColor(target, accentColor);

    radarSeries.push({
      name: target.name,
      dataKey: target.dataKey,
      stroke: targetColor,
      fill: targetColor,
      strokeOpacity: RADAR_CONTRACT.target.strokeOpacity,
      fillOpacity: RADAR_CONTRACT.target.fillOpacity,
    });
  }

  if (hasSeries) {
    series!.forEach((item) => {
      radarSeries.push({
        name: item.name,
        dataKey: item.dataKey,
        stroke: item.color,
        fill: item.color,
        strokeOpacity: RADAR_CONTRACT.series.strokeOpacity,
        fillOpacity: RADAR_CONTRACT.series.fillOpacity,
      });
    });
  } else if (actual) {
    const actualColor = getUniversalSeriesColor(actual, accentColor);

    radarSeries.push({
      name: actual.name,
      dataKey: actual.dataKey,
      stroke: actualColor,
      fill: actualColor,
      strokeOpacity: RADAR_CONTRACT.actual.strokeOpacity,
      fillOpacity: RADAR_CONTRACT.actual.fillOpacity,
      getColor: (datum: any) => getUniversalDatumColor(datum, colorResolver(
        datum?.[actual.dataKey] ?? 0,
        target ? datum?.[target.dataKey] ?? 100 : 100,
      )),
    });
  }

  const defaultTick = makeDefaultPolarTick(
    data,
    categoryKey,
    secondaryValueKey,
    secondaryValueAccessor,
    secondaryColorAccessor,
  );
  const polarTick = (props: any) =>
    customPolarTick ? customPolarTick({ ...props, data }) : defaultTick(props);

  const tooltip = (
    <UniversalChartTooltip
      content={tooltipContent ?? undefined}
      cursor={
        <UniversalChartCursor
          data={data}
          chartType="radar"
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
    <UniversalRadarChart
      cx="50%"
      cy="50%"
      outerRadius={outerRadius}
      margin={polarMargin}
      data={data}
      polarAngleAxis={
        <UniversalPolarAngleAxis
          dataKey={categoryKey}
          tick={polarTick}
        />
      }
      polarRadiusAxis={
        <UniversalPolarRadiusAxis
          angle={90}
          domain={polarRadiusAxisDomain}
          tickFormatter={polarRadiusAxisTickFormatter ?? valueFormatter}
        />
      }
      tooltip={tooltip}
      series={radarSeries}
      width={width}
      height={height}
    />
  );
}
