'use client'

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { FullScreenSplash } from '@/components/ui/full-screen-splash'
import { tryGetDashboardData } from '@/lib/actions'
import type { DashboardData } from '@/lib/dashboard-data'
import { cn } from '@/lib/utils'

interface LogoutContextType {
  isLoggingOut: boolean
  triggerLogout: () => void
}

const LogoutContext = createContext<LogoutContextType>({
  isLoggingOut: false,
  triggerLogout: () => {},
})

export const useLogout = () => useContext(LogoutContext)

interface UserContextType {
  userName: string
}

const UserContext = createContext<UserContextType>({
  userName: 'Usuario',
})

export const useUser = () => useContext(UserContext)

interface DashboardBootstrapContextType {
  initialData: DashboardData | null
  reportRendered: () => void
}

const DashboardBootstrapContext = createContext<DashboardBootstrapContextType>({
  initialData: null,
  reportRendered: () => {},
})

export const useDashboardBootstrap = () => useContext(DashboardBootstrapContext)

interface DashboardClientWrapperProps {
  userName?: string
  children: React.ReactNode
}

function isDashboardData(value: DashboardData | null): value is DashboardData {
  return Boolean(
    value &&
    Array.isArray(value.planVsReal) &&
    Array.isArray(value.jefesVentas) &&
    Array.isArray(value.promotores) &&
    Array.isArray(value.tiposTarjeta) &&
    Array.isArray(value.participacionCanal) &&
    value.kpis
  )
}

export function DashboardClientWrapper({ userName, children }: DashboardClientWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const route = pathname?.replace(/\/+$/, '') || '/'
  const needsInitialData = route === '/' || route === '/jefes-de-ventas' || route === '/promotores'
  const [initialData, setInitialData] = useState<DashboardData | null>(null)
  const [viewReady, setViewReady] = useState(false)
  const [splashFinished, setSplashFinished] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const reportRendered = useCallback(() => setViewReady(true), [])

  useEffect(() => {
    if (!needsInitialData) return

    let active = true
    let retryTimer: number | undefined
    let failures = 0

    const loadInitialData = async () => {
      let data: DashboardData | null = null

      try {
        data = await tryGetDashboardData()
      } catch (error) {
        console.error('[Dashboard bootstrap] Falló el transporte de tryGetDashboardData:', error)
      }

      if (!active) return

      if (isDashboardData(data)) {
        setInitialData(data)
        return
      }

      failures += 1
      console.warn(
        `[Dashboard bootstrap] Datos todavía no disponibles. Reintento ${failures}.`
      )

      retryTimer = window.setTimeout(
        loadInitialData,
        Math.min(1000 * 2 ** Math.min(failures - 1, 3), 5000)
      )
    }

    loadInitialData()

    return () => {
      active = false
      if (retryTimer !== undefined) window.clearTimeout(retryTimer)
    }
  }, [needsInitialData])

  /*
   * initialData ya significa que Google Sheets respondió con la estructura del
   * dashboard. Esperamos dos frames para permitir que children se monte y que
   * el navegador haga al menos un ciclo real de render antes de retirar el splash.
   *
   * reportRendered() se conserva para las vistas que quieran confirmar antes.
   */
  useEffect(() => {
    if (!needsInitialData || !initialData || viewReady) return

    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setViewReady(true)
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      if (secondFrame) window.cancelAnimationFrame(secondFrame)
    }
  }, [needsInitialData, initialData, viewReady])

  // Las rutas de detalle entregan su contenido desde el servidor y no usan MainContent.
  useEffect(() => {
    if (needsInitialData || splashFinished) return
    if (
      route === '/' ||
      route === '/jefes-de-ventas' ||
      route === '/promotores' ||
      route === '/periodos' ||
      route === '/colaboradores' ||
      route.startsWith('/jefes-de-ventas/')
    ) return

    const frame = window.requestAnimationFrame(reportRendered)
    return () => window.cancelAnimationFrame(frame)
  }, [needsInitialData, route, reportRendered, splashFinished])

  const handlePerformLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout API call failed:', err)
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <LogoutContext.Provider value={{ isLoggingOut, triggerLogout: () => setIsLoggingOut(true) }}>
      <UserContext.Provider value={{ userName: userName || 'Usuario' }}>
        <DashboardBootstrapContext.Provider value={{ initialData, reportRendered }}>
          {/* Login Splash Screen */}
          {!splashFinished && (
            <FullScreenSplash
              userName={userName}
              ready={viewReady}
              mode="login"
              onComplete={() => setSplashFinished(true)}
            />
          )}

          {/* Logout Splash Screen */}
          {isLoggingOut && (
            <FullScreenSplash
              userName={userName}
              ready={true}
              mode="logout"
              onComplete={handlePerformLogout}
            />
          )}

          {/* Main App Dashboard with smooth power-off animation */}
          {(!needsInitialData || initialData) && (
            <div
              inert={!splashFinished}
              aria-hidden={!splashFinished}
              className={cn(
                "w-full h-full transition-all duration-1000 ease-in-out transform origin-center",
                isLoggingOut && "scale-95 opacity-0 filter brightness-50 blur-[2px] pointer-events-none"
              )}
            >
              {children}
            </div>
          )}
        </DashboardBootstrapContext.Provider>
      </UserContext.Provider>
    </LogoutContext.Provider>
  )
}
