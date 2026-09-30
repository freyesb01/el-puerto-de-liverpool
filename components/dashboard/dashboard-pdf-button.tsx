'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { FileDown } from 'lucide-react'
import { SquareSpinner } from '@/components/ui/square-spinner'
import {
  formatNumber,
  formatPercent,
  getExactPercentageText,
} from '@/components/dashboard/vista-general/helpers/formatters'
import { formatPromoterLabel } from '@/lib/person-names'

interface DashboardPdfButtonProps {
  userName?: string
  branchName?: string
}

type ChartSeries = {
  dataKey: string
  name: string
  color?: string
}

type ChartContext = {
  data: Record<string, any>[]
  categoryKey: string
  target?: ChartSeries
  actual?: ChartSeries
  series: ChartSeries[]
}

const PURPLE = '#833177'
const MAGENTA = '#e10098'
const ORANGE = '#ff6d01'
const TEXT = '#49454F'
const PORTFOLIO_GROUPS = [
  { name: 'DILISA', actualKey: 'DILISA', targetKey: 'DILISA_PLAN', color: PURPLE },
  { name: 'LPC', actualKey: 'LPC', targetKey: 'LPC_PLAN', color: MAGENTA },
  { name: 'JUST ME', actualKey: 'JUST ME', targetKey: 'JUST ME_PLAN', color: ORANGE },
  { name: 'GARANTIZADA', actualKey: 'GARANTIZADA', targetKey: 'GARANTIZADA_PLAN', color: TEXT },
] as const
const MONTHS: Record<string, string> = {
  Ene: 'Enero',
  Feb: 'Febrero',
  Mar: 'Marzo',
  Abr: 'Abril',
  May: 'Mayo',
  Jun: 'Junio',
  Jul: 'Julio',
  Ago: 'Agosto',
  Sep: 'Septiembre',
  Oct: 'Octubre',
  Nov: 'Noviembre',
  Dic: 'Diciembre',
}

function sentenceCase(value: string) {
  const text = String(value || '').trim().toLocaleLowerCase('es-MX')
  return text ? text.charAt(0).toLocaleUpperCase('es-MX') + text.slice(1) : text
}

function formatDisplayName(value?: string) {
  if (!value?.trim()) return 'Usuario'
  return value
    .trim()
    .toLocaleLowerCase('es-MX')
    .split(/\s+/)
    .map((part) =>
      part
        ? part.charAt(0).toLocaleUpperCase('es-MX') + part.slice(1)
        : part,
    )
    .join(' ')
}

function canonicalPromoterGroupLabel(value: string): string | null {
  const key = value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX').replace(/\s+/g, ' ')
  if (key === 'promotores de credito' || key === 'promotor de credito') return 'Promotores de Crédito'
  if (key === 'asesores de credito') return 'Asesores de Crédito'
  return null
}

function isPersonDatum(datum: Record<string, any>, title = '') {
  const promoterGroup = Boolean(canonicalPromoterGroupLabel(String(datum.name || '')) ||
    canonicalPromoterGroupLabel(formatPromoterLabel(String(datum.name || ''))))
  return Boolean(
    datum.jefe || datum.asesor || datum.promotor || datum.colaborador ||
    (/ranking/i.test(title) && typeof datum.name === 'string' && !promoterGroup),
  )
}

function displaySeriesName(value: string) {
  return ['DILISA', 'LPC', 'JUST ME', 'GARANTIZADA'].includes(value)
    ? value
    : sentenceCase(value)
}

function formatFileDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatFooterDate(date: Date) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function performanceColor(actual: number, target: number, pending = false) {
  if (pending || target <= 0 || actual <= 0) return ORANGE
  const progress = (actual / target) * 100
  if (progress < 33) return ORANGE
  if (progress < 66) return MAGENTA
  return PURPLE
}

function performanceStatus(actual: number, target: number, pending = false) {
  if (pending || target <= 0) return 'Pendiente de evaluación'
  const progress = (actual / target) * 100
  if (progress >= 100) return 'Meta cumplida'
  if (progress >= 66) return 'Avance sólido'
  if (progress >= 33) return 'Avance intermedio'
  return 'Avance inicial'
}

function explicitPending(datum: Record<string, any>) {
  if (datum.isPending === true || datum.pending === true) return true
  const candidates = [
    datum.porcentajeStr,
    datum.subStr,
    datum.percentageStr,
    datum.cumplimientoStr,
  ]
  return candidates.some((value) => typeof value === 'string' && value.trim() === '-')
}

function colorOf(series: any, fallback = PURPLE) {
  return series?.color || series?.stroke || series?.fill || fallback
}

function normalizeSeries(item: any): ChartSeries | null {
  if (!item?.dataKey) return null
  return {
    dataKey: String(item.dataKey),
    name: String(item.name || item.dataKey),
    color: colorOf(item),
  }
}

function uniqueSeries(items: ChartSeries[]) {
  return items.filter(
    (item, index) => items.findIndex((candidate) => candidate.dataKey === item.dataKey) === index,
  )
}

function getReactFiber(element: Element): any | null {
  const key = Object.keys(element).find((name) => name.startsWith('__reactFiber$'))
  return key ? (element as any)[key] : null
}

function elementWithDataFromValue(value: any): any | null {
  if (!value) return null

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = elementWithDataFromValue(item)
      if (found) return found
    }
    return null
  }

  if (typeof value === 'object') {
    const props = value.props
    if (props && Array.isArray(props.data) && props.data.length > 0) {
      return value
    }
    if (props?.children) {
      const found = elementWithDataFromValue(props.children)
      if (found) return found
    }
  }

  return null
}

function findChartElement(card: HTMLElement): any | null {
  let fiber = getReactFiber(card)

  while (fiber) {
    const candidate = elementWithDataFromValue(fiber.memoizedProps?.children)
    if (candidate) return candidate
    fiber = fiber.return
  }

  const start = getReactFiber(card)
  if (!start) return null

  const queue = [start.child]
  while (queue.length) {
    const current = queue.shift()
    if (!current) continue
    const props = current.memoizedProps
    if (props && Array.isArray(props.data) && props.data.length > 0) {
      return { props }
    }
    if (current.child) queue.push(current.child)
    if (current.sibling) queue.push(current.sibling)
  }

  return null
}

function resolveCategoryKey(props: any, data: Record<string, any>[]) {
  const xAxisKey = props?.xAxis?.props?.dataKey
  const polarKey = props?.polarAngleAxis?.props?.dataKey
  const direct = props?.categoryKey || xAxisKey || polarKey
  if (typeof direct === 'string' && direct) return direct

  const first = data[0] || {}
  const candidates = [
    'mes',
    'name',
    'jefe',
    'asesor',
    'promotor',
    'colaborador',
    'seccion',
    'sección',
    'canal',
    'producto',
  ]

  return candidates.find((key) => key in first) || Object.keys(first)[0] || 'name'
}

function chartContext(card: HTMLElement): ChartContext | null {
  const element = findChartElement(card)
  const props = element?.props
  if (!props || !Array.isArray(props.data) || props.data.length === 0) return null

  const data = props.data as Record<string, any>[]
  const target = normalizeSeries(props.target)
  const actual = normalizeSeries(props.actual)
  const semantic = Array.isArray(props.series)
    ? props.series.map(normalizeSeries).filter(Boolean) as ChartSeries[]
    : []

  const lowLevel = [
    ...(Array.isArray(props.lines) ? props.lines : []),
    ...(Array.isArray(props.bars) ? props.bars : []),
    ...(Array.isArray(props.areas) ? props.areas : []),
    ...(Array.isArray(props.series) && !semantic.length ? props.series : []),
  ]
    .map(normalizeSeries)
    .filter(Boolean) as ChartSeries[]

  const series = uniqueSeries(
    semantic.length > 0
      ? [
          ...(target ? [target] : []),
          ...semantic,
          ...(actual ? [actual] : []),
        ]
      : [
          ...(target ? [target] : []),
          ...lowLevel,
          ...(actual ? [actual] : []),
        ],
  )

  return {
    data,
    categoryKey: resolveCategoryKey(props, data),
    target: target || series.find((item) => /^(plan|meta)/i.test(item.name)),
    actual:
      actual ||
      series.find((item) =>
        /real|aprob|avance|efectividad|resultado|participación|participacion/i.test(item.name),
      ),
    series,
  }
}

function numericValue(value: any) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function datumScore(datum: Record<string, any>, context: ChartContext) {
  if (context.actual) return numericValue(datum[context.actual.dataKey])

  const preferred = [
    datum.real,
    datum.aprobadas,
    datum.unidades,
    datum.avance,
    datum.porcentaje,
    datum.total,
  ]

  for (const value of preferred) {
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }

  return context.series
    .filter((item) => item !== context.target && !/plan|meta/i.test(item.name))
    .reduce((sum, item) => sum + Math.max(0, numericValue(datum[item.dataKey])), 0)
}

function selectDatum(title: string, context: ChartContext) {
  const data = context.data
  const evaluable = data.filter((datum) => !explicitPending(datum))
  const pool = evaluable.length > 0 ? evaluable : data
  const normalizedTitle = title.toLocaleLowerCase('es-MX')
  const monthly = data.some((datum) => typeof datum.mes === 'string')

  if (monthly) {
    for (let index = pool.length - 1; index >= 0; index -= 1) {
      if (datumScore(pool[index], context) !== 0) return pool[index]
    }
    return pool[pool.length - 1]
  }

  if (normalizedTitle.includes('ranking')) {
    return pool[0]
  }

  if (
    normalizedTitle.includes('participación') ||
    normalizedTitle.includes('participacion') ||
    normalizedTitle.includes('sección') ||
    normalizedTitle.includes('seccion')
  ) {
    return [...pool].sort((a, b) => datumScore(b, context) - datumScore(a, context))[0]
  }

  return pool[pool.length - 1]
}

function isPercentageSeries(series: ChartSeries | undefined, title: string) {
  const text = `${series?.name || ''} ${series?.dataKey || ''} ${title}`.toLocaleLowerCase('es-MX')
  return (
    text.includes('%') ||
    text.includes('porcentaje') ||
    text.includes('efectividad') ||
    text.includes('ranking') ||
    text.includes('participación') ||
    text.includes('participacion') ||
    text.includes('avance')
  )
}

function softenColor(hex: string, strength = 0.35) {
  const value = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(value)) return hex

  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)

  const mix = (channel: number) =>
    Math.round(255 - (255 - channel) * strength)
      .toString(16)
      .padStart(2, '0')

  return `#${mix(red)}${mix(green)}${mix(blue)}`
}

function formatSeriesValue(value: number, series: ChartSeries | undefined, title: string) {
  return isPercentageSeries(series, title) ? formatPercent(value) : formatNumber(value)
}

function displayLabel(datum: Record<string, any>, categoryKey: string, title: string) {
  const raw =
    datum[categoryKey] ??
    datum.mes ??
    datum.name ??
    datum.jefe ??
    datum.asesor ??
    datum.promotor ??
    datum.colaborador ??
    datum.seccion ??
    datum.canal ??
    datum.producto ??
    'Resultado'

  const text = String(raw)
  const mapped = MONTHS[text] || text
  const groupLabel = canonicalPromoterGroupLabel(mapped) ??
    canonicalPromoterGroupLabel(formatPromoterLabel(mapped))
  if (groupLabel) return groupLabel
  if (/ranking de promotores/i.test(title)) {
    return formatPromoterLabel(mapped)
  }
  return isPersonDatum(datum, title) ? formatDisplayName(mapped) : sentenceCase(mapped)
}

function addText(parent: HTMLElement, text: string, style: Partial<CSSStyleDeclaration> = {}) {
  const element = document.createElement('div')
  element.textContent = text
  Object.assign(element.style, style)
  parent.appendChild(element)
  return element
}

function createRow(label: string, value: string, color: string, markerColor = color, labelColor = color) {
  const row = document.createElement('div')
  Object.assign(row.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    minHeight: '12.5px',
  })

  const left = document.createElement('div')
  Object.assign(left.style, {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    minWidth: '0',
  })

  const marker = document.createElement('span')
  Object.assign(marker.style, {
    width: '5px',
    height: '12.5px',
    display: 'inline-block',
    flex: '0 0 auto',
    background: markerColor,
  })

  const name = document.createElement('span')
  name.textContent = label
  name.style.color = labelColor

  const amount = document.createElement('span')
  amount.textContent = value
  Object.assign(amount.style, {
    color,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  })

  left.append(marker, name)
  row.append(left, amount)
  return row
}

function buildStaticTooltip(
  title: string,
  context: ChartContext,
  userName: string,
) {
  const datum = selectDatum(title, context)
  if (!datum) return null

  const label = displayLabel(datum, context.categoryKey, title)
  const target =
    context.target ||
    context.series.find((item) => /plan|meta/i.test(`${item.name} ${item.dataKey}`))

  const actual =
    context.actual ||
    context.series.find(
      (item) => item.dataKey !== target?.dataKey && !/plan|meta/i.test(`${item.name} ${item.dataKey}`),
    )

  const hasPlan =
    Boolean(target) ||
    datum.plan !== undefined ||
    datum.planUnidades !== undefined

  const tooltip = document.createElement('div')
  tooltip.setAttribute('data-pdf-static-tooltip', '')
  Object.assign(tooltip.style, {
    width: '240px',
    maxWidth: '240px',
    boxSizing: 'border-box',
    padding: '10px',
    background: '#ffffff',
    color: PURPLE,
    border: `1px solid ${PURPLE}`,
    borderRadius: '0',
    boxShadow: 'none',
    fontFamily: 'var(--font-sans), Inter, sans-serif',
    fontSize: '10px',
    lineHeight: '12.5px',
    fontWeight: '400',
    textAlign: 'left',
    overflowWrap: 'break-word',
    wordBreak: 'normal',
  })

  const heading = document.createElement('div')
  Object.assign(heading.style, {
    paddingBottom: '7px',
    marginBottom: '8px',
    borderBottom: '1px solid var(--border)',
  })

  addText(heading, `Hola, ${formatDisplayName(userName)}`, {
    marginBottom: '3px',
  })

  const headingLine = document.createElement('div')
  Object.assign(headingLine.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
  })

  addText(headingLine, label, { minWidth: '0' })

  tooltip.appendChild(heading)

  const normalizedTitle = title.toLocaleLowerCase('es-MX')
  const isPortfolio = normalizedTitle.includes('mezcla de portafolio')

  if (isPortfolio) {
    const pending = explicitPending(datum)
    const actualValues = PORTFOLIO_GROUPS.map((group) => ({
      group,
      value: numericValue(datum[group.actualKey]),
    }))
    const total = actualValues.reduce((sum, item) => sum + item.value, 0)
    const dominant = [...actualValues].sort((a, b) => b.value - a.value)[0]
    const firstGroup = PORTFOLIO_GROUPS.find((group) =>
      context.series.some((series) => series.dataKey === group.actualKey),
    ) || PORTFOLIO_GROUPS[0]
    const borderColor = pending ? ORANGE : firstGroup.color
    tooltip.style.borderColor = borderColor
    tooltip.style.color = borderColor
    heading.appendChild(headingLine)

    const rows = document.createElement('div')
    Object.assign(rows.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    })

    for (const group of PORTFOLIO_GROUPS) {
      const groupBlock = document.createElement('div')
      Object.assign(groupBlock.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      })

      addText(groupBlock, group.name, {
        color: pending ? ORANGE : group.color,
      })

      const actualValue = pending ? '-' : formatNumber(numericValue(datum[group.actualKey]))
      const targetValue = pending ? '-' : formatNumber(numericValue(datum[group.targetKey]))
      groupBlock.appendChild(createRow('Real', actualValue, pending ? ORANGE : group.color))
      groupBlock.appendChild(
        createRow(
          'Meta',
          targetValue,
          pending ? ORANGE : group.color,
          pending ? ORANGE : softenColor(group.color),
        ),
      )
      rows.appendChild(groupBlock)
    }

    const totalRow = document.createElement('div')
    Object.assign(totalRow.style, {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '12px',
      paddingTop: '7px',
      marginTop: '2px',
      borderTop: '1px solid var(--border)',
    })
    addText(totalRow, 'Total')
    addText(totalRow, pending ? '-' : formatNumber(total), {
      color: borderColor,
      fontVariantNumeric: 'tabular-nums',
    })
    rows.appendChild(totalRow)
    tooltip.appendChild(rows)

    const explanation = document.createElement('div')
    Object.assign(explanation.style, {
      borderTop: '1px solid var(--border)',
      marginTop: '8px',
      paddingTop: '8px',
      textAlign: 'justify',
      textJustify: 'inter-word',
    })

    explanation.textContent = pending
      ? `${label} todavía está pendiente de evaluación. Aún no hay resultados cerrados para comparar contra las metas del portafolio.`
      : dominant
        ? `En ${label}, el total registrado es ${formatNumber(total)}. El mayor aporte corresponde a ${dominant.group.name}, con ${formatNumber(dominant.value)}.`
        : `En ${label}, no hay valores disponibles para resumir.`

    tooltip.appendChild(explanation)
    return tooltip
  }

  if (!hasPlan && context.series.length > 1) {
    const usableSeries = context.series.filter(
      (item) => datum[item.dataKey] !== undefined && !/plan|meta/i.test(item.name),
    )

    const values = usableSeries.map((item) => ({
      series: item,
      value: numericValue(datum[item.dataKey]),
    }))

    const dominant = [...values].sort((a, b) => b.value - a.value)[0]
    const total = values.reduce((sum, item) => sum + item.value, 0)
    const borderColor = values[0]?.series.color || PURPLE
    tooltip.style.borderColor = borderColor
    tooltip.style.color = borderColor

    heading.appendChild(headingLine)

    const rows = document.createElement('div')
    Object.assign(rows.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    })

    for (const item of values) {
      rows.appendChild(
        createRow(
          displaySeriesName(item.series.name),
          formatSeriesValue(item.value, item.series, title),
          item.series.color || PURPLE,
          item.series.color || PURPLE,
          borderColor,
        ),
      )
    }

    const totalRow = document.createElement('div')
    Object.assign(totalRow.style, {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '12px',
      paddingTop: '7px',
      marginTop: '2px',
      borderTop: '1px solid var(--border)',
    })
    addText(totalRow, 'Total')
    addText(totalRow, formatNumber(total), {
      color: borderColor,
      fontVariantNumeric: 'tabular-nums',
    })
    rows.appendChild(totalRow)
    tooltip.appendChild(rows)

    const explanation = document.createElement('div')
    Object.assign(explanation.style, {
      borderTop: '1px solid var(--border)',
      marginTop: '8px',
      paddingTop: '8px',
      textAlign: 'justify',
      textJustify: 'inter-word',
    })

    explanation.textContent = dominant
      ? `En ${label}, el total registrado es ${formatNumber(total)}. El mayor aporte corresponde a ${displaySeriesName(dominant.series.name)}, con ${formatNumber(dominant.value)}.`
      : `En ${label}, no hay valores disponibles para resumir.`

    tooltip.appendChild(explanation)
    return tooltip
  }

  const planValue = numericValue(
    target ? datum[target.dataKey] : datum.planUnidades ?? datum.plan,
  )
  const actualValue = numericValue(
    actual
      ? datum[actual.dataKey]
      : datum.unidades ?? datum.real ?? datum.aprobadas,
  )
  const pending = explicitPending(datum)
  const comparisonBasis = datum.comparisonBasis
  const ratio = planValue > 0 ? (actualValue / planValue) * 100 : 0
  const color = performanceColor(actualValue, planValue, pending)
  const planColor = pending ? ORANGE : softenColor(color)
  const status = comparisonBasis === 'participation'
    ? pending ? 'Sin datos de participación' : 'Participación del total'
    : comparisonBasis === 'maximum'
      ? pending ? 'Pendiente de evaluación' : 'Comparación entre secciones'
      : performanceStatus(actualValue, planValue, pending)
  const exactPercent = getExactPercentageText(datum)
  const ratioDisplay = exactPercent || formatPercent(ratio)
  const actualDisplay =
    isPercentageSeries(actual, title) && exactPercent
      ? exactPercent
      : formatSeriesValue(actualValue, actual, title)

  tooltip.style.borderColor = color
  tooltip.style.color = color

  addText(headingLine, status, {
    color,
    textAlign: 'left',
    whiteSpace: 'normal',
  })
  heading.appendChild(headingLine)

  const rows = document.createElement('div')
  Object.assign(rows.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  })

  if (comparisonBasis === 'participation') {
    const units = numericValue(datum.unidades)
    const total = numericValue(datum.totalUnidades) || context.data.reduce(
      (sum, item) => sum + numericValue(item.unidades), 0,
    )
    rows.appendChild(createRow('Unidades del canal', pending ? '-' : formatNumber(units), color))
    rows.appendChild(createRow('Total de canales', pending ? '-' : formatNumber(total), color, planColor))
    rows.appendChild(createRow('Participación', pending ? '-' : formatPercent(actualValue), color))
  } else if (comparisonBasis === 'maximum') {
    rows.appendChild(createRow('Real', pending ? '-' : formatNumber(actualValue), color))
    rows.appendChild(createRow('Referencia mayor sección', formatNumber(planValue), color, planColor))
    rows.appendChild(createRow('Respecto al máximo', pending ? '-' : ratioDisplay, color))
  } else if (pending) {
    rows.appendChild(createRow(actual?.name || 'Real', '-', ORANGE))
    rows.appendChild(
      createRow(
        target?.name || 'Plan',
        formatSeriesValue(planValue, target, title),
        ORANGE,
      ),
    )
    rows.appendChild(createRow('Cumplimiento', '-', ORANGE))
  } else {
    rows.appendChild(
      createRow(
        sentenceCase(actual?.name || 'Real'),
        actualDisplay,
        color,
      ),
    )
    rows.appendChild(
      createRow(
        sentenceCase(target?.name || 'Plan'),
        formatSeriesValue(planValue, target, title),
        color,
        planColor,
      ),
    )
    rows.appendChild(createRow('Cumplimiento', ratioDisplay, color))

    if (title.toLocaleLowerCase('es-MX').includes('desviación')) {
      const diff = actualValue - planValue
      rows.appendChild(
        createRow(
          'Desviación',
          `${diff > 0 ? '+' : ''}${formatNumber(diff)}`,
          color,
        ),
      )
    }
  }

  tooltip.appendChild(rows)

  const explanation = document.createElement('div')
  Object.assign(explanation.style, {
    borderTop: '1px solid var(--border)',
    marginTop: '8px',
    paddingTop: '8px',
    textAlign: 'justify',
    textJustify: 'inter-word',
  })

  const person = isPersonDatum(datum, title)

  if (comparisonBasis === 'participation') {
    const units = numericValue(datum.unidades)
    const total = numericValue(datum.totalUnidades) || context.data.reduce(
      (sum, item) => sum + numericValue(item.unidades), 0,
    )
    explanation.textContent = pending || total <= 0
      ? `En ${label} todavía no hay datos suficientes para calcular su participación.`
      : `En ${label} se registraron ${formatNumber(units)} de ${formatNumber(total)} unidades; esto representa ${formatPercent(actualValue)} del total.`
  } else if (comparisonBasis === 'maximum') {
    explanation.textContent = pending
      ? `En ${label} todavía no hay un resultado cerrado para comparar entre secciones.`
      : `En ${label} se registraron ${formatNumber(actualValue)} unidades. La referencia de ${formatNumber(planValue)} es el valor mayor entre las secciones mostradas; ${ratioDisplay} indica su proporción respecto a esa referencia. No hay una meta registrada.`
  } else if (pending) {
    explanation.textContent = person
      ? `${label} todavía está pendiente de evaluación y aún no tiene un resultado cerrado frente a la meta proyectada.`
      : `En ${label}, el periodo está pendiente de evaluación y todavía no existe un resultado cerrado frente a la meta proyectada.`
  } else if (planValue > 0) {
    const missing = Math.max(0, planValue - actualValue)
    const over = Math.max(0, actualValue - planValue)
    const percentMode =
      isPercentageSeries(actual, title) ||
      isPercentageSeries(target, title)
    const targetDisplay = percentMode
      ? formatSeriesValue(planValue, target, title)
      : formatNumber(planValue)
    const resultDisplay = percentMode ? actualDisplay : formatNumber(actualValue)
    const missingDisplay = percentMode
      ? formatSeriesValue(missing, actual, title)
      : formatNumber(missing)

    if (Math.abs(ratio - 100) < 0.000001) {
      explanation.textContent = person
        ? `${label} alcanzó la meta establecida, con un cumplimiento de ${ratioDisplay}.`
        : `En ${label}, la meta está cumplida. El cumplimiento es de ${ratioDisplay}.`
    } else if (ratio > 100) {
      explanation.textContent = person
        ? percentMode
          ? `${label} registra ${resultDisplay} frente a una meta de ${targetDisplay}. Su cumplimiento es de ${ratioDisplay} y supera la meta por ${formatPercent(((actualValue - planValue) / planValue) * 100)}.`
          : `${label} registra ${resultDisplay} frente a una meta de ${targetDisplay}. Su cumplimiento es de ${ratioDisplay} y supera la meta por ${formatNumber(over)}.`
        : percentMode
          ? `En ${label}, el resultado es ${resultDisplay} frente a una meta de ${targetDisplay}. La meta está cumplida y se supera por ${formatPercent(((actualValue - planValue) / planValue) * 100)}.`
          : `En ${label}, el resultado es ${resultDisplay} frente a una meta de ${targetDisplay}. La meta está cumplida y se supera por ${formatNumber(over)}.`
    } else {
      explanation.textContent = person
        ? `${label} registra ${resultDisplay} frente a una meta de ${targetDisplay}. Su cumplimiento es de ${ratioDisplay} y faltan ${missingDisplay} para completar la meta.`
        : `En ${label}, el resultado es ${resultDisplay} frente a una meta de ${targetDisplay}. El cumplimiento es de ${ratioDisplay} y faltan ${missingDisplay} para completar la meta.`
    }
  } else {
    explanation.textContent = person
      ? `${label} registra un resultado de ${formatSeriesValue(actualValue, actual, title)}.`
      : `En ${label}, el resultado registrado es ${formatSeriesValue(actualValue, actual, title)}.`
  }

  tooltip.appendChild(explanation)
  return tooltip
}

function removePrintNoise(card: HTMLElement) {
  card.querySelectorAll('button').forEach((element) => element.remove())
  card.querySelectorAll('.recharts-tooltip-wrapper').forEach((element) => element.remove())
  card.querySelectorAll('.recharts-tooltip-cursor').forEach((element) => element.remove())
  card.querySelectorAll('[role="menu"]').forEach((element) => element.remove())
  card.querySelectorAll('[data-pdf-exclude]').forEach((element) => element.remove())
}

function createPrintStyles() {
  const style = document.createElement('style')
  style.setAttribute('data-dashboard-pdf-print-style', '')
  style.textContent = `
    #dashboard-pdf-print-root {
      display: none;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 0 !important;
      }

      body::before,
      body::after {
        content: none !important;
        display: none !important;
      }

      html,
      body {
        width: 210mm !important;
        min-width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }

      body > *:not(#dashboard-pdf-print-root) {
        display: none !important;
      }

      #dashboard-pdf-print-root {
        display: block !important;
        visibility: visible !important;
        width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #49454F !important;
        font-family: var(--font-sans), Inter, sans-serif !important;
      }

      #dashboard-pdf-print-root *,
      #dashboard-pdf-print-root *::before,
      #dashboard-pdf-print-root *::after {
        visibility: visible !important;
      }

      #dashboard-pdf-print-root header,
      #dashboard-pdf-print-root footer {
        visibility: visible !important;
      }

      #dashboard-pdf-print-root header {
        display: flex !important;
      }

      #dashboard-pdf-print-root [data-universal-chart-card] > header {
        display: flex !important;
      }

      #dashboard-pdf-print-root .pdf-page {
        width: 210mm !important;
        height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        break-after: page !important;
        page-break-after: always !important;
        background: #ffffff !important;
      }

      #dashboard-pdf-print-root .pdf-page:last-child {
        break-after: auto !important;
        page-break-after: auto !important;
      }

      #dashboard-pdf-print-root .pdf-header {
        display: flex !important;
        position: relative !important;
        overflow: hidden !important;
        flex: 0 0 60px !important;
        width: 100% !important;
        height: 60px !important;
      }

      #dashboard-pdf-print-root .pdf-content {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        padding: 8mm 10mm 5mm !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: 5mm !important;
      }

      #dashboard-pdf-print-root .pdf-card-shell {
        width: 100% !important;
        min-width: 0 !important;
      }

      #dashboard-pdf-print-root [data-universal-chart-card] {
        width: 100% !important;
        max-width: none !important;
        box-sizing: border-box !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      #dashboard-pdf-print-root .recharts-responsive-container,
      #dashboard-pdf-print-root .recharts-wrapper {
        width: 100% !important;
        max-width: none !important;
      }

      #dashboard-pdf-print-root svg.recharts-surface {
        width: 100% !important;
        max-width: none !important;
      }

      #dashboard-pdf-print-root [data-pdf-static-tooltip] {
        flex: 0 0 auto !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      #dashboard-pdf-print-root .pdf-footer {
        position: relative !important;
        overflow: hidden !important;
        flex: 0 0 30px !important;
        height: 30px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        padding: 0 10mm !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 10px !important;
        background: #833177 !important;
        color: #ffffff !important;
        font-family: var(--font-sans), Inter, sans-serif !important;
        font-size: 10px !important;
        line-height: 12.5px !important;
        font-weight: 400 !important;
      }

      #dashboard-pdf-print-root * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        box-shadow: none !important;
      }

      #dashboard-pdf-print-root .pdf-vector-background {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 0 !important;
        pointer-events: none !important;
      }

      #dashboard-pdf-print-root .pdf-header > :not(.pdf-vector-background),
      #dashboard-pdf-print-root .pdf-footer > :not(.pdf-vector-background) {
        position: relative !important;
        z-index: 1 !important;
      }
    }
  `
  return style
}


function addVectorBackground(element: HTMLElement, color: string) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 100 100')
  svg.setAttribute('preserveAspectRatio', 'none')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add('pdf-vector-background')

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('x', '0')
  rect.setAttribute('y', '0')
  rect.setAttribute('width', '100')
  rect.setAttribute('height', '100')
  rect.setAttribute('fill', color)

  svg.appendChild(rect)
  element.prepend(svg)
}

function buildPrintRoot(
  header: HTMLElement,
  cards: HTMLElement[],
  userName: string,
  branchName: string,
  generatedAt: Date,
) {
  const root = document.createElement('div')
  root.id = 'dashboard-pdf-print-root'
  root.setAttribute('aria-hidden', 'true')

  cards.forEach((card, index) => {
    const page = document.createElement('section')
    page.className = 'pdf-page'

    const headerClone = header.cloneNode(true) as HTMLElement
    headerClone.classList.add('pdf-header')
    headerClone.querySelectorAll('button').forEach((element) => element.remove())
    headerClone.querySelectorAll('[data-pdf-exclude]').forEach((element) => element.remove())
    Array.from(headerClone.children)
      .slice(1)
      .forEach((element) => element.remove())
    addVectorBackground(headerClone, PURPLE)

    const content = document.createElement('main')
    content.className = 'pdf-content'

    const cardShell = document.createElement('div')
    cardShell.className = 'pdf-card-shell'

    const cardClone = card.cloneNode(true) as HTMLElement
    removePrintNoise(cardClone)
    cardShell.appendChild(cardClone)
    content.appendChild(cardShell)

    const title = card.querySelector('h2')?.textContent?.trim() || 'Gráfica'
    const context = chartContext(card)
    const tooltip = context ? buildStaticTooltip(title, context, userName) : null
    if (tooltip) content.appendChild(tooltip)

    const footer = document.createElement('footer')
    footer.className = 'pdf-footer'
    addVectorBackground(footer, PURPLE)

    const left = document.createElement('span')
    left.textContent = `${userName} · ${branchName}`

    const right = document.createElement('span')
    right.textContent = `${formatFooterDate(generatedAt)} · Página ${index + 1} de ${cards.length}`

    footer.append(left, right)
    page.append(headerClone, content, footer)
    root.appendChild(page)
  })

  return root
}

export function DashboardPdfButton({
  userName,
  branchName = 'Liverpool Galerías Perinorte',
}: DashboardPdfButtonProps) {
  const pathname = usePathname()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (isExporting) return

    const header = document.querySelector<HTMLElement>('[data-pdf-header]')
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-universal-chart-card]'))

    if (!header || cards.length === 0) {
      window.alert('No se encontraron gráficas disponibles para exportar.')
      return
    }

    setIsExporting(true)

    const generatedAt = new Date()
    const displayName = formatDisplayName(userName)
    const style = createPrintStyles()
    const root = buildPrintRoot(header, cards, displayName, branchName, generatedAt)

    const previousTitle = document.title
    document.title = `Reporte-Liverpool-${formatFileDate(generatedAt)}`

    document.head.appendChild(style)
    document.body.appendChild(root)

    const cleanup = () => {
      root.remove()
      style.remove()
      document.title = previousTitle
      setIsExporting(false)
    }

    try {
      if (document.fonts?.ready) await document.fonts.ready
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      )

      window.addEventListener('afterprint', cleanup, { once: true })
      window.print()

      window.setTimeout(() => {
        if (document.body.contains(root)) cleanup()
      }, 1000)
    } catch (error) {
      cleanup()
      console.error('PDF print export error:', error)
      const message = error instanceof Error ? error.message : String(error)
      window.alert(`No fue posible preparar el PDF. ${message}`)
    }
  }

  if (pathname !== '/') return null

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      data-pdf-exclude
      className="flex items-center gap-1.5 h-9 px-2.5 rounded-none text-white/90 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 cursor-liverpool-pointer"
      aria-label="Exportar gráficas a PDF"
      title="Exportar PDF"
    >
      {isExporting ? (
        <SquareSpinner className="w-4 h-4" />
      ) : (
        <FileDown className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="text-[10px] font-medium hidden md:inline">
        {isExporting ? 'Preparando PDF…' : 'Exportar PDF'}
      </span>
    </button>
  )
}
