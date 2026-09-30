'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { HorizontalMD3Bar } from '@/components/ui/horizontal-md3-bar';
import { BAR_SIZE, ROW_HEIGHT, AXIS_SPACE, BAR_GAP, BAR_CATEGORY_GAP } from '@/lib/chart-config';
import { UniversalXAxis, UniversalYAxis } from '../universal-chart-axis';
import { UniversalChartTooltip } from '../universal-chart-tooltip';
import { UniversalChartCursor } from '../universal-chart-cursor';
import {
  getUniversalDatumColor,
  getUniversalSoftColor,
  getUniversalSolidColor,
} from '../universal-chart-colors';
import {
  UNIVERSAL_HORIZONTAL_RANKING_GRID,
  UNIVERSAL_TARGET_SERIES,
} from '../universal-chart-config';

export interface UniversalHorizontalBarViewProps<T extends Record<string, any> = Record<string, any>> {
  data: T[];
  categoryKey: keyof T & string;
  targetKey: keyof T & string;
  actualKey: keyof T & string;
  targetName?: string;
  actualName?: string;
  yAxisWidth?: number;
  marginLeft?: number;
  xAxisTickFormatter?: (value: number) => string;
  tooltipContent?: React.ReactElement;
  onCategorySelect?: (datum: T) => void;
  categoryFormatter?: (value: unknown, datum?: T) => React.ReactNode;
  colorResolver?: (actual: number, target: number, datum: T) => string;
}

/**
 * Vista universal para rankings horizontales: conserva el lenguaje de barras,
 * ejes, grid, cursor, tooltip, animación y semáforo del sistema Universal.
 */
export function UniversalHorizontalBarView<T extends Record<string, any>>({
  data,
  categoryKey,
  targetKey,
  actualKey,
  targetName = 'Plan',
  actualName = 'Real',
  yAxisWidth = 160,
  marginLeft = 160,
  xAxisTickFormatter,
  tooltipContent,
  onCategorySelect,
  categoryFormatter,
  colorResolver = (actual, target) => getUniversalSolidColor(actual, target),
}: UniversalHorizontalBarViewProps<T>) {
  const chartHeight = Math.max(280, data.length * ROW_HEIGHT + AXIS_SPACE);

  const findDatum = (categoryValue: unknown) =>
    data.find((datum) => datum?.[categoryKey] === categoryValue);

  return (
    <ResponsiveContainer height={chartHeight} width="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 30, left: marginLeft, bottom: 0 }}
        barGap={BAR_GAP}
        barCategoryGap={BAR_CATEGORY_GAP}
      >
        <CartesianGrid {...UNIVERSAL_HORIZONTAL_RANKING_GRID} />
        <UniversalXAxis
          type="number"
          height={30}
          tick={{ fontSize: 10, fill: '#49454F' }}
          tickFormatter={xAxisTickFormatter}
        />
        <UniversalYAxis
          type="category"
          dataKey={categoryKey}
          width={yAxisWidth}
          interval={0}
          padding={{ top: 0, bottom: 0 }}
          tick={(props: any) => {
            const { x, y, payload } = props;
            const datum = findDatum(payload?.value);
            const label = categoryFormatter
              ? categoryFormatter(payload?.value, datum)
              : String(payload?.value ?? '');

            return (
              <g transform={`translate(${x},${y})`}>
                <text
                  x={0}
                  y={0}
                  dy={4}
                  textAnchor="end"
                  fill="#1D1B20"
                  fontSize={12.5}
                  className={onCategorySelect ? 'cursor-liverpool-pointer transition-colors' : ''}
                  onClick={() => {
                    if (datum && onCategorySelect) onCategorySelect(datum);
                  }}
                >
                  {label}
                </text>
              </g>
            );
          }}
        />
        <UniversalChartTooltip
          content={tooltipContent}
          cursor={
            <UniversalChartCursor
              data={data}
              chartType="composed"
              layout="vertical"
              getDatumColor={(datum: T) => {
                const actual = Number(datum?.[actualKey] ?? 0);
                const target = Number(datum?.[targetKey] ?? 0);
                return getUniversalDatumColor(datum, colorResolver(actual, target, datum));
              }}
            />
          }
        />
        <Bar
          dataKey={targetKey}
          name={targetName}
          barSize={BAR_SIZE}
          shape={<HorizontalMD3Bar />}
          background={{ fill: 'transparent' }}
          isAnimationActive={UNIVERSAL_TARGET_SERIES.isAnimationActive}
          animationBegin={0}
          animationDuration={1500}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => {
            const actual = Number(entry?.[actualKey] ?? 0);
            const target = Number(entry?.[targetKey] ?? 0);
            const solid = getUniversalDatumColor(entry, colorResolver(actual, target, entry));
            return <Cell key={`target-cell-${index}`} fill={getUniversalSoftColor(solid, '40')} />;
          })}
        </Bar>
        <Bar
          dataKey={actualKey}
          name={actualName}
          barSize={BAR_SIZE}
          shape={<HorizontalMD3Bar />}
          background={{ fill: 'transparent' }}
          isAnimationActive={true}
          animationBegin={0}
          animationDuration={1500}
          animationEasing="ease-out"
        >
          {data.map((entry, index) => {
            const actual = Number(entry?.[actualKey] ?? 0);
            const target = Number(entry?.[targetKey] ?? 0);
            const solid = getUniversalDatumColor(entry, colorResolver(actual, target, entry));
            return <Cell key={`actual-cell-${index}`} fill={solid} />;
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
