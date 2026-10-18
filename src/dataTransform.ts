import DataViewCategorical = powerbi.DataViewCategorical;
import { DataPoint, MeasureStats } from './types';

export function extractDataPoints(categorical: DataViewCategorical | undefined): DataPoint[] {
  if (!categorical || !categorical.categories || !categorical.categories[0] || !categorical.values) {
    return [];
  }

  const categories = categorical.categories[0];
  const values = categorical.values[0];

  if (!categories.values || !values.values) {
    return [];
  }

  const categoryCount = categories.values.length;
  const valueCount = values.values.length;

  if (categoryCount !== valueCount) {
    console.warn('Category and value counts do not match');
    return [];
  }

  const dataPoints: DataPoint[] = [];

  for (let i = 0; i < categoryCount; i++) {
    const categoryValue = categories.values[i];
    const measureValue = values.values[i] as number | null;

    let date: Date | null = null;

    if (categoryValue !== null && categoryValue !== undefined) {
      if (categoryValue instanceof Date) {
        date = categoryValue;
      } else if (typeof categoryValue === 'string') {
        date = new Date(categoryValue);
      } else if (typeof categoryValue === 'number') {
        date = new Date(categoryValue);
      }

      if (date && !isNaN(date.getTime())) {
        const key = date.toISOString().split('T')[0];
        dataPoints.push({
          date,
          value: measureValue,
          key,
          isPresent: true,
        });
      }
    }
  }

  return validateAndNormalize(dataPoints);
}

export function validateAndNormalize(dataPoints: DataPoint[]): DataPoint[] {
  const validPoints = dataPoints.filter(point => {
    if (!point.date || isNaN(point.date.getTime())) {
      console.warn('Invalid date skipped:', point);
      return false;
    }
    return true;
  });

  validPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

  return validPoints;
}

export function calculateMeasureStats(dataPoints: DataPoint[]): MeasureStats {
  const values = dataPoints
    .map(d => d.value)
    .filter(v => v !== null && v !== undefined && !isNaN(v as number)) as number[];

  if (values.length === 0) {
    return { min: 0, max: 1, median: 0.5, range: 1 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  return {
    min,
    max,
    median,
    range: max - min,
  };
}