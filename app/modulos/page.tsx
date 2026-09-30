import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, PackageCheck, Boxes, ChevronRight } from 'lucide-react'
import { AuthenticatedAppHeader } from '@/components/layout/authenticated-app-header'

export default async function ModulosPage() {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth-token')
  const userName = cookieStore.get('user-name')?.value

  if (!authToken) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#F7F2F7] flex flex-col font-sans">
      <AuthenticatedAppHeader userName={userName} />

      <main className="min-h-[calc(100vh-60px)] flex-1 flex flex-col items-center px-5 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-5xl flex flex-col gap-8">
          <div className="flex flex-col gap-1.5 text-left">
            <p className="text-[10px] sm:text-[10px] font-semibold text-[#49454F] tracking-wider uppercase">
              PORTAL INTERNO
            </p>
            <h1 className="text-[10px] sm:text-[10px] font-bold text-[#1D1B20] leading-tight">
              Bienvenido a Liverpool Galerías Perinorte
            </h1>
            <p className="text-[10px] sm:text-[10px] text-[#49454F] mt-0.5">
              Selecciona un módulo para continuar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* 1. Módulo Crédito (Funcional) */}
            <Link
              href="/"
              aria-label="Abrir módulo Crédito"
              className="flex flex-col rounded-none bg-card p-[15px] border border-border w-full transition-all hover:border-[#833177]/50 hover:bg-card/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#833177]/50 cursor-liverpool-pointer group no-underline text-inherit"
            >
              <header className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-none bg-secondary text-[#833177]"
                    aria-hidden="true"
                  >
                    <CreditCard size={20} className="text-[#833177]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[10px] leading-[19px] font-medium text-[#1D1B20] group-hover:text-[#833177] transition-colors">
                      Crédito
                    </h2>
                  </div>
                </div>
                <div
                  className="flex h-[36px] w-[36px] shrink-0 items-center justify-center text-[#49454F] group-hover:text-[#833177] group-hover:translate-x-0.5 transition-all"
                  aria-hidden="true"
                >
                  <ChevronRight size={20} />
                </div>
              </header>

              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-[10px] text-[#49454F] leading-relaxed">
                  Consulta indicadores, avance y operación comercial.
                </p>
              </div>
            </Link>

            {/* 2. Módulo Click & Collect (Informativo, no interactivo) */}
            <section
              aria-labelledby="module-click-collect-heading"
              className="flex flex-col rounded-none bg-card p-[15px] border border-border w-full select-none cursor-default"
            >
              <header className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-none bg-secondary text-[#833177]"
                    aria-hidden="true"
                  >
                    <PackageCheck size={20} className="text-[#833177]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2
                      id="module-click-collect-heading"
                      className="text-[10px] leading-[19px] font-medium text-[#1D1B20]"
                    >
                      Click & Collect
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[#49454F] bg-[#F7F2F7] border border-[#CAC4D0] px-2.5 py-1 rounded-none shrink-0">
                  Disponible próximamente
                </span>
              </header>

              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-[10px] text-[#49454F] leading-relaxed">
                  Da seguimiento a pedidos preparados para recolección.
                </p>
              </div>
            </section>

            {/* 3. Módulo Inventarios (Informativo, no interactivo) */}
            <section
              aria-labelledby="module-inventarios-heading"
              className="flex flex-col rounded-none bg-card p-[15px] border border-border w-full select-none cursor-default"
            >
              <header className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-none bg-secondary text-[#833177]"
                    aria-hidden="true"
                  >
                    <Boxes size={20} className="text-[#833177]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2
                      id="module-inventarios-heading"
                      className="text-[10px] leading-[19px] font-medium text-[#1D1B20]"
                    >
                      Inventarios
                    </h2>
                  </div>
                </div>
                <span className="text-[10px] font-medium text-[#49454F] bg-[#F7F2F7] border border-[#CAC4D0] px-2.5 py-1 rounded-none shrink-0">
                  Disponible próximamente
                </span>
              </header>

              <div className="mt-4 pt-3 border-t border-border/50">
                <p className="text-[10px] text-[#49454F] leading-relaxed">
                  Consulta existencias y movimiento operativo de mercancía.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
