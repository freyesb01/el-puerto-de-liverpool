import type { UniversalAnimationConfig } from './universal-chart-types';

export const UNIVERSAL_ANIMATION_DEFAULTS: Required<UniversalAnimationConfig> = {
  isAnimationActive: true,
  animationBegin: 0,
  animationDuration: 2500,
  animationEasing: 'ease-out',
};

export function getUniversalAnimationProps(
  overrides?: UniversalAnimationConfig
): Required<UniversalAnimationConfig> {
  return {
    isAnimationActive: overrides?.isAnimationActive ?? UNIVERSAL_ANIMATION_DEFAULTS.isAnimationActive,
    animationBegin: overrides?.animationBegin ?? UNIVERSAL_ANIMATION_DEFAULTS.animationBegin,
    animationDuration: overrides?.animationDuration ?? UNIVERSAL_ANIMATION_DEFAULTS.animationDuration,
    animationEasing: overrides?.animationEasing ?? UNIVERSAL_ANIMATION_DEFAULTS.animationEasing,
  };
}
