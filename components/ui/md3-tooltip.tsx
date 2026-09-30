'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { UniversalTooltipSurface } from '@/components/charts/universal/universal-tooltip-surface'
import {
  getUniversalPerformanceStatus,
  getUniversalSolidColor,
  UNIVERSAL_SEMAPHORE_COLORS,
  UNIVERSAL_SEMAPHORE_THRESHOLDS,
} from '@/components/charts/universal/universal-chart-colors'
import { UNIVERSAL_TARGET_SERIES } from '@/components/charts/universal/universal-chart-config'
import { toSentenceCase } from '@/lib/utils'
import { formatManagerName, formatPromoterLabel } from '@/lib/person-names'
import { useUser } from '@/components/dashboard/dashboard-client-wrapper'
import {
  formatNumber,
  formatPercent,
  getExactPercentageText,
} from '@/components/dashboard/vista-general/helpers/formatters'

interface MD3TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  isSvg?: boolean
  className?: string
}

const MONTH_NAMES: Record<string, string> = {
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

function formatDisplayName(value?: string): string {
  if (!value?.trim()) return 'Usuario'

  return value
    .trim()
    .toLocaleLowerCase('es-MX')
    .replace(
      /(^|[\s'-])(\p{L})/gu,
      (_, separator, letter) =>
        separator + letter.toLocaleUpperCase('es-MX'),
    )
}

function canonicalPromoterGroupLabel(value: string): string | null {
  const key = value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX').replace(/\s+/g, ' ')
  if (key === 'promotores de credito' || key === 'promotor de credito') return 'Promotores de Crédito'
  if (key === 'asesores de credito') return 'Asesores de Crédito'
  return null
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatDecimal(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

function getDataKey(entry: any): string {
  return String(entry?.dataKey ?? '')
}

function getEntryName(entry: any): string {
  return String(entry?.name ?? entry?.dataKey ?? 'Valor')
}

function getDisplayEntryName(entry: any): string {
  const name = getEntryName(entry)
  return ['DILISA', 'LPC', 'JUST ME', 'GARANTIZADA'].includes(name) ? name : toSentenceCase(name)
}

function getEntryColor(entry: any): string {
  return entry?.color || entry?.stroke || entry?.fill || '#833177'
}

function getPerformanceStatus(actual: number, target: number, pending: boolean): string {
  return getUniversalPerformanceStatus(actual, target, pending)
}

function isPercentageChart(dataRow: any, actualItem: any, planItem: any): boolean {
  const actualKey = getDataKey(actualItem)
  const actualName = getEntryName(actualItem)
  const planName = getEntryName(planItem)

  if (actualKey === 'avance') return true
  if (dataRow?.rawPlan !== undefined && toNumber(planItem?.value ?? dataRow?.plan) === 100) return true
  if (actualName.includes('%') || planName.includes('%')) return true
  if (dataRow?.porcentajeStr !== undefined && dataRow?.rawPlan !== undefined) return true

  return false
}

function formatEntryValue(
  entry: any,
  percentageMode: boolean,
  exactPercentage: string | null = null,
  useExactPercentage = false,
): string {
  const value = toNumber(entry?.value)

  if (percentageMode) {
    if (useExactPercentage && exactPercentage) return exactPercentage
    return formatPercent(value)
  }

  return formatNumber(value)
}

function getFriendlyExplanation({
  displayVariable,
  entries,
  dataRow,
  hasComparison,
  actualItem,
  planItem,
  actual,
  plan,
  percentage,
  percentageMode,
  pending,
  isPerson,
}: {
  displayVariable: string
  entries: any[]
  dataRow: any
  hasComparison: boolean
  actualItem: any
  planItem: any
  actual: number
  plan: number
  percentage: number
  percentageMode: boolean
  pending: boolean
  isPerson: boolean
}): string {
  if (dataRow?.comparisonBasis === 'participation') {
    const units = toNumber(dataRow.unidades)
    const total = toNumber(dataRow.totalUnidades)
    return pending || total <= 0
      ? `En ${displayVariable} todavía no hay datos suficientes para calcular su participación.`
      : `En ${displayVariable} se registraron ${formatNumber(units)} de ${formatNumber(total)} unidades; esto representa ${formatPercent(actual)} del total.`
  }

  if (dataRow?.comparisonBasis === 'maximum') {
    return pending
      ? `En ${displayVariable} todavía no hay un resultado cerrado para comparar entre secciones.`
      : `En ${displayVariable} se registraron ${formatNumber(actual)} unidades. La referencia de ${formatNumber(plan)} es el valor mayor entre las secciones mostradas; ${formatPercent(percentage)} indica su proporción respecto a esa referencia. No hay una meta registrada.`
  }

  if (hasComparison) {
    const exactPercentage = getExactPercentageText(dataRow)
    const actualText = formatEntryValue(
      actualItem,
      percentageMode,
      exactPercentage,
      true,
    )
    const planText = formatEntryValue(planItem, percentageMode)
    const percentageText = exactPercentage || formatPercent(percentage)
    const difference = actual - plan
    const absoluteDifference = Math.abs(difference)
    const differenceText = percentageMode
      ? `${formatDecimal(absoluteDifference)} puntos porcentuales`
      : formatNumber(absoluteDifference)

    if (pending) {
      return `${displayVariable} todavía está pendiente de evaluación. La meta está definida en ${planText}, pero aún no hay un resultado registrado para compararla.`
    }

    if (plan <= 0) {
      return isPerson
        ? `${displayVariable} registra ${actualText}, pero no hay una meta disponible para calcular su cumplimiento.`
        : `En ${displayVariable} se registró un resultado de ${actualText}, pero no hay una meta disponible para calcular su cumplimiento.`
    }

    if (isPerson) {
      if (percentage < UNIVERSAL_SEMAPHORE_THRESHOLDS.MEDIUM_MIN) {
        return `${displayVariable} registra ${actualText} frente a una meta de ${planText}. Su cumplimiento es de ${percentageText} y el avance todavía está en una etapa inicial.`
      }

      if (percentage < UNIVERSAL_SEMAPHORE_THRESHOLDS.HIGH_MIN) {
        return `${displayVariable} registra ${actualText} frente a una meta de ${planText}. Ha alcanzado ${percentageText} de cumplimiento y todavía faltan ${differenceText} para llegar a la meta.`
      }

      if (percentage < 100) {
        return `${displayVariable} registra ${actualText} frente a una meta de ${planText}. Su cumplimiento es de ${percentageText}; el avance es sólido y faltan ${differenceText} para completar la meta.`
      }

      if (percentage === 100) {
        return `${displayVariable} alcanzó la meta establecida, con un cumplimiento de ${percentageText}.`
      }

      return `${displayVariable} registra ${actualText} frente a una meta de ${planText}. Su cumplimiento es de ${percentageText} y supera la meta por ${differenceText}.`
    }

    if (percentage < UNIVERSAL_SEMAPHORE_THRESHOLDS.MEDIUM_MIN) {
      return `En ${displayVariable}, el resultado es ${actualText} frente a una meta de ${planText}. Esto representa ${percentageText} de cumplimiento, así que el avance todavía está en una etapa inicial.`
    }

    if (percentage < UNIVERSAL_SEMAPHORE_THRESHOLDS.HIGH_MIN) {
      return `En ${displayVariable}, el resultado es ${actualText} frente a una meta de ${planText}. Ya se alcanzó ${percentageText} de cumplimiento y todavía faltan ${differenceText} para llegar a la meta.`
    }

    if (percentage < 100) {
      return `En ${displayVariable}, el resultado es ${actualText} frente a una meta de ${planText}. El cumplimiento es de ${percentageText}; el avance es sólido y faltan ${differenceText} para completar la meta.`
    }

    if (percentage === 100) {
      return `En ${displayVariable}, la meta está cumplida. El cumplimiento es de ${percentageText}.`
    }

    return `En ${displayVariable}, el resultado es ${actualText} frente a una meta de ${planText}. El cumplimiento es de ${percentageText} y la meta fue superada por ${differenceText}.`
  }

  if (pending) {
    return isPerson
      ? `${displayVariable} todavía está pendiente de evaluación. Aún no hay resultados registrados.`
      : `${displayVariable} todavía está pendiente de evaluación. Aún no hay resultados registrados para este periodo.`
  }

  if (entries.length === 0) {
    return isPerson
      ? `Todavía no hay información suficiente para interpretar el resultado de ${displayVariable}.`
      : `En ${displayVariable} todavía no hay información suficiente para interpretar este punto.`
  }

  const sortedEntries = [...entries].sort((a, b) => toNumber(b?.value) - toNumber(a?.value))
  const leadingEntry = sortedEntries[0]
  const leadingName = getDisplayEntryName(leadingEntry)
  const leadingValue = formatNumber(toNumber(leadingEntry?.value))

  if (dataRow?.total !== undefined) {
    return `En ${displayVariable}, el total registrado es ${formatNumber(toNumber(dataRow.total))}. El mayor aporte corresponde a ${leadingName}, con ${leadingValue}.`
  }

  if (entries.length > 1) {
    return isPerson
      ? `${displayVariable} presenta ${entries.length} valores comparables. El más alto corresponde a ${leadingName}, con ${leadingValue}.`
      : `En ${displayVariable} se comparan ${entries.length} valores. El valor más alto corresponde a ${leadingName}, con ${leadingValue}.`
  }

  return isPerson
    ? `${displayVariable} registra ${leadingName} con un valor de ${leadingValue}.`
    : `En ${displayVariable} se registró ${leadingName} con un valor de ${leadingValue}.`
}

export function MD3Tooltip({ children, content, isSvg = false, className }: MD3TooltipProps) {
  const [show, setShow] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)
  const [tooltipSize, setTooltipSize] = useState({ width: 240, height: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!show || !tooltipRef.current) return

    const element = tooltipRef.current
    const updateSize = () => {
      const rect = element.getBoundingClientRect()
      setTooltipSize({ width: rect.width || 240, height: rect.height })
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [show, content])

  const handleMouseMove = (event: React.MouseEvent) => {
    setPos({ x: event.clientX, y: event.clientY })
  }

  const gap = 12
  const viewportPadding = 12
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
  const tooltipWidth = tooltipSize.width || 240
  const tooltipHeight = tooltipSize.height

  let tooltipLeft = pos.x + gap
  if (viewportWidth && tooltipLeft + tooltipWidth > viewportWidth - viewportPadding) {
    tooltipLeft = pos.x - tooltipWidth - gap
  }
  if (viewportWidth) {
    tooltipLeft = Math.max(
      viewportPadding,
      Math.min(tooltipLeft, Math.max(viewportPadding, viewportWidth - tooltipWidth - viewportPadding)),
    )
  }

  let tooltipTop = pos.y + gap
  if (viewportHeight && tooltipHeight && tooltipTop + tooltipHeight > viewportHeight - viewportPadding) {
    tooltipTop = pos.y - tooltipHeight - gap
  }
  if (viewportHeight && tooltipHeight) {
    tooltipTop = Math.max(
      viewportPadding,
      Math.min(tooltipTop, Math.max(viewportPadding, viewportHeight - tooltipHeight - viewportPadding)),
    )
  }

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className="fixed z-50 pointer-events-none"
      style={{ left: tooltipLeft, top: tooltipTop }}
    >
      <UniversalTooltipSurface>{content}</UniversalTooltipSurface>
    </div>
  )

  const Wrapper = isSvg ? 'g' : 'div'

  return (
    <>
      <Wrapper
        className={isSvg ? '' : className || 'relative inline-block'}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onMouseMove={handleMouseMove}
      >
        {children}
      </Wrapper>
      {mounted && show && content && createPortal(tooltipContent, document.body)}
    </>
  )
}

export interface CustomChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string | number
  /** Explicit units for both sides of a comparison; omitted keeps legacy detection. */
  comparisonFormat?: 'percentage' | 'number'
  /** Multiple named Real/Meta pairs, rendered within the same tooltip surface. */
  comparisonGroups?: Array<{
    name: string
    actualKey: string
    targetKey: string
    color: string
  }>
}

export function CustomChartTooltip({ active, payload, label, comparisonFormat, comparisonGroups }: CustomChartTooltipProps) {
  const { userName } = useUser()

  if (!active || !Array.isArray(payload) || payload.length === 0) return null

  const dataRow = payload[0]?.payload ?? {}
  const rawVariable =
    label ??
    dataRow.mes ??
    dataRow.name ??
    dataRow.jefe ??
    dataRow.asesor ??
    dataRow.promotor ??
    dataRow.colaborador ??
    dataRow.producto ??
    'Periodo'
  const mappedVariable = MONTH_NAMES[String(rawVariable)] || String(rawVariable)
  const isRankingPerson = typeof dataRow.name === 'string' &&
    Object.prototype.hasOwnProperty.call(dataRow, 'avance') &&
    Object.prototype.hasOwnProperty.call(dataRow, 'plan')
  const isManagerRanking = isRankingPerson && dataRow.personType === 'manager'
  const rankingLabel = isRankingPerson
    ? isManagerRanking
      ? formatManagerName(mappedVariable)
      : formatPromoterLabel(mappedVariable)
    : ''
  const groupLabel = isRankingPerson && !isManagerRanking
    ? canonicalPromoterGroupLabel(mappedVariable) ?? canonicalPromoterGroupLabel(rankingLabel)
    : null
  const isGroup = groupLabel !== null
  const isPerson = Boolean(
    dataRow.jefe ||
    dataRow.asesor ||
    dataRow.promotor ||
    dataRow.colaborador ||
    (isRankingPerson && !isGroup),
  )
  const displayVariable = groupLabel ?? (
    isManagerRanking
      ? rankingLabel
      : isPerson
        ? formatDisplayName(rankingLabel || mappedVariable)
        : toSentenceCase(mappedVariable)
  )
  const entries = payload.filter(
    (entry: any) => entry && entry.value !== undefined && entry.value !== null &&
      (!comparisonGroups?.length || comparisonGroups.some((group) => group.actualKey === getDataKey(entry)))
  )

  const planItem = comparisonGroups?.length ? undefined : entries.find((entry: any) => {
    const key = getDataKey(entry).toLowerCase()
    const name = getEntryName(entry).toLowerCase()
    return key === 'plan' || key === 'target' || name.includes('plan') || name.includes('meta')
  })

  const actualItem = entries.find((entry: any) => {
    const key = getDataKey(entry).toLowerCase()
    return ['real', 'aprobadas', 'avance', 'actual'].includes(key)
  }) ?? entries.find((entry: any) => entry !== planItem)

  const hasComparison = Boolean(planItem && actualItem)
  const actual = hasComparison ? toNumber(actualItem?.value) : 0
  const plan = hasComparison ? toNumber(planItem?.value) : 0
  const pendingByText = ['-', '—'].includes(String(dataRow?.porcentajeStr ?? '').trim())
  const pending = dataRow?.isPending === true || (dataRow?.isPending !== false && pendingByText)
  const performanceColor = hasComparison
    ? getUniversalSolidColor(actual, plan)
    : getEntryColor(entries[0])
  const accentColor = pending ? UNIVERSAL_SEMAPHORE_COLORS.PENDING : performanceColor
  const percentage = plan > 0 ? (actual / plan) * 100 : 0
  const exactPercentage = getExactPercentageText(dataRow)
  const percentageMode = hasComparison
    ? comparisonFormat ? comparisonFormat === 'percentage' : isPercentageChart(dataRow, actualItem, planItem)
    : false
  const comparisonBasis = dataRow?.comparisonBasis
  const status = hasComparison
    ? comparisonBasis === 'participation'
      ? pending ? 'Sin datos de participación' : 'Participación del total'
      : comparisonBasis === 'maximum'
        ? pending ? 'Pendiente de evaluación' : 'Comparación entre secciones'
        : getPerformanceStatus(actual, plan, pending)
    : ''
  const explanation = getFriendlyExplanation({
    displayVariable,
    entries,
    dataRow,
    hasComparison,
    actualItem,
    planItem,
    actual,
    plan,
    percentage,
    percentageMode,
    pending,
    isPerson,
  })

  return (
    <UniversalTooltipSurface accentColor={accentColor}>
      <div
        className="px-2.5 pt-2.5 pb-2 border-b"
        style={{ borderColor: `${accentColor}33`, color: accentColor }}
      >
        <div className="mb-1">
          Hola, {formatDisplayName(userName)}
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <span className="min-w-0 break-words">
            {displayVariable}
          </span>
          {hasComparison && (
            <span
              className="max-w-full px-1.5 py-0.5 break-words"
              style={{
                color: accentColor,
                backgroundColor: `${accentColor}12`,
              }}
            >
              {status}
            </span>
          )}
        </div>
      </div>

      <div className="px-2.5 py-2 flex flex-col gap-2">
        {comparisonGroups?.length ? comparisonGroups.map((group) => {
          const color = pending ? UNIVERSAL_SEMAPHORE_COLORS.PENDING : group.color
          const valueFor = (key: string) => {
            const value = payload.find((entry) => getDataKey(entry) === key)?.value ?? dataRow[key]
            if (pending || value === undefined || value === null) return '-'
            return formatEntryValue({ value }, comparisonFormat === 'percentage')
          }
          return (
            <div key={group.actualKey} className="flex flex-col gap-1.5" style={{ color }}>
              <span>{group.name}</span>
              <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span className="w-[5px] h-[12.5px] shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                    Real
                  </span>
                  <span className="font-mono tabular-nums">{valueFor(group.actualKey)}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span className="w-[5px] h-[12.5px] shrink-0" style={{ backgroundColor: color, opacity: UNIVERSAL_TARGET_SERIES.strokeOpacity }} aria-hidden="true" />
                    Meta
                  </span>
                  <span className="font-mono tabular-nums">{valueFor(group.targetKey)}</span>
                </div>
              </div>
            </div>
          )
        }) : entries.map((entry: any, index: number) => {
          const isPlan = entry === planItem
          const isActual = entry === actualItem
          const entryLabel = comparisonBasis === 'participation'
            ? isPlan ? 'Total de canales' : isActual ? 'Unidades del canal' : getDisplayEntryName(entry)
            : comparisonBasis === 'maximum' && isPlan
              ? 'Referencia mayor sección'
              : getDisplayEntryName(entry)
          const markerColor = pending || (hasComparison && (isPlan || isActual))
            ? accentColor
            : getEntryColor(entry)
          const valueColor = pending || hasComparison ? accentColor : getEntryColor(entry)
          const displayedValue = comparisonBasis === 'participation' && (isPlan || isActual)
            ? pending ? '-' : formatNumber(toNumber(isPlan ? dataRow.totalUnidades : dataRow.unidades))
            : pending && (!hasComparison || isActual)
              ? '-'
              : formatEntryValue(
                entry,
                percentageMode,
                exactPercentage,
                isActual,
              )

          return (
            <div
              key={`${getDataKey(entry)}-${index}`}
              className="flex items-start justify-between gap-3"
            >
              <span className="min-w-0 flex items-center gap-2">
                <span
                  className="w-[5px] h-[12.5px] shrink-0"
                  style={{
                    backgroundColor: markerColor,
                    opacity: isPlan && hasComparison ? UNIVERSAL_TARGET_SERIES.strokeOpacity : 1,
                  }}
                />
                <span className="break-words">{entryLabel}</span>
              </span>
              <span
                className="shrink-0 font-mono tabular-nums"
                style={{ color: valueColor }}
              >
                {displayedValue}
              </span>
            </div>
          )
        })}

        {hasComparison && (
          <div
            className="mt-0.5 pt-2 border-t flex items-center justify-between gap-3"
            style={{ borderColor: `${accentColor}24` }}
          >
            <span style={{ color: accentColor }}>
              {comparisonBasis === 'participation' ? 'Participación' : comparisonBasis === 'maximum' ? 'Respecto al máximo' : 'Cumplimiento'}
            </span>
            <span
              className="font-mono tabular-nums"
              style={{ color: accentColor }}
            >
              {pending
                ? '-'
                : comparisonBasis === 'participation'
                  ? exactPercentage || formatPercent(actual)
                : plan > 0
                  ? exactPercentage || formatPercent(percentage)
                  : '-'}
            </span>
          </div>
        )}

        {dataRow?.diferencia !== undefined && (
          <div className="flex items-start justify-between gap-3">
            <span style={{ color: accentColor }}>Desviación</span>
            <span
              className="font-mono tabular-nums"
              style={{ color: accentColor }}
            >
              {pending
                ? '-'
                : `${toNumber(dataRow.diferencia) > 0 ? '+' : ''}${formatNumber(toNumber(dataRow.diferencia))}`}
            </span>
          </div>
        )}

        {!hasComparison && dataRow?.total !== undefined && (
          <div
            className="mt-0.5 pt-2 border-t flex items-center justify-between gap-3"
            style={{ borderColor: `${accentColor}24` }}
          >
            <span style={{ color: accentColor }}>Total</span>
            <span
              className="font-mono tabular-nums"
              style={{ color: accentColor }}
            >
              {pending ? '-' : formatNumber(toNumber(dataRow.total))}
            </span>
          </div>
        )}
      </div>

      <div
        data-tooltip-explanation
        className="px-2.5 py-2.5 border-t"
        style={{ borderColor: `${accentColor}33`, color: accentColor }}
      >
        {explanation}
      </div>
    </UniversalTooltipSurface>

  )
}

export const MD3RechartsTooltip = CustomChartTooltip
