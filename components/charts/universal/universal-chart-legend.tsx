import React from 'react'
import styles from './universal-chart.module.css'
import { UNIVERSAL_TARGET_SERIES } from './universal-chart-config'

export interface UniversalLegendItem {
  dataKey: string
  name?: string
  /** Base hex color (takes priority). */
  color?: string
  /** Stroke color (used when `color` is absent). */
  stroke?: string
  /** Fill color (used when both `color` and `stroke` are absent). */
  fill?: string
  /**
   * Overall opacity applied to the legend mark swatch.
   * Lets "Plan" series (typically semi-transparent) look different from "Real".
   */
  opacity?: number
  /**
   * Stroke opacity forwarded from the series definition.
   * When set, `opacity` is not inherited from the stroke alone — this is applied
   * directly to the swatch so the legend reflects the actual line appearance.
   */
  strokeOpacity?: number
  /**
   * Fill opacity forwarded from the series definition.
   * A fill with fillOpacity=0.3 produces a lighter swatch, matching the area chart.
   */
  fillOpacity?: number
}

/**
 * Resolves the effective visual opacity for a legend swatch.
 *
 * Priority:
 *  1. `opacity` (explicit overall opacity)
 *  2. `fillOpacity` when the item has a fill and no stroke
 *  3. `strokeOpacity` when the item has a stroke and no fill
 *  4. 1 (fully opaque) as default
 *
 * This ensures that a "Plan" series defined with strokeOpacity=0.25 renders
 * its legend mark at 25% opacity, visually distinct from a "Real" series at 100%.
 */
function resolveOpacity(item: UniversalLegendItem): number {
  if (item.opacity !== undefined) return item.opacity

  const hasFill = Boolean(item.fill || item.color)
  const hasStroke = Boolean(item.stroke)

  if (hasFill && item.fillOpacity !== undefined) return item.fillOpacity
  if (hasStroke && !hasFill && item.strokeOpacity !== undefined) return item.strokeOpacity

  // If the item has a strokeOpacity but also a fill (mixed series like area),
  // the fill opacity is more visually representative for the swatch.
  if (item.strokeOpacity !== undefined && item.fillOpacity === undefined) return item.strokeOpacity

  return 1
}

/**
 * Resolves the base paint color for the legend swatch.
 * Checks `color`, `stroke`, and `fill` in that order, accepting any CSS value
 * (hex, rgb, named color).  Falls back to `fallbackColor`.
 */
function resolvePaint(item: UniversalLegendItem, fallbackColor: string): string {
  return item.color || item.stroke || item.fill || fallbackColor
}

export function UniversalChartLegend({
  items,
  fallbackColor,
  comparisonKey = false,
}: {
  items: UniversalLegendItem[]
  fallbackColor: string
  comparisonKey?: boolean
}) {
  if (!items.length) return null

  return (
    <ul className={styles.legend} aria-label="Leyenda">
      {items.map((item) => {
        const paint = resolvePaint(item, fallbackColor)
        const opacity = resolveOpacity(item)

        return (
          <li key={item.dataKey} className={styles.legendItem}>
            <span
              className={styles.legendMark}
              style={{ background: paint, opacity }}
              aria-hidden="true"
            />
            <span>{item.name || item.dataKey}</span>
          </li>
        )
      })}
      {comparisonKey && (
        <li className={styles.legendItem} aria-label="Real: color sólido. Meta: representación tenue.">
          <span className={styles.legendMark} style={{ background: 'currentColor' }} aria-hidden="true" />
          <span>Real</span>
          <span className={styles.legendMark} style={{ background: 'currentColor', opacity: UNIVERSAL_TARGET_SERIES.strokeOpacity }} aria-hidden="true" />
          <span>Meta (tenue)</span>
        </li>
      )}
    </ul>
  )
}
