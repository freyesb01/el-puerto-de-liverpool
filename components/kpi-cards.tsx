'use client'

import React from 'react'
import type { DashboardData } from "@/lib/types"
import { UniversalKpiGroup } from './charts/universal'
import {
  IndiceDeEfectividadAnual,
  VolumenDeOriginacionReal,
  DesviacionOperativa,
  MezclaDePortafolioFinanciero,
} from './dashboard/vista-general/graficas'

export function KpiCards({ data }: { data: DashboardData }) {
  return (
    <UniversalKpiGroup>
      <IndiceDeEfectividadAnual data={data.planVsReal} kpis={data.kpis} />
      <VolumenDeOriginacionReal data={data.planVsReal} kpis={data.kpis} />
      <DesviacionOperativa data={data.planVsReal} kpis={data.kpis} />
      <MezclaDePortafolioFinanciero data={data.tiposTarjeta} kpis={data.kpis} />
    </UniversalKpiGroup>
  )
}

export {
  IndiceDeEfectividadAnual,
  VolumenDeOriginacionReal,
  DesviacionOperativa,
  MezclaDePortafolioFinanciero,
}
