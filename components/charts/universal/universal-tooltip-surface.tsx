'use client'

import React from 'react'
import styles from './universal-chart.module.css'

export function UniversalTooltipSurface({
  children,
  className = '',
  accentColor = '#833177',
}: {
  children: React.ReactNode
  className?: string
  accentColor?: string
}) {
  return (
    <div
      data-universal-tooltip
      className={`${styles.tooltip}${className ? ` ${className}` : ''}`}
      style={{ '--tooltip-accent': accentColor } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
