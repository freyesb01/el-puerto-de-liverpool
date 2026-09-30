'use client'

import React from 'react'
import { UNIVERSAL_CHART_LAYOUT as layout, useUniversalChartMetrics, useUniversalChartSystem } from './universal-chart-layout'

const MONTH_ABBR: Record<string, string> = {
  Enero: 'Ene',
  Febrero: 'Feb',
  Marzo: 'Mar',
  Abril: 'Abr',
  Mayo: 'May',
  Junio: 'Jun',
  Julio: 'Jul',
  Agosto: 'Ago',
  Septiembre: 'Sep',
  Octubre: 'Oct',
  Noviembre: 'Nov',
  Diciembre: 'Dic',
}

function abbreviateLabel(text: string): string {
  const abbr = MONTH_ABBR[text]
  if (abbr) return abbr
  return text.length > 6 ? `${text.slice(0, 6)}…` : text
}

interface Props {
  x?: number
  y?: number
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit'
  polar?: boolean
  label: React.ReactNode
  secondary?: React.ReactNode
  color: string
}

export function UniversalCategoryTick({
  x = 0,
  y = 0,
  textAnchor,
  polar = false,
  label,
  secondary,
  color,
}: Props) {
  const unified = useUniversalChartSystem()
  const { width, count } = useUniversalChartMetrics()

  const slot =
    width > 0
      ? (width - layout.yAxisWidth - layout.margin.left - layout.margin.right) / Math.max(count, 1)
      : Infinity

  const labelText = String(label ?? '')

  const shouldRotate = unified && !polar && slot < layout.rotateLabelThreshold
  const shouldAbbreviate = unified && !polar && !shouldRotate && slot < layout.compactLabelThreshold

  const visibleText = shouldAbbreviate || shouldRotate ? abbreviateLabel(labelText) : labelText

  const maxLength = Math.max(10, Math.floor((polar ? 90 : slot) / 5.5))
  const lines: string[] = []
  if (unified && !shouldRotate && !shouldAbbreviate) {
    for (const word of visibleText.split(' ')) {
      const last = lines.length - 1
      if (last >= 0 && lines[last].length + word.length < maxLength) {
        lines[last] += ` ${word}`
      } else {
        lines.push(word)
      }
    }
  } else {
    lines.push(visibleText)
  }

  const anchor = shouldRotate ? 'end' : polar ? textAnchor : 'middle'

  const showSecondary = !shouldRotate && secondary !== undefined && secondary !== null

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        transform={shouldRotate ? 'rotate(-55)' : undefined}
        textAnchor={anchor}
        fill={color}
        fontSize={layout.labelSize}
      >
        <title>
          {labelText}
          {secondary !== undefined && secondary !== null ? `: ${secondary}` : ''}
        </title>

        {lines.map((line, index) => (
          <tspan key={index} x={0} dy={index === 0 ? (polar ? 0 : 12) : layout.labelLineHeight}>
            {line}
          </tspan>
        ))}

        {showSecondary && (
          <tspan
            x={0}
            dy={layout.labelLineHeight}
            fill={color}
            fontSize={layout.labelSize}
          >
            {secondary}
          </tspan>
        )}
      </text>
    </g>
  )
}
