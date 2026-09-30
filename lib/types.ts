export type MonthlyPlanReal = {
  mes: string
  plan: number
  real: number
  porcentajeStr: string
}

export type CardTypePoint = {
  mes: string
  DILISA_PLAN?: number
  DILISA: number
  LPC_PLAN?: number
  LPC: number
  'JUST ME_PLAN'?: number
  'JUST ME': number
  GARANTIZADA_PLAN?: number
  GARANTIZADA: number
  isPending?: boolean
}

export type ChannelSlice = {
  canal: string
  aprobadas: number
}

export type ParticipacionCanal = {
  name: string
  value: number
  fill: string
}

/**
 * Resultado acumulado de una persona mientras estuvo asignada a un jefe.
 * numeroPersonal es la identidad estable; el nombre es únicamente presentación.
 */
export type TeamMember = {
  numeroPersonal?: string
  nombre: string
  seccion: string
  dilisa: number
  lpc: number
  justMe: number
  garantizada: number
  declinadas?: number
  ingresadas?: number
  total: number
  meses?: string[]
  ultimoMes?: string
}

/** Snapshot mensual de la relación colaborador -> jefe. */
export type CollaboratorMonthlyRecord = {
  mes: string
  monthIndex: number
  numeroPersonal: string
  nombre: string
  seccion: string
  jefe: string
  canal: string
  dilisa: number
  lpc: number
  justMe: number
  garantizada: number
  declinadas: number
  aprobadas: number
  ingresadas: number
}

export type SalesLead = {
  jefe: string
  canal: string
  real: number
  plan: number
  dia: number
  mesActual: number
  /** Histórico atribuido únicamente a los meses en que cada persona perteneció al jefe. */
  equipo?: TeamMember[]
  /** Plantilla del último mes con datos, enriquecida con su histórico bajo este jefe. */
  equipoActual?: TeamMember[]
  /** Relación mensual sin perder cambios de jefe. */
  historialEquipo?: CollaboratorMonthlyRecord[]
  /** Si el jefe aparece en la plantilla del último mes con datos. */
  activo?: boolean
  /** Último mes en que el jefe tuvo al menos un colaborador registrado. */
  ultimoMes?: string
}

export type PromoterData = {
  nombre: string
  ingresadas: number
  aprobadas: number
  declinadas: number
  plan: number
}

export type ProductPerformance = {
  producto: string
  plan: number
  real: number
}

export type DashboardData = {
  actualizado: string
  /** Última pestaña mensual que contiene una plantilla válida. */
  ultimoMesConDatos?: string
  kpis: {
    avanceAcumulado: number
    aprobadas: number
    planAnual: number
    diferenciaGlobal: number
    participacionVentas: number
    participacionCredito: number
    participacionPromotores: number
  }
  planVsReal: MonthlyPlanReal[]
  tiposTarjeta: CardTypePoint[]
  canales: ChannelSlice[]
  participacionCanal: ParticipacionCanal[]
  jefesVentas: SalesLead[]
  promotores: PromoterData[]
  productPerformance: ProductPerformance[]
  acumuladoJefes?: {
    rangoA: string[]
    rangoAE: (string | number)[]
    promotoresA?: string[]
    promotoresAE?: (string | number)[]
  }
}
