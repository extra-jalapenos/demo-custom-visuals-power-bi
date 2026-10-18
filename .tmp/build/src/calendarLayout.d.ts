import { DataPoint, CalendarDay, CalendarGrid, CalendarMonth } from './types';
export declare function buildCalendarGrid(dataPoints: DataPoint[]): CalendarGrid;
export declare function generateMonthLabels(weeks: CalendarDay[][]): CalendarMonth[];
export declare function calculateGridDimensions(weeks: CalendarDay[][]): {
    rows: number;
    cols: number;
};
export declare function getWeekdayLabel(dayOfWeek: number): string;
export declare function getMonthLabel(month: number): string;
