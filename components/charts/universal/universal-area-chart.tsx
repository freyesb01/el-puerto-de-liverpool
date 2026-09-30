import React from 'react';
import {
  AreaChart,
  Area,
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

export interface UniversalAreaChartProps<T = any> {
  data: T[];
  margin?: UniversalChartMargin;
  defs?: React.ReactNode;
  grid?: React.ReactNode;
  tooltip?: React.ReactNode;
  xAxis?: React.ReactNode;
  yAxis?: React.ReactNode;
  legend?: React.ReactNode;
  areas?: UniversalSeriesConfig<T>[];
  animation?: UniversalAnimationConfig;
  children?: React.ReactNode;
  responsive?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export function UniversalAreaChart<T = any>({
  data,
  margin = { top: 20, right: 30, left: 10, bottom: 20 },
  defs,
  grid = <UniversalCartesianGrid />,
  tooltip,
  xAxis = <UniversalXAxis />,
  yAxis = <UniversalYAxis />,
  legend,
  areas,
  animation,
  children,
  responsive = false,
  width,
  height,
  className,
}: UniversalAreaChartProps<T>) {
  const offsetRef = React.useRef<any>(null);

  if (responsive && width === undefined) {
    return (
      <ResponsiveContainer width="100%" height={height ?? 300} className={className}>
        <AreaChart
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
          {areas?.map((areaConfig) => {
            const animProps = getUniversalAnimationProps(areaConfig.animation ?? animation);
            const injectOffset = (dotFn: any) => {
              if (typeof dotFn === 'function') {
                return (props: any) => dotFn({ ...props, _injectedOffsetRef: offsetRef });
              }
              return dotFn;
            };
            return (
              <Area
                key={areaConfig.dataKey}
                type={areaConfig.type ?? 'monotone'}
                dataKey={areaConfig.dataKey}
                name={areaConfig.name}
                fill={areaConfig.fill || areaConfig.color}
                stroke={areaConfig.stroke || areaConfig.color}
                strokeWidth={areaConfig.strokeWidth ?? DEFAULT_LINE_STROKE_WIDTH}
                strokeOpacity={areaConfig.strokeOpacity}
                fillOpacity={areaConfig.fillOpacity}
                dot={injectOffset(areaConfig.dot)}
                activeDot={injectOffset(areaConfig.activeDot)}
                {...animProps}
              />
            );
          })}
          {children}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <AreaChart
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
      {areas?.map((areaConfig) => {
        const animProps = getUniversalAnimationProps(areaConfig.animation ?? animation);
        const injectOffset = (dotFn: any) => {
          if (typeof dotFn === 'function') {
            return (props: any) => dotFn({ ...props, _injectedOffsetRef: offsetRef });
          }
          return dotFn;
        };
        return (
          <Area
            key={areaConfig.dataKey}
            type={areaConfig.type ?? 'monotone'}
            dataKey={areaConfig.dataKey}
            name={areaConfig.name}
            fill={areaConfig.fill || areaConfig.color}
            stroke={areaConfig.stroke || areaConfig.color}
            strokeWidth={areaConfig.strokeWidth ?? DEFAULT_LINE_STROKE_WIDTH}
            strokeOpacity={areaConfig.strokeOpacity}
            fillOpacity={areaConfig.fillOpacity}
            dot={injectOffset(areaConfig.dot)}
            activeDot={injectOffset(areaConfig.activeDot)}
            {...animProps}
          />
        );
      })}
      {children}
    </AreaChart>
  );
}
