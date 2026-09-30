'use client'

import React from 'react'
import {
  getUniversalDatumColor,
  getUniversalSoftColor,
  getUniversalSolidColor,
} from '@/components/charts/universal/universal-chart-colors'

export const HorizontalMD3Bar = (props: any) => {
  const { y, width, height, fill, background, payload, dataKey, name } = props

  if (!background) return null

  const totalWidth = background.width
  const percentage = totalWidth > 0 ? (width / totalWidth) * 100 : 0
  const safePercentage = Math.max(0, Math.min(100, percentage))

  const strokeWidth = height / 2
  const capOffset = strokeWidth / 2
  const centerY = height / 2

  let finalColor = fill

  // Preserve categorical colors (DILISA, LPC, JUST ME, GARANTIZADA).
  const isCategorical = ['DILISA', 'LPC', 'JUST ME', 'GARANTIZADA'].includes(String(dataKey || name))

  if (!isCategorical && payload) {
    const itemReal = payload.rawReal ?? payload.unidades ?? payload.real ?? payload.avance ?? payload.aprobadas
    const itemPlan = payload.rawPlan ?? payload.planUnidades ?? payload.plan

    if (itemReal !== undefined && itemPlan !== undefined) {
      const solidColor = getUniversalDatumColor(
        payload,
        getUniversalSolidColor(Number(itemReal), Number(itemPlan)),
      )

      const isPlan =
        dataKey === 'plan' ||
        name === 'Plan' ||
        name === 'Plan (100%)' ||
        name === 'Meta (100%)' ||
        (typeof fill === 'string' && fill.endsWith('40'))

      finalColor = isPlan ? getUniversalSoftColor(solidColor, '40') : solidColor
    }
  }

  return (
    <svg
      x={background.x}
      y={y}
      width={totalWidth}
      height={height}
      className="overflow-visible"
      xmlns="http://www.w3.org/2000/svg"
    >
      {safePercentage > 0 && (
        <line
          x1={capOffset}
          y1={centerY}
          x2={`calc(${safePercentage}% - ${strokeWidth}px)`}
          y2={centerY}
          stroke={finalColor}
          strokeWidth={strokeWidth}
          strokeLinecap="square"
        />
      )}
      <line
        x1={`calc(${safePercentage}% + ${strokeWidth}px)`}
        y1={centerY}
        x2={`calc(100% - ${capOffset}px)`}
        y2={centerY}
        stroke={finalColor}
        strokeOpacity="0.125"
        strokeWidth={strokeWidth}
        strokeLinecap="square"
      />
      <rect
        x={`calc(100% - ${strokeWidth}px)`}
        y={centerY - capOffset}
        width={strokeWidth}
        height={strokeWidth}
        fill={finalColor}
      />
    </svg>
  )
}
