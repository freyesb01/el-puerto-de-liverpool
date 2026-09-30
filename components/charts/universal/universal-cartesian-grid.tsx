import React from 'react';
import { CartesianGrid, type CartesianGridProps } from 'recharts';
import {
  UNIVERSAL_CARTESIAN_GRID,
  UNIVERSAL_HORIZONTAL_RANKING_GRID,
} from './universal-chart-config';

export { UNIVERSAL_CARTESIAN_GRID, UNIVERSAL_HORIZONTAL_RANKING_GRID };

export interface UniversalCartesianGridProps extends Partial<CartesianGridProps> {}

export function UniversalCartesianGrid(props: UniversalCartesianGridProps) {
  return (
    <CartesianGrid
      {...UNIVERSAL_CARTESIAN_GRID}
      {...props}
    />
  );
}

UniversalCartesianGrid.displayName = 'CartesianGrid';
(UniversalCartesianGrid as any).defaultProps = {
  ...(CartesianGrid as any).defaultProps,
  ...UNIVERSAL_CARTESIAN_GRID,
};

export function UniversalHorizontalRankingGrid(props: UniversalCartesianGridProps) {
  return (
    <CartesianGrid
      {...UNIVERSAL_HORIZONTAL_RANKING_GRID}
      {...props}
    />
  );
}

UniversalHorizontalRankingGrid.displayName = 'CartesianGrid';
(UniversalHorizontalRankingGrid as any).defaultProps = {
  ...(CartesianGrid as any).defaultProps,
  ...UNIVERSAL_HORIZONTAL_RANKING_GRID,
};
