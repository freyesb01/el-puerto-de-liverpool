'use client'

import React, { useRef, useState, useEffect } from 'react'

export type MD3ProgressTone = 'success' | 'risk' | 'base'

interface MD3ProgressBarProps {
  progress: number
  tone?: MD3ProgressTone
}

const TONE_COLORS: Record<MD3ProgressTone, string> = {
  success: '#833177',
  risk: '#ff6d01',
  base: '#833177'
}

export function MD3ProgressBar({ progress, tone = 'base' }: MD3ProgressBarProps) {
  const [width, setWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const strokeWidth = 8
  const padding = strokeWidth / 2
  const maxLineLength = Math.max(0, width - strokeWidth)
  const validProgress = Math.max(0, Math.min(100, progress))
  const length = (validProgress / 100) * maxLineLength

  return (
    <div ref={containerRef} className="w-full h-[8px] block relative">
      {width > 0 && (
        <svg width={width} height={strokeWidth} className="block absolute top-0 left-0 overflow-visible">
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="#833177"
            strokeOpacity={0.15}
            strokeWidth={strokeWidth}
            strokeLinecap="square"
          />
          {length > 0 && (
            <line
              x1={padding}
              y1={padding}
              x2={padding + length}
              y2={padding}
              stroke={TONE_COLORS[tone]}
              strokeWidth={strokeWidth}
              strokeLinecap="square"
            />
          )}
        </svg>
      )}
    </div>
  )
}
