import { getExactPercentageText, getPercentageText, parsePercentage } from './formatters';
import { isPendingMonthlyDatum } from './monthly-status';

/** Preserve source text and status before adapting a ranking to a 100% target. */
export function getRankingPercentage(value: unknown, datum?: any, fallback?: number) {
  const source = { ...datum, porcentajeStr: datum?.porcentajeStr ?? value };
  const exact = getExactPercentageText(source);
  const numeric = parsePercentage(value) ?? parsePercentage(exact) ?? fallback;
  const pendingText = [value, datum?.porcentajeStr, datum?.percentageStr,
    datum?.cumplimientoStr, datum?.avanceStr].some(
    (text) => typeof text === 'string' && ['-', '—'].includes(text.trim()),
  );
  const isPending = pendingText || isPendingMonthlyDatum({ ...source, real: numeric });
  const avance = typeof numeric === 'number' && Number.isFinite(numeric) ? numeric : 0;
  return {
    avance,
    real: avance,
    plan: 100,
    porcentajeStr: isPending ? '-' : getPercentageText(source, avance),
    isPending,
  };
}
