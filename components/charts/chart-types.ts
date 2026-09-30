export const UNIVERSAL_VIEW_TYPES = ['bar', 'line', 'area', 'radar'] as const;
export type ViewType = typeof UNIVERSAL_VIEW_TYPES[number];

import { BarChart3, ChartLine, ChartArea, Radar } from "lucide-react";

export function getChartTypeIcon(viewType: ViewType) {
  switch (viewType) {
    case 'bar':
      return BarChart3;
    case 'line':
      return ChartLine;
    case 'area':
      return ChartArea;
    case 'radar':
      return Radar;
    default:
      return BarChart3;
  }
}
