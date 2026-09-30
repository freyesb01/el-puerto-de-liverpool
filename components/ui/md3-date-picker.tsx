'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MD3Tooltip } from '@/components/ui/md3-tooltip'

export interface MD3DayData {
  performance?: 'high' | 'risk' | 'neutral'
  metrics?: string
}

interface MD3DatePickerProps {
  selectedDate?: Date
  onSelect?: (date: Date) => void
  getPerformanceData?: (date: Date) => MD3DayData | undefined
}

export function MD3DatePicker({ selectedDate = new Date(2026, 7, 17), onSelect, getPerformanceData }: MD3DatePickerProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))

  const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  const firstDay = new Date(year, month, 1).getDay()
  const startDayOffset = firstDay === 0 ? 6 : firstDay - 1
  
  const days = []
  for (let i = 0; i < startDayOffset; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const handleSelect = (d: number | null) => {
    if (d === null) return
    const newDate = new Date(year, month, d)
    setCurrentDate(newDate)
    if (onSelect) onSelect(newDate)
  }

  const formatHeaderDate = (d: Date) => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}`
  }

  const getDayData = (d: number) => {
    if (!getPerformanceData) return undefined;
    return getPerformanceData(new Date(year, month, d));
  }

  const formatMonthYear = (d: Date) => {
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1))
  }

  return (
    <div className="w-[360px] bg-[#FAFAFA] rounded-none border border-border overflow-hidden flex flex-col font-sans shrink-0">
      <div className="h-[120px] bg-[#833177] px-6 py-4 flex flex-col justify-between text-white shrink-0">
        <span className="text-[10px] leading-[15px] font-medium opacity-80">Seleccionar fecha</span>
        <span className="text-[10px] leading-[30px] font-bold">{formatHeaderDate(currentDate)}</span>
      </div>

      <div className="p-[15px] flex-1">
        <div className="flex justify-between items-center mb-4 px-2">
          <span className="text-[10px] leading-[15px] font-bold text-[#49454F]">{formatMonthYear(viewDate)}</span>
          <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-black/5 rounded-none transition-none cursor-liverpool-pointer" aria-label="Mes anterior">
              <ChevronLeft className="w-5 h-5 text-[#49454F]" aria-hidden="true" />
            </button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-black/5 rounded-none transition-none cursor-liverpool-pointer" aria-label="Mes siguiente">
              <ChevronRight className="w-5 h-5 text-[#49454F]" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {daysOfWeek.map((d, i) => (
            <div key={i} className="text-left text-[10px] leading-[12.5px] font-bold text-[#49454F] h-10 flex items-center justify-center">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {days.map((d, i) => {
            if (d === null) {
              return <div key={`empty-${i}`} className="h-10 w-10" />
            }
            
            const isSelected = d === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()
            const data = getDayData(d)
            const hasPerformance = data && data.performance
            
            const dayContent = (
              <button 
                key={i}
                onClick={() => handleSelect(d)}
                className="h-10 w-10 mx-auto rounded-none flex flex-col items-center justify-center relative hover:bg-black/5 transition-none cursor-liverpool-pointer"
                style={{
                  backgroundColor: isSelected ? '#833177' : 'transparent',
                  color: isSelected ? 'white' : '#1D1B20'
                }}
              >
                <span className="text-[10px] leading-[15px] font-medium mt-0.5">{d}</span>
                {hasPerformance && (
                  <div 
                    className="w-1.5 h-1.5 rounded-none absolute bottom-1.5"
                    style={{ 
                      backgroundColor: data.performance === 'high' ? '#833177' : data.performance === 'risk' ? '#ff6d01' : 'transparent' 
                    }}
                  />
                )}
              </button>
            )

            if (data?.metrics) {
              return (
                <div key={i} className="flex justify-center">
                  <MD3Tooltip content={data.metrics}>
                    {dayContent}
                  </MD3Tooltip>
                </div>
              )
            }
            return <div key={i} className="flex justify-center">{dayContent}</div>
          })}
        </div>
      </div>
    </div>
  )
}
