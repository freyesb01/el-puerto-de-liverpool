import React from 'react';
import {
  ScatterChart,
  Scatter,
  ResponsiveContainer,
} from 'recharts';
import type {
  UniversalChartMargin,
  UniversalScatterSeriesConfig,
  UniversalAnimationConfig,
} from './universal-chart-types';
import { getUniversalAnimationProps } from './universal-chart-animations';
import { UniversalCartesianGrid } from './universal-cartesian-grid';
import { UniversalXAxis, UniversalYAxis } from './universal-chart-axis';

export interface UniversalScatterChartProps<T = any> {
  data: T[];
  margin?: UniversalChartMargin;
  grid?: React.ReactNode;
  tooltip?: React.ReactNode;
  xAxis?: React.ReactNode;
  yAxis?: React.ReactNode;
  series?: UniversalScatterSeriesConfig<T>[];
  animation?: UniversalAnimationConfig;
  children?: React.ReactNode;
  responsive?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function UniversalScatterChart<T = any>({
  data,
  margin = { top: 20, right: 30, left: 10, bottom: 20 },
  grid = <UniversalCartesianGrid />,
  tooltip,
  xAxis = <UniversalXAxis />,
  yAxis = <UniversalYAxis />,
  series,
  animation,
  children,
  responsive = false,
  width,
  height,
  className,
}: UniversalScatterChartProps<T>) {
  const chartElement = (
    <ScatterChart
      data={data}
      margin={margin}
      width={typeof width === 'number' ? width : undefined}
      height={typeof height === 'number' ? height : undefined}
      className={className}
    >
      {grid}
      {tooltip}
      {xAxis}
      {yAxis}
      {series?.map((item) => {
        const animProps = getUniversalAnimationProps(item.animation ?? animation);
        return (
          <Scatter
            key={item.dataKey}
            name={item.name}
            dataKey={item.dataKey}
            data={data}
            fill={item.color}
            shape={item.shape as any}
            activeShape={item.activeShape as any}
            {...animProps}
          />
        );
      })}
      {children}
    </ScatterChart>
  );

  if (responsive && width === undefined) {
    return (
      <ResponsiveContainer width="100%" height={height ?? 300} className={className}>
        {chartElement}
      </ResponsiveContainer>
    );
  }

  return chartElement;
}
