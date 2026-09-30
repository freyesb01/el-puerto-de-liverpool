import React from 'react';
import type { UniversalDotProps } from './universal-chart-types';
import { getUniversalSolidColor, getUniversalDatumColor } from './universal-chart-colors';

export interface UniversalDotOptions {
  size?: number;
  xOffset?: number;
  isSubtle?: boolean;
  isActive?: boolean;
  getColor?: (payload: any, props: UniversalDotProps) => string;
  offsetRef?: React.MutableRefObject<any>;
  fillOpacity?: number;
}

export function renderUniversalSquareDot(
  props: UniversalDotProps,
  options?: UniversalDotOptions
): React.ReactNode {
  const { cx, cy, payload, dataKey, name, key, index } = props;

  if (
    typeof cx !== 'number' ||
    typeof cy !== 'number' ||
    Number.isNaN(cx) ||
    Number.isNaN(cy)
  ) {
    return null;
  }

  
  const size = options?.size ?? (options?.isActive ? 7.5 : 5);
  const halfSize = size / 2;
  const xOffset = options?.xOffset ?? 0;
  
  let finalX = cx + xOffset;
  let finalY = cy;

  if (options?.offsetRef?.current) {
    const offset = options.offsetRef.current;
    if (offset.left !== undefined && offset.width !== undefined && offset.top !== undefined && offset.height !== undefined) {
      const plotLeft = offset.left;
      const plotRight = offset.left + offset.width;
      const plotTop = offset.top;
      const plotBottom = offset.top + offset.height;

      // Only clamp X to prevent horizontal overflow; Y should use natural Recharts cy
      // which already respects the Y domain + headroom padding from UniversalYAxis
      finalX = Math.max(plotLeft + halfSize, Math.min(plotRight - halfSize, finalX));
      // finalY = Math.max(plotTop + halfSize, Math.min(plotBottom - halfSize, finalY)); // REMOVED: Y clamp removed to align with line path
    }
  }

  const isSubtle = options?.isSubtle ?? false;

  let solidColor: string;
  if (typeof options?.getColor === 'function') {
    solidColor = options.getColor(payload, props);
  } else {
    const itemReal =
      payload?.rawReal ?? payload?.unidades ?? payload?.real ?? payload?.avance ?? payload?.value;
    const itemPlan =
      payload?.rawPlan ?? payload?.planUnidades ?? payload?.plan ?? payload?.target;
    solidColor = getUniversalSolidColor(itemReal, itemPlan);
  }

  const fillOpacity = options?.fillOpacity ?? (isSubtle ? 0.125 : 1);

  return (
    <rect
      key={key ?? `dot-${dataKey ?? name ?? 'item'}-${index ?? cx}`}
      x={finalX - halfSize}
      y={finalY - halfSize}
      width={size}
      height={size}
      fill={getUniversalDatumColor(payload, solidColor)}
      fillOpacity={fillOpacity}
      pointerEvents="none"
    />
  );
}

export function createUniversalDotRenderer(options?: UniversalDotOptions) {
  return (props: UniversalDotProps & { _injectedOffsetRef?: React.MutableRefObject<any> }) => {
    const mergedOptions = { ...options };
    if (props._injectedOffsetRef) {
      mergedOptions.offsetRef = props._injectedOffsetRef;
    }
    return renderUniversalSquareDot(props, mergedOptions);
  };
}
