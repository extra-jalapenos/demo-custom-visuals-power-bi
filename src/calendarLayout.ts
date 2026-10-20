import { timeMonday, timeDay, timeDays } from 'd3-time';
import { DataPoint, CalendarDay, CalendarGrid, CalendarMonth } from './types';

const WEEKDAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function buildCalendarGrid(dataPoints: DataPoint[]): CalendarGrid {
  if (dataPoints.length === 0) {
    return {
      days: [],
      months: [],
      weeks: [],
      dateRange: { start: new Date(), end: new Date() },
    };
  }

  const startDate = timeMonday.floor(dataPoints[0].date);
  const endDate = timeMonday.ceil(dataPoints[dataPoints.length - 1].date);

  const dataPointMap = new Map<string, DataPoint>();
  dataPoints.forEach(dp => {
    dataPointMap.set(dp.key, dp);
  });

  const allDates = timeDays(startDate, timeDay.offset(endDate, 1));

  const days: CalendarDay[] = [];
  const weeks: CalendarDay[][] = [];
  let currentWeek: CalendarDay[] = [];

  allDates.forEach(date => {
    const dayOfWeek = (date.getDay() + 6) % 7;
    const weekIndex = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const dateKey = date.toISOString().split('T')[0];
    const dataPoint = dataPointMap.get(dateKey);

    const calendarDay: CalendarDay = {
      date: new Date(date),
      week: weekIndex,
      dayOfWeek,
      value: dataPoint ? dataPoint.value : null,
      isPresent: !!dataPoint,
      key: dateKey,
      seriesValues: dataPoint ? dataPoint.seriesValues : undefined,
    };

    days.push(calendarDay);
    currentWeek.push(calendarDay);

    if (dayOfWeek === 6) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    weeks.push([...currentWeek]);
  }

  const months = generateMonthLabels(weeks);

  return {
    days,
    months,
    weeks,
    dateRange: { start: startDate, end: endDate },
  };
}

export function generateMonthLabels(weeks: CalendarDay[][]): CalendarMonth[] {
  const months: CalendarMonth[] = [];
  let currentMonth = -1;
  let currentYear = -1;
  let startWeek = 0;

  for (let weekIdx = 0; weekIdx < weeks.length; weekIdx++) {
    const week = weeks[weekIdx];
    if (week.length === 0) continue;

    const firstDayOfWeek = week[0];
    if (!firstDayOfWeek.date) continue;

    const month = firstDayOfWeek.date.getMonth();
    const year = firstDayOfWeek.date.getFullYear();

    if (month !== currentMonth || year !== currentYear) {
      if (currentMonth !== -1) {
        months.push({
          monthLabel: MONTH_ABBR[currentMonth],
          startWeek,
          endWeek: weekIdx - 1,
          year: currentYear,
        });
      }
      currentMonth = month;
      currentYear = year;
      startWeek = weekIdx;
    }
  }

  if (currentMonth !== -1) {
    months.push({
      monthLabel: MONTH_ABBR[currentMonth],
      startWeek,
      endWeek: weeks.length - 1,
      year: currentYear,
    });
  }

  return months;
}

export function calculateGridDimensions(weeks: CalendarDay[][]): { rows: number; cols: number } {
  return {
    rows: weeks.length,
    cols: 7,
  };
}

export function getWeekdayLabel(dayOfWeek: number): string {
  return WEEKDAY_ABBR[dayOfWeek] || '';
}

export function getMonthLabel(month: number): string {
  return MONTH_ABBR[month] || '';
}