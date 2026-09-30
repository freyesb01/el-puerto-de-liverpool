import React from 'react';

export interface UniversalChartLinearGradientProps<T = any> {
  id: string;
  data: T[];
  getColor: (datum: T, index: number) => string;
  stopOpacity?: number;
  x1?: string | number;
  y1?: string | number;
  x2?: string | number;
  y2?: string | number;
}

export function UniversalChartLinearGradient<T = any>({
  id,
  data,
  getColor,
  stopOpacity = 0.125,
  x1 = '0',
  y1 = '0',
  x2 = '1',
  y2 = '0',
}: UniversalChartLinearGradientProps<T>) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
      {data.map((entry, index) => {
        const solid = getColor(entry, index);
        const offset =
          data.length > 1 ? `${(index / (data.length - 1)) * 100}%` : '0%';
        return (
          <stop
            key={index}
            offset={offset}
            stopColor={solid}
            stopOpacity={stopOpacity}
          />
        );
      })}
      {data.length === 1 && (
        <stop
          offset="100%"
          stopColor={getColor(data[0], 0)}
          stopOpacity={stopOpacity}
        />
      )}
    </linearGradient>
  );
}
