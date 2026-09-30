import React from 'react';

export type UniversalChartViewType = 'composed' | 'radar' | 'line' | 'area' | 'scatter';

export type UniversalSeriesVariant = 'solid' | 'subtle';

export interface UniversalAnimationConfig {
  isAnimationActive?: boolean;
  animationBegin?: number;
  animationDuration?: number;
  animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}

export interface UniversalChartMargin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface UniversalDotProps {
  cx?: number;
  cy?: number;
  payload?: any;
  dataKey?: string;
  name?: string;
  key?: string | number;
  index?: number;
  [key: string]: any;
}

export interface UniversalCursorProps<T = any> {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  points?: Array<{ x: number; y: number }>;
  cx?: number;
  cy?: number;
  startAngle?: number;
  endAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  payload?: any[];
  activePayload?: any[];
  payloadIndex?: number;
  activeTooltipIndex?: number;
  activeLabel?: string;
  label?: string;
  coordinate?: { x: number; y: number };
  offset?: { top: number; left: number; width: number; height: number };
  data?: T[];
  className?: string;
  chartType?: UniversalChartViewType;
  layout?: string;
  getDatumColor?: (datum: T) => string;
  opacity?: number;
  totalCount?: number;
}

export interface UniversalXAxisConfig {
  dataKey?: string;
  type?: 'category' | 'number';
  allowDuplicatedCategory?: boolean;
  interval?: number | 'preserveStart' | 'preserveEnd' | 'preserveStartEnd';
  height?: number;
  tickLine?: boolean;
  axisLine?: boolean;
  tick?: React.ReactElement | ((props: any) => React.ReactNode);
}

export interface UniversalYAxisConfig {
  width?: number;
  tickMargin?: number;
  tickLine?: boolean;
  axisLine?: boolean;
  tick?: React.ReactElement | Record<string, any>;
  domain?: [number | string, number | string];
}

export interface UniversalSeriesConfig<T = any> {
  dataKey: string;
  name?: string;
  variant?: UniversalSeriesVariant;
  color?: string;
  stroke?: string;
  fill?: string;
  getColor?: (datum: T, index?: number) => string;
  strokeWidth?: number;
  strokeOpacity?: number;
  fillOpacity?: number;
  dot?: any;
  activeDot?: any;
  barSize?: number;
  shape?: any;
  activeShape?: any;
  gradientId?: string;
  type?: 'monotone' | 'linear' | 'natural' | 'step';
  animation?: UniversalAnimationConfig;
  background?: any;
  cells?: (datum: T, index: number) => React.ReactNode;
}

export interface UniversalBaseChartProps {
  width?: number | string;
  height?: number | string;
  responsive?: boolean;
  className?: string;
  legend?: React.ReactNode;
}

export interface UniversalRadarSeriesConfig {
  dataKey: string;
  name?: string;
  color?: string;
  stroke?: string;
  fill?: string;
  strokeOpacity?: number;
  fillOpacity?: number;
  /** Individual active point color, separate from the polygon/legend color. */
  getColor?: (datum: any) => string;
  animation?: UniversalAnimationConfig;
}

export interface UniversalScatterSeriesConfig<T = any> {
  dataKey: string;
  name?: string;
  color?: string;
  shape?: any;
  activeShape?: any;
  animation?: UniversalAnimationConfig;
}
