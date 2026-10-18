import DataViewCategorical = powerbi.DataViewCategorical;
import { DataPoint, MeasureStats } from './types';
import { extent, median, sort } from "d3-array";

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

  return sort(validPoints, (a, b) => a.date.getTime() - b.date.getTime());
}

export function calculateMeasureStats(dataPoints: DataPoint[]): MeasureStats {
  const values = dataPoints.map(d => d.value);
  const validValues = values.filter((v): v is number => v !== null && v !== undefined && !isNaN(v));

  if (validValues.length === 0) {
    return { min: 0, max: 1, median: 0.5, range: 1 };
  }

  const [min, max] = extent(validValues) as [number, number];
  const medianValue = median(validValues) as number;

  return {
    min,
    max,
    median: medianValue,
    range: max - min,
  };
}