import React from 'react'
import { cn } from '@/lib/utils'

interface MD3TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
}

export function MD3Tab({
  children,
  className,
  isActive = false,
  ...props
}: MD3TabProps) {
  return (
    <button
      className={cn(
        "relative flex items-center justify-center gap-2 h-12 px-4 text-[10px] font-medium transition-colors focus-visible:outline-none cursor-liverpool-pointer",
        isActive 
          ? "text-[#833177] font-semibold" 
          : "text-[#49454F] hover:text-[#1D1B20] hover:bg-black/5",
        className
      )}
      {...props}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] rounded-none bg-[#833177]" />
      )}
    </button>
  )
}
