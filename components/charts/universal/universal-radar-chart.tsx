import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  ResponsiveContainer,
} from 'recharts';
import type {
  UniversalChartMargin,
  UniversalRadarSeriesConfig,
  UniversalAnimationConfig,
} from './universal-chart-types';
import { getUniversalAnimationProps } from './universal-chart-animations';
import { UniversalPolarRadiusAxis } from './universal-chart-axis';
import { UNIVERSAL_POLAR_GRID } from './universal-chart-config';
import { renderUniversalSquareDot } from './universal-chart-dots';

export { UNIVERSAL_POLAR_GRID };

export function UniversalPolarGrid(props: React.ComponentProps<typeof PolarGrid>) {
  return <PolarGrid {...UNIVERSAL_POLAR_GRID} {...props} />;
}

UniversalPolarGrid.displayName = 'PolarGrid';

export interface UniversalRadarChartProps<T = any> {
  data: T[];
  cx?: string | number;
  cy?: string | number;
  outerRadius?: string | number;
  margin?: UniversalChartMargin;
  polarGrid?: React.ReactNode;
  polarAngleAxis?: React.ReactNode;
  polarRadiusAxis?: React.ReactNode;
  tooltip?: React.ReactNode;
  series?: UniversalRadarSeriesConfig[];
  animation?: UniversalAnimationConfig;
  children?: React.ReactNode;
  responsive?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
}

const UniversalRadarChartInner = React.forwardRef<any, UniversalRadarChartProps>((props, ref) => {
  const {
    data,
    cx = '50%',
    cy = '50%',
    outerRadius = '65%',
    margin = { top: 20, right: 40, bottom: 20, left: 40 },
    polarGrid = <PolarGrid {...UNIVERSAL_POLAR_GRID} />,
    polarAngleAxis,
    polarRadiusAxis = <UniversalPolarRadiusAxis />,
    tooltip,
    series,
    animation,
    children,
    width,
    height,
    className,
  } = props;

  let finalOuterRadius: string | number = outerRadius;

  if (typeof width === 'number' && typeof height === 'number') {
    // Calculamos el radio real disponible
    const maxRadius = Math.min(
      width - (margin.left || 0) - (margin.right || 0),
      height - (margin.top || 0) - (margin.bottom || 0)
    ) / 2;

    let baseRadius = maxRadius;
    if (typeof outerRadius === 'string' && outerRadius.endsWith('%')) {
      baseRadius = maxRadius * (parseFloat(outerRadius) / 100);
    } else if (typeof outerRadius === 'number') {
      baseRadius = outerRadius;
    }

    // Margen geométrico: active dot (7.5) / 2 + stroke (aprox 2) + padding de seguridad (1)
    const geometricMargin = 3.75 + 2 + 1;
    finalOuterRadius = Math.max(0, baseRadius - geometricMargin);
  }

  return (
    <RadarChart
      cx={cx}
      cy={cy}
      outerRadius={finalOuterRadius}
      margin={margin}
      data={data}
      width={typeof width === 'number' ? width : undefined}
      height={typeof height === 'number' ? height : undefined}
      className={className}
      ref={ref}
    >
      {polarGrid}
      {polarAngleAxis}
      {polarRadiusAxis}
      {tooltip}
      {series?.map((item) => {
        const animProps = getUniversalAnimationProps(item.animation ?? animation);
        const seriesColor = item.stroke || item.color || item.fill || '#833177';
        return (
          <Radar
            key={item.dataKey}
            name={item.name}
            dataKey={item.dataKey}
            stroke={item.stroke || item.color}
            strokeOpacity={item.strokeOpacity}
            fill={item.fill || item.color}
            fillOpacity={item.fillOpacity}
            dot={false}
            activeDot={(dotProps: any) => {
              const pending = dotProps?.payload?.isPending === true;
              return (
                <g>
                  {renderUniversalSquareDot(dotProps, {
                    isActive: true,
                    fillOpacity: pending ? 1 : (item.strokeOpacity ?? 1),
                    getColor: () => pending ? '#ff6d01' : (item.getColor?.(dotProps.payload) ?? seriesColor),
                  })}
                </g>
              );
            }}
            {...animProps}
          />
        );
      })}
      {children}
    </RadarChart>
  );
});

UniversalRadarChartInner.displayName = 'UniversalRadarChartInner';

export function UniversalRadarChart<T = any>(props: UniversalRadarChartProps<T>) {
  if (props.responsive && props.width === undefined) {
    return (
      <ResponsiveContainer width="100%" height={props.height ?? 300} className={props.className}>
        <UniversalRadarChartInner {...props} />
      </ResponsiveContainer>
    );
  }

  return <UniversalRadarChartInner {...props} />;
}
