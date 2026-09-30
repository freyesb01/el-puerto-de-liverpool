'use client'

import React, { useState, useEffect } from 'react'
import { type MD3ProgressTone } from './md3-progress-bar'

interface ThinMD3ProgressBarProps {
  percentage: number
  tone?: MD3ProgressTone
  color?: string
  showDot?: boolean
}

const TONE_COLORS: Record<MD3ProgressTone, string> = {
  success: '#833177',
  risk: '#ff6d01',
  base: '#833177'
}

export function ThinMD3ProgressBar({ 
  percentage, 
  tone = 'base',
  color,
  showDot = true
}: ThinMD3ProgressBarProps) {
  const [isMounted, setIsMounted] = useState(false)
  const safePercentage = Math.max(0, Math.min(100, percentage))
  const activeColor = color || TONE_COLORS[tone] || '#833177'

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  const transitionStyle: React.CSSProperties = {
    transition: 'all 1.2s ease-in-out'
  }

  const activeX2 = isMounted && safePercentage > 0 ? `calc(${safePercentage}% - 5px)` : '2.5px'
  const trackX1 = isMounted && safePercentage > 0 ? `calc(${safePercentage}% + 5px)` : '2.5px'

  return (
    <div className="w-full">
      <svg width="100%" height="10" className="overflow-visible" xmlns="http://www.w3.org/2000/svg">
        <line 
          x1="2.5" 
          y1="5" 
          x2={activeX2} 
          y2="5" 
          stroke={activeColor} 
          strokeWidth="5" 
          strokeLinecap="square"
          style={transitionStyle}
        />
        <line 
          x1={trackX1} 
          y1="5" 
          x2="calc(100% - 2.5px)" 
          y2="5" 
          stroke={activeColor} 
          strokeOpacity="0.125" 
          strokeWidth="5" 
          strokeLinecap="square"
          style={transitionStyle}
        />
        <rect x="calc(100% - 5px)" y="2.5" width="5" height="5" fill={activeColor} />
      </svg>
    </div>
  )
}
