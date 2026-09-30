'use client';

import { useCallback, useState } from 'react';
import { UNIVERSAL_VIEW_TYPES, type ViewType } from '@/components/charts/chart-types';

/** Mantiene el mismo orden y selección de vistas en todas las gráficas. */
export function useUniversalChartView(initialView: ViewType = 'bar') {
  const [viewType, setViewType] = useState<ViewType>(initialView);

  const handleChartTypeChange = useCallback((nextViewType?: ViewType) => {
    if (nextViewType) {
      setViewType(nextViewType);
      return;
    }

    setViewType((previous) => {
      const nextIndex = (UNIVERSAL_VIEW_TYPES.indexOf(previous) + 1) % UNIVERSAL_VIEW_TYPES.length;
      return UNIVERSAL_VIEW_TYPES[nextIndex];
    });
  }, []);

  return { viewType, handleChartTypeChange };
}
