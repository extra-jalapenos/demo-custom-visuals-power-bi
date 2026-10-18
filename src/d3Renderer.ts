import * as d3 from 'd3';
import { CalendarGrid, DataPoint, RenderConfig } from './types';
import { getWeekdayLabel, calculateMeasureStats } from './calendarLayout';

export function render(
  container: HTMLElement,
  calendar: CalendarGrid,
  dataPoints: DataPoint[],
  config: RenderConfig
): void {
  d3.select(container).selectAll('*').remove();

  if (calendar.weeks.length === 0) {
    d3.select(container).html("<div class='no-data-message'>No data available</div>");
    return;
  }

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const width = Math.max(containerWidth, calendar.weeks.length * config.tileSize + config.padding.left + config.padding.right);
  const height = Math.max(containerHeight, 7 * config.tileSize + config.padding.top + config.padding.bottom);

  const svg = d3.select(container)
    .append('svg')
    .attr('class', 'calendar-heatmap-container')
    .attr('width', containerWidth)
    .attr('height', containerHeight)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMinYMin meet');

  const g = svg.append('g')
    .attr('transform', `translate(${config.padding.left},${config.padding.top})`);

  const stats = calculateMeasureStats(dataPoints);

  renderTiles(g, calendar, dataPoints, config, stats);
  renderYAxis(g, calendar, config);
  renderXAxis(g, calendar, config);
}

function renderTiles(
  g: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
  calendar: CalendarGrid,
  dataPoints: DataPoint[],
  config: RenderConfig,
  stats: ReturnType<typeof calculateMeasureStats>
): void {
  const dataPointMap = new Map<string, DataPoint>();
  dataPoints.forEach(dp => {
    dataPointMap.set(dp.key, dp);
  });

  const tiles = g.selectAll('.tile')
    .data(calendar.days, (d: any) => d.key);

  tiles.exit().remove();

  tiles.enter()
    .append('rect')
    .attr('class', d => (d as any).isPresent ? 'tile' : 'tile-empty')
    .merge(tiles as any)
    .attr('x', (d: any) => d.week * config.tileSize)
    .attr('y', (d: any) => d.dayOfWeek * config.tileSize)
    .attr('width', config.tileSize)
    .attr('height', config.tileSize)
    .attr('fill', (d: any) => {
      if (!(d as any).isPresent) {
        return '#f5f5f5';
      }
      return config.tileColor;
    })
    .attr('opacity', (d: any) => {
      if (!(d as any).isPresent || (d as any).value === null) {
        return 0.3;
      }
      return calculateOpacity((d as any).value, stats.min, stats.max, config.maxOpacity);
    })
    .attr('data-date', (d: any) => (d as any).key)
    .attr('data-value', (d: any) => (d as any).value !== null ? (d as any).value : 'N/A');
}

function renderYAxis(
  g: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
  calendar: CalendarGrid,
  config: RenderConfig
): void {
  const weekdayLabels = g.selectAll('.weekday-label')
    .data(Array.from({ length: 7 }, (_, i) => i));

  weekdayLabels.exit().remove();

  weekdayLabels.enter()
    .append('text')
    .attr('class', 'weekday-label')
    .merge(weekdayLabels as any)
    .attr('x', -8)
    .attr('y', (d: any) => d * config.tileSize + config.tileSize / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', '12px')
    .attr('fill', '#666')
    .text((d: any) => getWeekdayLabel(d));
}

function renderXAxis(
  g: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
  calendar: CalendarGrid,
  config: RenderConfig
): void {
  const monthLabels = g.selectAll('.month-label')
    .data(calendar.months);

  monthLabels.exit().remove();

  monthLabels.enter()
    .append('text')
    .attr('class', 'month-label')
    .merge(monthLabels as any)
    .attr('x', (d: any) => (d.startWeek + d.endWeek) / 2 * config.tileSize)
    .attr('y', -12)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('fill', '#999')
    .text((d: any) => `${d.monthLabel} ${d.year}`);
}

export function calculateOpacity(value: number, min: number, max: number, maxOpacity: number): number {
  if (max === min) {
    return maxOpacity;
  }

  const range = max - min;
  const normalizedValue = (value - min) / range;

  const minOpacity = 0.1;
  const opacity = minOpacity + normalizedValue * (maxOpacity - minOpacity);

  return Math.min(Math.max(opacity, minOpacity), maxOpacity);
}

export function calculateColorWithOpacity(hexColor: string, opacity: number): string {
  const hex = hexColor.replace('#', '');
  let r: number, g: number, b: number;

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}