'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { LiverpoolLogo } from '@/components/liverpool-logo'
import { SquareSpinner } from '@/components/ui/square-spinner'
import { DashboardPdfButton } from '@/components/dashboard/dashboard-pdf-button'

interface AuthenticatedAppHeaderProps {
  userName?: string
}

function formatDisplayName(value: string) {
  return value
  .trim()
  .toLocaleLowerCase('es-MX')
  .replace(
    /(^|[\s'-])(\p{L})/gu,
           (_, separator, letter) =>
           separator + letter.toLocaleUpperCase('es-MX'),
  )
}

export function AuthenticatedAppHeader({ userName }: AuthenticatedAppHeaderProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Logout request failed')
      }

      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  const displayName = formatDisplayName(userName?.trim() || 'Usuario')
  const initial = displayName.charAt(0).toUpperCase() || 'U'

  return (
    <header
    data-pdf-header
    className="w-full bg-[#833177] h-[60px] flex items-center justify-between px-4 sm:px-6 shrink-0"
    >
    <div className="flex items-center min-w-0">
    <LiverpoolLogo className="h-7 w-auto text-white" />
    </div>

    <div className="flex items-center gap-3 min-w-0">
    <div className="flex items-center gap-2.5 min-w-0">
    <div
    className="w-8 h-8 rounded-none bg-white/15 border border-white/20 flex items-center justify-center text-white font-bold text-[10px] shrink-0 select-none"
    aria-hidden="true"
    >
    {initial}
    </div>

    <div
    data-pdf-force-visible
    className="hidden sm:flex flex-col text-left leading-tight min-w-0"
    >
    <span className="text-[10px] font-normal text-white truncate max-w-[200px]">
    {displayName}
    </span>

    <span className="text-[10px] text-white/70 truncate">
    Liverpool Galerías Perinorte
    </span>
    </div>
    </div>

    <div
    data-pdf-exclude
    className="h-5 w-px bg-white/25 mx-1 hidden sm:block"
    aria-hidden="true"
    />

    <DashboardPdfButton userName={displayName} />

    <button
    type="button"
    onClick={handleLogout}
    disabled={isLoggingOut}
    data-pdf-exclude
    className="flex items-center gap-1.5 h-9 px-2.5 rounded-none text-white/90 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 cursor-liverpool-pointer"
    aria-label="Cerrar sesión"
    title="Cerrar sesión"
    >
    {isLoggingOut ? (
      <SquareSpinner className="w-4 h-4" />
    ) : (
      <LogOut className="w-4 h-4" aria-hidden="true" />
    )}

    <span className="text-[10px] font-medium hidden md:inline">
    Cerrar sesión
    </span>
    </button>
    </div>
    </header>
  )
}
