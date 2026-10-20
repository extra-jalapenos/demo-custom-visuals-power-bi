export interface SeriesValue {
  series: string;
  value: number | null;
  colorIndex: number;
}

export interface DataPoint {
  date: Date;
  value: number | null;
  key: string;
  isPresent: boolean;
  seriesValues?: SeriesValue[];
}

export interface CalendarDay {
  date: Date | null;
  week: number;
  dayOfWeek: number;
  value: number | null;
  isPresent: boolean;
  key: string;
  seriesValues?: SeriesValue[];
}

export interface CalendarMonth {
  monthLabel: string;
  startWeek: number;
  endWeek: number;
  year: number;
}

export interface CalendarGrid {
  days: CalendarDay[];
  months: CalendarMonth[];
  weeks: CalendarDay[][];
  dateRange: { start: Date; end: Date };
}

export interface MeasureStats {
  min: number;
  max: number;
  median: number;
  range: number;
}

export interface RenderConfig {
  tileSize: number;
  padding: { top: number; right: number; bottom: number; left: number };
  tileColor: string;
  maxOpacity: number;
  colorFormat?: 'hex' | 'rgb';
}