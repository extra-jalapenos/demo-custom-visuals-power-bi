import DataViewCategorical = powerbi.DataViewCategorical;
import { DataPoint, MeasureStats, SeriesValue } from './types';
import { extent, median, sort } from "d3-array";

function parseNumberAsDate(num: number): Date | null {
  if (isNaN(num)) {
    return null;
  }

  if (num > 50000) {
    return new Date(num);
  }

  const OLE_EPOCH_DIFF = 25567;
  const MS_PER_DAY = 86400000;

  return new Date((num - OLE_EPOCH_DIFF) * MS_PER_DAY);
}

export function extractDataPoints(categorical: DataViewCategorical | undefined): DataPoint[] {
  if (!categorical || !categorical.categories || !categorical.categories[0] || !categorical.values) {
    return [];
  }

  const dateCategories = categorical.categories[0];

  if (!dateCategories.values) {
    return [];
  }

  const dataPointMap = new Map<string, DataPoint>();

  dateCategories.values.forEach((dateValue, dateIndex) => {
    let date: Date | null = null;

    if (dateValue !== null && dateValue !== undefined) {
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (typeof dateValue === 'number') {
        date = parseNumberAsDate(dateValue);
      }

      if (date && !isNaN(date.getTime())) {
        const key = date.toISOString().split('T')[0];

        if (!dataPointMap.has(key)) {
          dataPointMap.set(key, {
            date,
            value: null,
            key,
            isPresent: false,
            seriesValues: [],
          });
        }

        const dataPoint = dataPointMap.get(key)!;
        dataPoint.seriesValues = dataPoint.seriesValues || [];
      }
    }
  });

  if (categorical.values && categorical.values.length > 0) {
    categorical.values.forEach((valueGroup, seriesIndex) => {
      const seriesName = valueGroup.source.displayName || `Series ${seriesIndex + 1}`;

      valueGroup.values.forEach((value, dateIndex) => {
        const dateValue = dateCategories.values[dateIndex];
        let date: Date | null = null;

        if (dateValue !== null && dateValue !== undefined) {
          if (dateValue instanceof Date) {
            date = dateValue;
          } else if (typeof dateValue === 'string') {
            date = new Date(dateValue);
          } else if (typeof dateValue === 'number') {
            date = parseNumberAsDate(dateValue);
          }

          if (date && !isNaN(date.getTime())) {
            const key = date.toISOString().split('T')[0];
            const dataPoint = dataPointMap.get(key);

            if (dataPoint) {
              const seriesValue: SeriesValue = {
                series: seriesName,
                value: value as number | null,
                colorIndex: seriesIndex,
              };

              dataPoint.seriesValues!.push(seriesValue);
              dataPoint.isPresent = true;
              if (dataPoint.value === null && value !== null) {
                dataPoint.value = value as number;
              }
            }
          }
        }
      });
    });
  }

  const dataPoints = Array.from(dataPointMap.values());
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