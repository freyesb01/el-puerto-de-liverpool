export const UNIVERSAL_VIEW_COLORS = {
  bar: '#833177',
  line: '#e10098',
  area: '#ff6d01',
  radar: '#833177',
} as const;

export function getUniversalViewColor(viewType: string): string {
  return UNIVERSAL_VIEW_COLORS[viewType as keyof typeof UNIVERSAL_VIEW_COLORS] ?? UNIVERSAL_VIEW_COLORS.bar;
}

export const UNIVERSAL_SEMAPHORE_COLORS = {
  HIGH: '#833177',
  MEDIUM: '#e10098',
  LOW: '#ff6d01',
  PENDING: '#ff6d01',
} as const;

/** Límites únicos del semáforo universal. */
export const UNIVERSAL_SEMAPHORE_THRESHOLDS = {
  MEDIUM_MIN: 33,
  HIGH_MIN: 66,
} as const;

export type UniversalSemaphoreKey = keyof typeof UNIVERSAL_SEMAPHORE_COLORS;
export type UniversalPerformanceBand = 'high' | 'medium' | 'low' | 'pending';

/**
 * Semántica única del desempeño. Los filtros y tooltips consumen estas etiquetas
 * para que el mismo band nunca reciba nombres distintos por accidente.
 */
export const UNIVERSAL_PERFORMANCE_SEMANTICS = {
  high: {
    filterLabel: 'Óptimos',
    tooltipLabel: 'Avance sólido',
    color: UNIVERSAL_SEMAPHORE_COLORS.HIGH,
  },
  medium: {
    filterLabel: 'En progreso',
    tooltipLabel: 'Avance intermedio',
    color: UNIVERSAL_SEMAPHORE_COLORS.MEDIUM,
  },
  low: {
    filterLabel: 'En riesgo',
    tooltipLabel: 'Avance inicial',
    color: UNIVERSAL_SEMAPHORE_COLORS.LOW,
  },
  pending: {
    filterLabel: 'Pendiente',
    tooltipLabel: 'Pendiente de evaluación',
    color: UNIVERSAL_SEMAPHORE_COLORS.PENDING,
  },
} as const satisfies Record<
  UniversalPerformanceBand,
  { filterLabel: string; tooltipLabel: string; color: string }
>;

export function getUniversalPerformanceBand(
  value: number | null | undefined,
  target: number | null | undefined,
): UniversalPerformanceBand {
  if (
    value === null ||
    value === undefined ||
    target === null ||
    target === undefined ||
    target <= 0 ||
    !Number.isFinite(value) ||
    !Number.isFinite(target)
  ) {
    return 'pending';
  }

  const percentage = (value / target) * 100;
  if (percentage >= UNIVERSAL_SEMAPHORE_THRESHOLDS.HIGH_MIN) return 'high';
  if (percentage >= UNIVERSAL_SEMAPHORE_THRESHOLDS.MEDIUM_MIN) return 'medium';
  return 'low';
}

/** Texto de estado usado por tooltips a partir del mismo band del semáforo. */
export function getUniversalPerformanceStatus(
  value: number | null | undefined,
  target: number | null | undefined,
  pending = false,
): string {
  if (pending) return UNIVERSAL_PERFORMANCE_SEMANTICS.pending.tooltipLabel;
  if (target === null || target === undefined || target <= 0 || !Number.isFinite(target)) {
    return 'Sin meta disponible';
  }

  const band = getUniversalPerformanceBand(value, target);
  if (band === 'pending') return UNIVERSAL_PERFORMANCE_SEMANTICS.pending.tooltipLabel;

  const percentage = ((value ?? 0) / target) * 100;
  if (band === 'high' && percentage >= 100) return 'Meta cumplida';
  return UNIVERSAL_PERFORMANCE_SEMANTICS[band].tooltipLabel;
}

/** Datum state overrides performance and categorical colors; zero is not a state. */
export function getUniversalDatumColor(datum: { isPending?: boolean } | null | undefined, color: string): string {
  return datum?.isPending === true ? UNIVERSAL_SEMAPHORE_COLORS.PENDING : color;
}

/** Stable series/legend color. KPI accent is the default, not a per-datum override. */
export function getUniversalSeriesColor(series: { color?: string } | undefined, accentColor = '#833177'): string {
  return series?.color ?? accentColor;
}

export const DEFAULT_SUBTLE_OPACITY = 0.125;
/** Contorno tenue legible (Plan/referencia); el relleno sigue en DEFAULT_SUBTLE_OPACITY. */
export const DEFAULT_SUBTLE_STROKE_OPACITY = 0.35;
export const DEFAULT_SUBTLE_HEX_ALPHA = '20';
/** Grosor de línea por defecto; no adelgazar por debajo de 2. */
export const DEFAULT_LINE_STROKE_WIDTH = 2;

export function getUniversalSolidColor(
  value: number | null | undefined,
  target: number | null | undefined
): string {
  const band = getUniversalPerformanceBand(value, target);
  if (band === 'high') return UNIVERSAL_SEMAPHORE_COLORS.HIGH;
  if (band === 'medium') return UNIVERSAL_SEMAPHORE_COLORS.MEDIUM;
  if (band === 'low') return UNIVERSAL_SEMAPHORE_COLORS.LOW;
  return UNIVERSAL_SEMAPHORE_COLORS.PENDING;
}

export function getUniversalSoftColor(
  solidHex: string,
  alphaHex = DEFAULT_SUBTLE_HEX_ALPHA
): string {
  const cleanHex = solidHex.startsWith('#') ? solidHex.slice(1) : solidHex;
  const base6 = cleanHex.length >= 6 ? cleanHex.slice(0, 6) : cleanHex;
  return `#${base6}${alphaHex}`;
}

export function normalizeColorOpacity(
  hexColor: string,
  options?: { targetOpacity?: number; useHexAlpha?: boolean }
): { color: string; opacity?: number } {
  const targetOpacity = options?.targetOpacity ?? DEFAULT_SUBTLE_OPACITY;
  const useHexAlpha = options?.useHexAlpha ?? false;

  const clean = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  const hasAlpha = clean.length === 8;
  const baseHex = `#${hasAlpha ? clean.slice(0, 6) : clean}`;

  if (useHexAlpha) {
    return {
      color: `${baseHex}${DEFAULT_SUBTLE_HEX_ALPHA}`,
    };
  }

  return {
    color: baseHex,
    opacity: targetOpacity,
  };
}
