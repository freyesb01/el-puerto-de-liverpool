/**
 * Formateadores de datos específicos para el módulo de Vista General
 */

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatPercent(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(2).replace('.', ',')}%`;
}

/** Percentage decimals use either comma or dot; neither is a thousands separator. */
export function parsePercentage(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!/^[+-]?\d+(?:[.,]\d+)?\s*%?$/.test(text)) return null;
  const parsed = Number(text.replace(/\s*%$/, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function getExactPercentageText(data: any): string | null {
  const candidates = [
    data?.porcentajeStr,
    data?.percentageStr,
    data?.cumplimientoStr,
    data?.avanceStr,
  ];

  const exact = candidates.find(
    (value) =>
      typeof value === 'string' &&
      value.trim() !== '' &&
      value.trim() !== '-' &&
      value.trim() !== '—' &&
      value.trim().endsWith('%') &&
      parsePercentage(value) !== null,
  );

  return typeof exact === 'string'
    ? exact.trim().replace('.', ',')
    : null;
}

export function getPercentageText(data: any, fallback?: number): string {
  const exact = getExactPercentageText(data);
  if (exact) return exact;
  return typeof fallback === 'number' && Number.isFinite(fallback)
    ? formatPercent(fallback)
    : '-';
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(n);
}
