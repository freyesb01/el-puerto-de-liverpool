'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, History, Users } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import type { DashboardData } from '@/lib/types'
import { formatManagerName, getManagerIdentityKey } from '@/lib/person-names'
import { tryGetDashboardData } from '@/lib/actions'
import { useDashboardBootstrap } from '../dashboard-client-wrapper'
import { CollaboratorPerformanceView } from './collaborator-performance-view'

const POLL_INTERVAL = 5000

interface Props {
  data: DashboardData
}

export function JefeDetailClient({ data: initialData }: Props) {
  const { reportRendered } = useDashboardBootstrap()
  const params = useParams()
  const routeName = decodeURIComponent(String(params.id || ''))
  const canonicalRouteName = formatManagerName(routeName) || routeName
  const managerKey = getManagerIdentityKey(canonicalRouteName)

  const [data, setData] = useState(initialData)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    reportRendered()
  }, [reportRendered])

  useEffect(() => {
    const refresh = async () => {
      try {
        const next = await tryGetDashboardData()
        if (next) setData(next)
      } catch {
        // Conserva el último snapshot válido durante una desconexión.
      }
    }

    timer.current = setInterval(refresh, POLL_INTERVAL)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [])

  const jefe = useMemo(
    () => data.jefesVentas.find((item) => getManagerIdentityKey(item.jefe) === managerKey),
    [data.jefesVentas, managerKey],
  )

  const currentMembers = jefe?.equipoActual ?? []
  const historicalMembers = jefe?.equipo ?? []
  const isActive = Boolean(jefe?.activo && currentMembers.length > 0)
  const members = isActive ? currentMembers : historicalMembers

  const rosterLabel = isActive
    ? `Plantilla actual · ${data.ultimoMesConDatos || jefe?.ultimoMes || 'último mes con datos'}`
    : `Histórico · hasta ${jefe?.ultimoMes || data.ultimoMesConDatos || 'último mes con datos'}`

  const totalHistoricalAssignments = jefe?.historialEquipo?.length ?? 0

  return (
    <main className="flex-1 overflow-y-auto p-[5px] flex flex-col gap-[5px] pb-[5px]">
      <section className="flex items-center justify-between gap-[10px] border border-border bg-card p-[15px]">
        <div className="flex min-w-0 items-center gap-[10px]">
          <Link
            href="/jefes-de-ventas"
            className="grid h-[45px] w-[45px] shrink-0 place-items-center rounded-none bg-secondary text-[#833177] transition-colors hover:bg-secondary/80 cursor-liverpool-pointer"
            aria-label="Volver a Jefes de ventas"
            title="Volver a Jefes de ventas"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>

          <div className="min-w-0">
            <h1 className="break-words text-[15px] font-medium leading-[17.5px] text-[#1D1B20]">
              {jefe?.jefe || canonicalRouteName}
            </h1>
            <p className="mt-[2.5px] text-[10px] leading-[12.5px] text-[#49454F]">
              {rosterLabel}
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-[15px] sm:flex">
          <div className="flex items-center gap-[7.5px]">
            <Users className="h-[17.5px] w-[17.5px] text-[#833177]" aria-hidden="true" />
            <div className="text-right">
              <p className="font-mono text-[10px] font-bold leading-[12.5px] text-[#1D1B20]">
                {members.length}
              </p>
              <p className="text-[10px] leading-[12.5px] text-[#49454F]">
                {isActive ? 'colaboradores actuales' : 'colaboradores históricos'}
              </p>
            </div>
          </div>

          <div className="h-[30px] w-px bg-border" aria-hidden="true" />

          <div className="flex items-center gap-[7.5px]">
            <History className="h-[17.5px] w-[17.5px] text-[#833177]" aria-hidden="true" />
            <div className="text-right">
              <p className="font-mono text-[10px] font-bold leading-[12.5px] text-[#1D1B20]">
                {totalHistoricalAssignments}
              </p>
              <p className="text-[10px] leading-[12.5px] text-[#49454F]">registros mensuales</p>
            </div>
          </div>
        </div>
      </section>

      {!jefe ? (
        <section className="border border-border bg-card p-[15px] text-[10px] leading-[15px] text-[#49454F]">
          No se encontraron registros de Google Sheets para este jefe.
        </section>
      ) : members.length === 0 ? (
        <section className="border border-border bg-card p-[15px] text-[10px] leading-[15px] text-[#49454F]">
          Este jefe existe en el historial, pero no tiene colaboradores disponibles en los registros mensuales leídos.
        </section>
      ) : (
        <CollaboratorPerformanceView
          members={members}
          managerName={jefe.jefe}
          rosterLabel={rosterLabel}
        />
      )}
    </main>
  )
}
