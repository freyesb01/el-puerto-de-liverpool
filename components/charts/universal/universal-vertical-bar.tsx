'use client'

import React from 'react'

export const VerticalMD3Bar = (props: any) => {
  const { x, y, width, height, fill } = props

  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    width <= 0 ||
    height <= 0
  ) {
    return null
  }

  const color = typeof fill === 'string' && fill ? fill : '#833177'
  const visualWidth = Math.max(2, Math.min(width, width / 2))
  const capSize = Math.min(visualWidth, height)
  const centerX = x + width / 2
  const capX = centerX - visualWidth / 2

  if (height <= visualWidth) {
    return <rect x={capX} y={y} width={visualWidth} height={height} fill={color} />
  }

  const topCapY = y
  const bottomCapY = y + height - capSize
  const lineTop = topCapY + capSize / 2
  const lineBottom = bottomCapY + capSize / 2

  return (
    <g pointerEvents="none">
      <line
        x1={centerX}
        y1={lineBottom}
        x2={centerX}
        y2={lineTop}
        stroke={color}
        strokeWidth={visualWidth}
        strokeLinecap="butt"
      />
      <rect x={capX} y={topCapY} width={visualWidth} height={capSize} fill={color} />
      <rect x={capX} y={bottomCapY} width={visualWidth} height={capSize} fill={color} />
    </g>
  )
}
