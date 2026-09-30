import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(str: string): string {
  if (!str) return str
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getPerformanceColor(real: number | null | undefined, plan: number | null | undefined): string {
  if (real === null || real === undefined || plan === null || plan === undefined || plan === 0) {
    return '#e5e7eb'; // gris para sin datos
  }
  
  const percentage = (real / plan) * 100;
  
  if (percentage >= 66 && percentage <= 99) {
    return '#833177'; // morado
  } else if (percentage >= 33 && percentage < 66) {
    return '#e10098'; // magenta
  } else if (percentage >= 0 && percentage < 33) {
    return '#ff6d01'; // naranja
  } else {
    // Porcentajes > 99% o negativos
    return '#833177'; // morado por defecto para > 99%
  }
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0 || Number.isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('es-MX', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + '%';
}

export function toSentenceCase(value: string | null | undefined): string {
  if (!value) return '';

  const normalized = value.trim().toLocaleLowerCase('es-MX');

  return (
    normalized.charAt(0).toLocaleUpperCase('es-MX') +
    normalized.slice(1)
  );
}

/** Nombre propio para mostrar; no altera los identificadores recibidos de Sheets. */
export function formatPersonName(value: string | null | undefined): string {
  if (!value) return '';

  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-MX').replace(
    /(^|[\s'-])(\p{L})/gu,
    (_, separator: string, letter: string) => separator + letter.toLocaleUpperCase('es-MX'),
  );
}
