import React from 'react';
import {
  createUniversalDotRenderer,
  getUniversalSolidColor,
} from '@/components/charts/universal';

const CATEGORICAL_KEYS = ['DILISA', 'LPC', 'JUST ME', 'GARANTIZADA'];

const isPlanSeries = (dataKey?: string, name?: string, stroke?: string, fill?: string) =>
  dataKey === 'plan' ||
  name === 'Plan' ||
  name === 'Plan (100%)' ||
  name === 'Meta (100%)' ||
  (typeof stroke === 'string' && (stroke.includes('Plan') || stroke.endsWith('40'))) ||
  (typeof fill === 'string' && (fill.includes('Plan') || fill.endsWith('40')));

function resolveDotColor(props: any): string {
  const { payload, stroke, fill, dataKey, name } = props;
  let color = stroke || fill || '#833177';

  const isCategorical = CATEGORICAL_KEYS.includes(String(dataKey || name));

  if (!isCategorical && payload) {
    const itemReal = payload.rawReal ?? payload.unidades ?? payload.real ?? payload.avance;
    const itemPlan = payload.rawPlan ?? payload.planUnidades ?? payload.plan;

    if (itemReal !== undefined && itemPlan !== undefined) {
      color = getUniversalSolidColor(itemReal, itemPlan);
    }
  }

  return color;
}

export const renderSquareDot = (props: any) => {
  const color = resolveDotColor(props);
  const subtle = isPlanSeries(props.dataKey, props.name, props.stroke, props.fill);

  return createUniversalDotRenderer({
    size: 5,
    isSubtle: subtle,
    getColor: () => color,
  })(props);
};

export const renderSquareActiveDot = (props: any) => {
  const color = resolveDotColor(props);
  const subtle = isPlanSeries(props.dataKey, props.name, props.stroke, props.fill);

  return createUniversalDotRenderer({
    size: 7.5,
    isSubtle: subtle,
    getColor: () => color,
  })(props);
};
