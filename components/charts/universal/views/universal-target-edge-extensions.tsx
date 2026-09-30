'use client';

import React from 'react';
import { renderUniversalSquareDot } from '../universal-chart-dots';
import type { UniversalDotProps } from '../universal-chart-types';

interface UniversalTargetDotRendererOptions {
  dataLength: number;
  color: string;
  size: number;
  fillOpacity: number;
  strokeWidth: number;
  strokeOpacity: number;
  active?: boolean;
  extendEdges?: boolean;
}

export function createUniversalTargetDotRenderer({
  dataLength,
  color,
  size,
  fillOpacity,
  strokeWidth,
  strokeOpacity,
  active = false,
  extendEdges = false,
}: UniversalTargetDotRendererOptions) {
  return (
    props: UniversalDotProps & {
      _injectedOffsetRef?: React.MutableRefObject<any>;
    },
  ) => {
    const pending = props.payload?.isPending === true;
    const dot = renderUniversalSquareDot(props, {
      size,
      isActive: active,
      fillOpacity: pending ? 1 : fillOpacity,
      getColor: () => (pending ? '#ff6d01' : color),
      offsetRef: props._injectedOffsetRef,
    });

    if (!extendEdges) return dot;

    const { cx, cy, index } = props;
    const offset = props._injectedOffsetRef?.current;

    if (
      typeof cx !== 'number' ||
      typeof cy !== 'number' ||
      !offset ||
      typeof offset.left !== 'number' ||
      typeof offset.width !== 'number'
    ) {
      return dot;
    }

    const isFirst = index === 0;
    const isLast = index === dataLength - 1;

    if (!isFirst && !isLast) return dot;

    return (
      <g
        key={`target-dot-${props.dataKey ?? props.name ?? 'series'}-${index ?? cx}`}
        pointerEvents="none"
        aria-hidden="true"
      >
        {isFirst && (
          <line
            x1={offset.left}
            y1={cy}
            x2={cx}
            y2={cy}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeOpacity={strokeOpacity}
          />
        )}
        {isLast && (
          <line
            x1={cx}
            y1={cy}
            x2={offset.left + offset.width}
            y2={cy}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeOpacity={strokeOpacity}
          />
        )}
        {dot}
      </g>
    );
  };
}
