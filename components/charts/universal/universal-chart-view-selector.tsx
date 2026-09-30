'use client'

import React, { useEffect, useRef, useState } from 'react'
import { getChartTypeIcon, UNIVERSAL_VIEW_TYPES, type ViewType } from '../chart-types'
import styles from './universal-chart.module.css'

const VIEW_LABELS: Record<ViewType, string> = {
  bar: 'Barras',
  line: 'Líneas',
  area: 'Área',
  radar: 'Radar',
}

export interface UniversalChartViewSelectorProps {
  viewType: ViewType
  accentColor?: string
  label?: string
  onChange: (viewType: ViewType) => void
}

/**
 * Selector universal reutilizable de vistas. Conserva exactamente el mismo
 * lenguaje visual del control incluido en UniversalChartCard.
 */
export function UniversalChartViewSelector({
  viewType,
  accentColor = '#833177',
  label = 'gráfica',
  onChange,
}: UniversalChartViewSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const ControlIcon = getChartTypeIcon(viewType)

  useEffect(() => {
    if (!open) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const selectView = (nextViewType: ViewType) => {
    if (nextViewType !== viewType) onChange(nextViewType)
    setOpen(false)
  }

  return (
    <div className={styles.controlGroup} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={styles.control}
        style={{ color: accentColor, backgroundColor: `${accentColor}18` }}
        aria-label={`Elegir tipo de gráfica de ${label}`}
        aria-expanded={open}
        aria-haspopup="menu"
        title={`Tipo actual: ${VIEW_LABELS[viewType]}`}
      >
        <ControlIcon size={20} aria-hidden="true" />
      </button>

      {open && (
        <div className={styles.viewSelector} role="menu" aria-label={`Tipo de gráfica para ${label}`}>
          {UNIVERSAL_VIEW_TYPES.map((option) => {
            const OptionIcon = getChartTypeIcon(option)
            const selected = option === viewType
            return (
              <button
                key={option}
                type="button"
                className={styles.viewSelectorButton}
                style={{
                  color: accentColor,
                  backgroundColor: `${accentColor}${selected ? '24' : '12'}`,
                }}
                onClick={() => selectView(option)}
                role="menuitemradio"
                aria-checked={selected}
                aria-label={`Ver como ${VIEW_LABELS[option]}`}
                title={VIEW_LABELS[option]}
              >
                <OptionIcon size={20} aria-hidden="true" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
