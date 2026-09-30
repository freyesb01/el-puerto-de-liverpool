import React from 'react'
import { Tooltip, type TooltipProps } from 'recharts'
import { UNIVERSAL_CHART_LAYOUT } from './universal-chart-layout'

export interface UniversalChartTooltipProps extends Partial<TooltipProps<any, any>> {
  cursor?: any
}

export function UniversalChartTooltip({
  contentStyle,
  wrapperStyle,
  offset = 10,
  ...rest
}: UniversalChartTooltipProps) {
  return (
    <Tooltip
      offset={offset}
      contentStyle={{
        padding: 0,
        border: 'none',
        borderRadius: 0,
        background: 'transparent',
        boxShadow: 'none',
        ...contentStyle,
      }}
      wrapperStyle={{
        outline: 'none',
        borderRadius: 0,
        maxWidth: Math.min(240, UNIVERSAL_CHART_LAYOUT.tooltipWidth),
        whiteSpace: 'normal',
        pointerEvents: 'none',
        zIndex: 50,
        boxShadow: 'none',
        ...wrapperStyle,
      }}
      {...rest}
    />
  )
}

UniversalChartTooltip.displayName = 'Tooltip'
;(UniversalChartTooltip as any).defaultProps = (Tooltip as any).defaultProps
