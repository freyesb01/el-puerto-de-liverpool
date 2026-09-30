import React from 'react';
import {
  LineChart,
  Line,
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

export interface UniversalLineChartProps<T = any> {
  data: T[];
  margin?: UniversalChartMargin;
  defs?: React.ReactNode;
  grid?: React.ReactNode;
  tooltip?: React.ReactNode;
  xAxis?: React.ReactNode;
  yAxis?: React.ReactNode;
  legend?: React.ReactNode;
  lines?: UniversalSeriesConfig<T>[];
  animation?: UniversalAnimationConfig;
  children?: React.ReactNode;
  responsive?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function UniversalLineChart<T = any>({
  data,
  margin = { top: 20, right: 30, left: 10, bottom: 20 },
  defs,
  grid = <UniversalCartesianGrid />,
  tooltip,
  xAxis = <UniversalXAxis />,
  yAxis = <UniversalYAxis />,
  legend,
  lines,
  animation,
  children,
  responsive = false,
  width,
  height,
  className,
}: UniversalLineChartProps<T>) {
  const offsetRef = React.useRef<any>(null);

  if (responsive && width === undefined) {
    return (
      <ResponsiveContainer width="100%" height={height ?? 300} className={className}>
        <LineChart
          data={data}
          margin={margin}
          className={className}
        >
          <Customized component={({ offset }: any) => { offsetRef.current = offset; return null; }} />
          {defs && <defs>{defs}</defs>}
          {grid}
          {legend}
          {tooltip}
          {xAxis}
          {yAxis}
          {lines?.map((lineConfig) => {
            const animProps = getUniversalAnimationProps(lineConfig.animation ?? animation);
            const injectOffset = (dotFn: any) => {
              if (typeof dotFn === 'function') {
                return (props: any) => dotFn({ ...props, _injectedOffsetRef: offsetRef });
              }
              return dotFn;
            };
            return (
              <Line
                key={lineConfig.dataKey}
                type={lineConfig.type ?? 'monotone'}
                dataKey={lineConfig.dataKey}
                name={lineConfig.name}
                stroke={lineConfig.stroke || (lineConfig.gradientId ? `url(#${lineConfig.gradientId})` : lineConfig.color)}
                strokeWidth={lineConfig.strokeWidth ?? DEFAULT_LINE_STROKE_WIDTH}
                strokeOpacity={lineConfig.strokeOpacity}
                dot={injectOffset(lineConfig.dot)}
                activeDot={injectOffset(lineConfig.activeDot)}
                {...animProps}
              />
            );
          })}
          {children}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <LineChart
      data={data}
      margin={margin}
      width={typeof width === 'number' ? width : undefined}
      height={typeof height === 'number' ? height : undefined}
      className={className}
    >
      <Customized component={({ offset }: any) => { offsetRef.current = offset; return null; }} />
      {defs && <defs>{defs}</defs>}
      {grid}
      {legend}
      {tooltip}
      {xAxis}
      {yAxis}
      {lines?.map((lineConfig) => {
        const animProps = getUniversalAnimationProps(lineConfig.animation ?? animation);
        const injectOffset = (dotFn: any) => {
          if (typeof dotFn === 'function') {
            return (props: any) => dotFn({ ...props, _injectedOffsetRef: offsetRef });
          }
          return dotFn;
        };
        return (
          <Line
            key={lineConfig.dataKey}
            type={lineConfig.type ?? 'monotone'}
            dataKey={lineConfig.dataKey}
            name={lineConfig.name}
            stroke={lineConfig.stroke || (lineConfig.gradientId ? `url(#${lineConfig.gradientId})` : lineConfig.color)}
            strokeWidth={lineConfig.strokeWidth ?? DEFAULT_LINE_STROKE_WIDTH}
            strokeOpacity={lineConfig.strokeOpacity}
            dot={injectOffset(lineConfig.dot)}
            activeDot={injectOffset(lineConfig.activeDot)}
            {...animProps}
          />
        );
      })}
      {children}
    </LineChart>
  );
}
