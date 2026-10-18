import DataViewCategorical = powerbi.DataViewCategorical;
import { DataPoint, MeasureStats } from './types';
export declare function extractDataPoints(categorical: DataViewCategorical | undefined): DataPoint[];
export declare function validateAndNormalize(dataPoints: DataPoint[]): DataPoint[];
export declare function calculateMeasureStats(dataPoints: DataPoint[]): MeasureStats;
