export function isPendingMonthlyDatum(datum: any): boolean {
  if (!datum) return true

  if (typeof datum.isPending === 'boolean') return datum.isPending
  if (typeof datum.pending === 'boolean') return datum.pending

  const status = String(datum.status ?? datum.estado ?? '').trim().toLowerCase()
  if (status.includes('pend')) return true

  const percentageText = datum.porcentajeStr
  if (typeof percentageText === 'string') {
    const normalized = percentageText.trim()
    if (normalized === '-' || normalized === '—') return true
  }

  const real = datum.real ?? datum.aprobadas ?? datum.unidades

  if (real === null || real === undefined || real === '') return true

  return false
}
