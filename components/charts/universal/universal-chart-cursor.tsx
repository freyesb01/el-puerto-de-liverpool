import React from 'react';
import { Sector } from 'recharts';
import type { UniversalCursorProps } from './universal-chart-types';
import { getUniversalSolidColor, getUniversalDatumColor } from './universal-chart-colors';

export function UniversalChartCursor<T = any>(props: UniversalCursorProps<T>) {
  const {
    x,
    y,
    width,
    height,
    top,
    left,
    points,
    cx,
    cy,
    startAngle,
    endAngle,
    innerRadius,
    outerRadius,
    payload,
    payloadIndex,
    data,
    className,
    chartType,
    layout,
    getDatumColor,
    opacity = 0.25,
  } = props;

  if (chartType === 'scatter') {
    return null;
  }

  const totalCount =
    (Array.isArray(data) && data.length > 0 ? data.length : 0) ||
    (typeof props.totalCount === 'number' && props.totalCount > 0
      ? props.totalCount
      : 0);

  const defaultColorResolver = (datum: any): string => {
    if (!datum) return '#ff6d01';

    if (typeof getDatumColor === 'function') {
      return getDatumColor(datum);
    }

    const realVal = datum.real ?? datum.unidades ?? datum.value ?? datum.avance;
    const planVal = datum.plan ?? datum.planUnidades ?? datum.target ?? 100;

    return getUniversalSolidColor(realVal, planVal);
  };

  const item =
    payload?.[0]?.payload ||
    (typeof payloadIndex === 'number' && data?.[payloadIndex]
      ? data[payloadIndex]
      : null);

  const solidColor = getUniversalDatumColor(item, defaultColorResolver(item));

  const isRadar =
    chartType === 'radar' ||
    layout === 'centric' ||
    layout === 'radial' ||
    (typeof cx === 'number' && typeof cy === 'number');

  const id = React.useId().replace(/:/g, '');
  const patternId = `cursor-hatch-${id}`;

  const renderPatternDefs = () => (
    <defs>
      <pattern
        id={patternId}
        width="2.5"
        height="2.5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="2.5"
          stroke={solidColor}
          strokeWidth="1"
          strokeOpacity={opacity}
          pointerEvents="none"
        />
      </pattern>
    </defs>
  );

  const cursorStyle = { transition: 'opacity 150ms ease-out' };

  if (isRadar) {
    const polar = props.coordinate as any;
    const polarCx = typeof cx === 'number' ? cx : polar?.cx;
    const polarCy = typeof cy === 'number' ? cy : polar?.cy;
    const polarInnerRadius =
      typeof innerRadius === 'number' ? innerRadius :
      typeof polar?.innerRadius === 'number' ? polar.innerRadius : 0;
    const polarOuterRadius =
      typeof outerRadius === 'number' ? outerRadius :
      typeof polar?.outerRadius === 'number' ? polar.outerRadius :
      typeof polar?.radius === 'number' ? polar.radius : 100;

    let polarStartAngle =
      typeof startAngle === 'number' ? startAngle : polar?.startAngle;
    let polarEndAngle =
      typeof endAngle === 'number' ? endAngle : polar?.endAngle;

    if (
      (typeof polarStartAngle !== 'number' || typeof polarEndAngle !== 'number') &&
      typeof polar?.angle === 'number' &&
      totalCount > 0
    ) {
      const halfStep = 180 / totalCount;
      polarStartAngle = polar.angle + halfStep;
      polarEndAngle = polar.angle - halfStep;
    }

    if (
      typeof polarCx === 'number' &&
      typeof polarCy === 'number' &&
      typeof polarStartAngle === 'number' &&
      typeof polarEndAngle === 'number'
    ) {
      return (
        <g>
          {renderPatternDefs()}
          <Sector
            cx={polarCx}
            cy={polarCy}
            startAngle={polarStartAngle}
            endAngle={polarEndAngle}
            innerRadius={polarInnerRadius}
            outerRadius={polarOuterRadius}
            fill={`url(#${patternId})`}
            className={className || 'recharts-tooltip-cursor'}
            pointerEvents="none"
            style={cursorStyle}
          />
        </g>
      );
    }

    return null;
  }

  const offset = props.offset;

  const plotLeft =
    typeof offset?.left === 'number'
      ? offset.left
      : typeof left === 'number'
        ? left
        : 0;

  const plotTop =
    typeof offset?.top === 'number'
      ? offset.top
      : typeof top === 'number'
        ? top
        : 0;

  const plotWidth =
    typeof offset?.width === 'number' && offset.width > 0
      ? offset.width
      : typeof width === 'number' && width > 0
        ? width
        : 0;

  const plotHeight =
    typeof offset?.height === 'number' && offset.height > 0
      ? offset.height
      : typeof height === 'number' && height > 0
        ? height
        : 0;

  if (totalCount <= 0 || plotWidth <= 0 || plotHeight <= 0) {
    return null;
  }

  const point = points?.[0];
  const activeIndex = typeof payloadIndex === 'number' ? payloadIndex : props.activeTooltipIndex;

  if (layout === 'vertical') {
    const categoryHeight = plotHeight / totalCount;
    const pointCenterY =
      typeof point?.y === 'number'
        ? point.y
        : typeof props.coordinate?.y === 'number'
          ? props.coordinate.y
          : null;

    const fallbackY =
      typeof activeIndex === 'number' && activeIndex >= 0
        ? plotTop + (activeIndex + 0.5) * categoryHeight
        : null;

    const centerY = pointCenterY ?? fallbackY;

    if (centerY === null) {
      return null;
    }

    const rectY = Math.max(
      plotTop,
      Math.min(plotTop + plotHeight - categoryHeight, centerY - categoryHeight / 2)
    );

    return (
      <g>
        {renderPatternDefs()}
        <rect
          x={plotLeft}
          y={rectY}
          width={plotWidth}
          height={categoryHeight}
          fill={`url(#${patternId})`}
          className={className || 'recharts-tooltip-cursor'}
          pointerEvents="none"
          style={cursorStyle}
        />
      </g>
    );
  }

  const categoryWidth = plotWidth / totalCount;
  const pointCenterX =
    typeof point?.x === 'number'
      ? point.x
      : typeof props.coordinate?.x === 'number'
        ? props.coordinate.x
        : null;

  const fallbackX =
    typeof activeIndex === 'number' && activeIndex >= 0
      ? plotLeft + (activeIndex + 0.5) * categoryWidth
      : null;

  const centerX = pointCenterX ?? fallbackX;

  if (centerX === null) {
    return null;
  }

  const rectX = Math.max(
    plotLeft,
    Math.min(plotLeft + plotWidth - categoryWidth, centerX - categoryWidth / 2)
  );

  return (
    <g>
      {renderPatternDefs()}
      <rect
        x={rectX}
        y={plotTop}
        width={categoryWidth}
        height={plotHeight}
        fill={`url(#${patternId})`}
        className={className || 'recharts-tooltip-cursor'}
        pointerEvents="none"
        style={cursorStyle}
      />
    </g>
  );
}
