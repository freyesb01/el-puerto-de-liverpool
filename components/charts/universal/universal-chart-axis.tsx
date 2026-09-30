import React from 'react';
import {
  XAxis,
  YAxis,
  PolarAngleAxis,
  PolarRadiusAxis,
  type XAxisProps,
  type YAxisProps,
  type PolarAngleAxisProps,
  type PolarRadiusAxisProps,
} from 'recharts';

export const UNIVERSAL_Y_AXIS_PADDING = { top: 12 };
export const UNIVERSAL_AXIS_TICK = { fill: '#49454F', fontSize: 10 };

export interface UniversalXAxisProps extends Partial<XAxisProps> {}

export function UniversalXAxis({
  interval = 0,
  height = 60,
  tickLine = false,
  axisLine = false,
  ...rest
}: UniversalXAxisProps) {
  return (
    <XAxis
      interval={interval}
      height={height}
      tickLine={tickLine}
      axisLine={axisLine}
      {...rest}
    />
  );
}

export interface UniversalYAxisProps extends Partial<YAxisProps> {
  /** Optional padding to add visual headroom (e.g., for target lines at domain max) */
  padding?: { top?: number; bottom?: number };
}

export function UniversalYAxis({
  width = 60,
  tickMargin = 8,
  tickLine = false,
  axisLine = false,
  tick = UNIVERSAL_AXIS_TICK,
  padding = UNIVERSAL_Y_AXIS_PADDING,
  ...rest
}: UniversalYAxisProps) {
  return (
    <YAxis
      width={width}
      tickMargin={tickMargin}
      tickLine={tickLine}
      axisLine={axisLine}
      tick={tick}
      padding={padding}
      {...rest}
    />
  );
}

export interface UniversalPolarAngleAxisProps extends Partial<PolarAngleAxisProps> {}

export function UniversalPolarAngleAxis(props: UniversalPolarAngleAxisProps) {
  return <PolarAngleAxis {...(props as any)} />;
}

export interface UniversalPolarRadiusAxisProps extends Partial<PolarRadiusAxisProps> {}

export function UniversalPolarRadiusAxis({
  angle = 90,
  domain = [0, 'auto'],
  tick = UNIVERSAL_AXIS_TICK,
  ...rest
}: UniversalPolarRadiusAxisProps) {
  return <PolarRadiusAxis angle={angle} domain={domain} tick={tick} {...(rest as any)} />;
}

UniversalXAxis.displayName = 'XAxis';
(UniversalXAxis as any).defaultProps = {
  ...XAxis.defaultProps,
  interval: 0,
  height: 60,
  tickLine: false,
  axisLine: false,
};

UniversalYAxis.displayName = 'YAxis';
(UniversalYAxis as any).defaultProps = {
  ...YAxis.defaultProps,
  width: 60,
  tickMargin: 8,
  tickLine: false,
  axisLine: false,
  tick: UNIVERSAL_AXIS_TICK,
  padding: UNIVERSAL_Y_AXIS_PADDING,
};

UniversalPolarAngleAxis.displayName = 'PolarAngleAxis';
(UniversalPolarAngleAxis as any).axisType = 'angleAxis';
(UniversalPolarAngleAxis as any).defaultProps = {
  ...(PolarAngleAxis as any).defaultProps,
};

UniversalPolarRadiusAxis.displayName = 'PolarRadiusAxis';
(UniversalPolarRadiusAxis as any).axisType = 'radiusAxis';
(UniversalPolarRadiusAxis as any).defaultProps = {
  ...(PolarRadiusAxis as any).defaultProps,
  angle: 90,
  domain: [0, 'auto'],
  tick: UNIVERSAL_AXIS_TICK,
};
