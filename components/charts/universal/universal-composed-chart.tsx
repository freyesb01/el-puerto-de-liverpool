'use client';

import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Cell,
  ResponsiveContainer,
  Customized,
} from 'recharts';
import type {
  UniversalChartMargin,
  UniversalSeriesConfig,
  UniversalAnimationConfig,
} from './universal-chart-types';
import { getUniversalAnimationProps } from './universal-chart-animations';
import { DEFAULT_LINE_STROKE_WIDTH } from './universal-chart-colors';
import { UniversalCartesianGrid } from './universal-cartesian-grid';
import { UniversalXAxis, UniversalYAxis } from './universal-chart-axis';

export interface UniversalComposedBarConfig<T = any> extends UniversalSeriesConfig<T> {
  shape?: any;
  cells?: (datum: T, index: number) => React.ReactNode;
  background?: any;
  stackId?: string;
}

export interface UniversalComposedChartProps<T = any> {
  data: T[];
  margin?: UniversalChartMargin;
  barGap?: number | string;
  barCategoryGap?: number | string;
  defs?: React.ReactNode;
  grid?: React.ReactNode;
  tooltip?: React.ReactNode;
  xAxis?: React.ReactNode;
  yAxis?: React.ReactNode;
  legend?: React.ReactNode;
  lines?: UniversalSeriesConfig<T>[];
  bars?: UniversalComposedBarConfig<T>[];
  animation?: UniversalAnimationConfig;
  children?: React.ReactNode;
  responsive?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function UniversalComposedChart<T = any>({
  data,
  margin = { top: 20, right: 30, left: 10, bottom: 20 },
  barGap,
  barCategoryGap,
  defs,
  grid = <UniversalCartesianGrid />,
  tooltip,
  xAxis = <UniversalXAxis />,
  yAxis = <UniversalYAxis />,
  legend,
  lines,
  bars,
  animation,
  children,
  responsive = false,
  width,
  height,
  className,
}: UniversalComposedChartProps<T>) {
  const offsetRef = React.useRef<any>(null);

  const injectOffset = (dotFn: any) => {
    if (typeof dotFn === 'function') {
      return (props: any) => dotFn({ ...props, _injectedOffsetRef: offsetRef });
    }
    return dotFn;
  };

  const renderBars = () =>
    bars?.map((barConfig) => {
      const animProps = getUniversalAnimationProps(barConfig.animation ?? animation);
      return (
        <Bar
          key={barConfig.dataKey}
          dataKey={barConfig.dataKey}
          name={barConfig.name}
          fill={barConfig.fill || barConfig.color}
          barSize={barConfig.barSize}
          shape={barConfig.shape as any}
          background={barConfig.background}
          stackId={barConfig.stackId}
          {...animProps}
        >
          {barConfig.cells
            ? data.map((entry, index) => barConfig.cells!(entry, index))
            : barConfig.getColor
              ? data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={barConfig.getColor!(entry, index)} />
                ))
              : null}
        </Bar>
      );
    });

  const renderLines = () =>
    lines?.map((lineConfig) => {
      const animProps = getUniversalAnimationProps(lineConfig.animation ?? animation);
      return (
        <Line
          key={lineConfig.dataKey}
          type={lineConfig.type ?? 'monotone'}
          dataKey={lineConfig.dataKey}
          name={lineConfig.name}
          stroke={
            lineConfig.stroke ||
            (lineConfig.gradientId ? `url(#${lineConfig.gradientId})` : lineConfig.color)
          }
          strokeWidth={lineConfig.strokeWidth ?? DEFAULT_LINE_STROKE_WIDTH}
          strokeOpacity={lineConfig.strokeOpacity}
          dot={injectOffset(lineConfig.dot)}
          activeDot={injectOffset(lineConfig.activeDot)}
          {...animProps}
        />
      );
    });

  if (responsive && width === undefined) {
    return (
      <ResponsiveContainer width="100%" height={height ?? 300} className={className}>
        <ComposedChart
          data={data}
          margin={margin}
          barGap={barGap}
          barCategoryGap={barCategoryGap}
          className={className}
        >
          <Customized
            component={({ offset }: any) => {
              offsetRef.current = offset;
              return null;
            }}
          />
          {defs && <defs>{defs}</defs>}
          {grid}
          {legend}
          {tooltip}
          {xAxis}
          {yAxis}
          {renderBars()}
          {renderLines()}
          {children}
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ComposedChart
      data={data}
      width={typeof width === 'number' ? width : undefined}
      height={typeof height === 'number' ? height : undefined}
      margin={margin}
      barGap={barGap}
      barCategoryGap={barCategoryGap}
      className={className}
    >
      <Customized
        component={({ offset }: any) => {
          offsetRef.current = offset;
          return null;
        }}
      />
      {defs && <defs>{defs}</defs>}
      {grid}
      {legend}
      {tooltip}
      {xAxis}
      {yAxis}
      {renderBars()}
      {renderLines()}
      {children}
    </ComposedChart>
  );
}
