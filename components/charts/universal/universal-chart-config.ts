export const UNIVERSAL_CARTESIAN_GRID = {
  horizontal: true,
  vertical: false,
  stroke: 'var(--border)',
  strokeOpacity: 0.25,
  syncWithTicks: true,
} as const;

export const UNIVERSAL_HORIZONTAL_RANKING_GRID = {
  horizontal: false,
  vertical: true,
  stroke: 'var(--border)',
  strokeOpacity: 0.25,
  syncWithTicks: true,
} as const;

export const UNIVERSAL_POLAR_GRID = {
  stroke: 'var(--border)',
  strokeOpacity: 0.25,
} as const;

/** Cartesian Meta: square dots; edge extensions are provided by the target renderer. */
export const UNIVERSAL_TARGET_SERIES = {
  strokeWidth: 2.5,
  strokeOpacity: 0.35,
  fill: 'transparent',
  fillOpacity: 0,
  dotSize: 5,
  dotFillOpacity: 0.35,
  activeDotSize: 7.5,
  isAnimationActive: true,
} as const;

export const UNIVERSAL_ACTUAL_SERIES = {
  strokeWidth: 2.5,
  strokeOpacity: 1,
  fillOpacity: 0.3,
  dotSize: 5,
  dotFillOpacity: 1,
  activeDotSize: 7.5,
} as const;

/** Polar geometry keeps active squares only and has no Cartesian edge extensions.
 * Single and multiple actual polygons retain their existing distinct fill opacities.
 */
export const UNIVERSAL_RADAR_SERIES = {
  target: { strokeOpacity: UNIVERSAL_TARGET_SERIES.strokeOpacity, fillOpacity: 0.1 },
  actual: { strokeOpacity: UNIVERSAL_ACTUAL_SERIES.strokeOpacity, fillOpacity: 0.6 },
  series: { strokeOpacity: UNIVERSAL_ACTUAL_SERIES.strokeOpacity, fillOpacity: 0.5 },
} as const;
