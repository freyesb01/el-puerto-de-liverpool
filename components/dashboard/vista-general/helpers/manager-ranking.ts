import { formatManagerName, getManagerIdentityKey } from '@/lib/person-names';
import { getRankingPercentage } from './ranking-percentage';

export interface ManagerRankingItem {
  name: string;
  managerKey: string;
  personType: 'manager';
  avance: number;
  isPending: boolean;
  porcentajeStr: string;
  real: number;
  plan: number;
  [key: string]: any;
}

/**
 * Adaptador único del ranking de jefes. Sirve tanto a Vista General como a
 * la pantalla de Jefes para que ambas consuman exactamente la misma fuente.
 */
export function getManagerRanking(
  namesArray?: string[] | any[] | null,
  percentagesArray?: (string | number)[] | null,
): ManagerRankingItem[] {
  if (!namesArray) return [];

  const objectRows =
    (!percentagesArray || percentagesArray.length === 0) &&
    namesArray.length > 0 &&
    typeof namesArray[0] === 'object' &&
    namesArray[0] !== null;

  if (!objectRows && !percentagesArray) return [];

  const ranking: ManagerRankingItem[] = [];

  namesArray.forEach((entry, index) => {
    const item = objectRows ? entry : undefined;
    const name = item ? (item.name || item.jefe || '') : entry;
    const rawName = String(name || '').trim();
    const cleanName = formatManagerName(rawName);
    if (!cleanName) return;

    const real = item ? item.real : undefined;
    const fallback = typeof real === 'number'
      ? (typeof item.plan === 'number' && item.plan > 0 ? (real / item.plan) * 100 : real)
      : undefined;

    const percentage = getRankingPercentage(
      item ? item.avance : percentagesArray?.[index],
      item,
      fallback,
    );

    ranking.push({
      name: cleanName,
      managerKey: getManagerIdentityKey(cleanName),
      personType: 'manager',
      ...percentage,
    });
  });

  return ranking.sort((a, b) => b.avance - a.avance);
}

export function getTop3Managers(
  namesArray?: string[] | any[] | null,
  percentagesArray?: (string | number)[] | null,
): ManagerRankingItem[] {
  return getManagerRanking(namesArray, percentagesArray).slice(0, 3);
}
