import { select, Selection } from 'd3-selection';
import { scaleLinear, scaleBand } from 'd3-scale';
import { range } from 'd3-array';
import {CalendarDay, CalendarGrid, DataPoint, RenderConfig} from './types';
import { getWeekdayLabel } from './calendarLayout';
import {calculateMeasureStats} from "./dataTransform";

export function render(
  container: HTMLElement,
  calendar: CalendarGrid,
  dataPoints: DataPoint[],
  config: RenderConfig
): void {
  select(container).selectAll('*').remove();

  if (calendar.weeks.length === 0) {
    const div = select(container).append("div").attr("class", "no-data-message");
    div.text("No data available");
    return;
  }

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const width = Math.max(containerWidth, calendar.weeks.length * config.tileSize + config.padding.left + config.padding.right);
  const height = Math.max(containerHeight, 7 * config.tileSize + config.padding.top + config.padding.bottom);

  const svg = select(container)
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
  g: Selection<SVGGElement, unknown, HTMLElement, unknown>,
  calendar: CalendarGrid,
  dataPoints: DataPoint[],
  config: RenderConfig,
  stats: ReturnType<typeof calculateMeasureStats>
): void {
  console.log("max opacity", stats.max)
  const opacityScale = scaleLinear<number>()
    .domain([0, stats.max])
    .range([0, 1]);

  const tiles = g.selectAll('.tile')
    .data(calendar.days, (d: any) => d.key);

  tiles.exit().remove();

  tiles.enter()
    .append('rect')
    .attr('class', d => (d as CalendarDay).isPresent ? 'tile' : 'tile-empty')
    .merge(tiles as any)
    .attr('x', (d: CalendarDay) => d.week * config.tileSize)
    .attr('y', (d: CalendarDay) => d.dayOfWeek * config.tileSize)
    .attr('width', config.tileSize)
    .attr('height', config.tileSize)
    .attr('fill', (d: CalendarDay) => {
      if (!(d as CalendarDay).isPresent) {
        return '#f5f5f5';
      }
      return config.tileColor;
    })
    .attr('opacity', (d: CalendarDay) => {
      if (!(d as CalendarDay).isPresent || (d as CalendarDay).value === d.value) {
        return 1;
      }
      return opacityScale((d as any).value);
    })
    .attr('data-date', (d: CalendarDay) => (d as CalendarDay).key)
    .attr('data-value', (d: CalendarDay) => (d as CalendarDay).value !== null ? (d as CalendarDay).value : 'N/A');
}

function renderYAxis(
  g: Selection<SVGGElement, unknown, HTMLElement, unknown>,
  calendar: CalendarGrid,
  config: RenderConfig
): void {
  const yScale = scaleBand()
    .domain(range(7).map(String))
    .range([0, 7 * config.tileSize]);

  const weekdayLabels = g.selectAll('.weekday-label')
    .data(Array.from({ length: 7 }, (_, i) => i));

  weekdayLabels.exit().remove();

  weekdayLabels.enter()
    .append('text')
    .attr('class', 'weekday-label')
    .merge(weekdayLabels as any)
    .attr('x', -8)
    .attr('y', (d: any) => (yScale(String(d)) || 0) + config.tileSize / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', '12px')
    .attr('fill', '#666')
    .text((d: any) => getWeekdayLabel(d));
}

function renderXAxis(
  g: Selection<SVGGElement, unknown, HTMLElement, unknown>,
  calendar: CalendarGrid,
  config: RenderConfig
): void {
  const xScale = scaleLinear()
    .domain([0, calendar.weeks.length])
    .range([0, calendar.weeks.length * config.tileSize]);

  const monthLabels = g.selectAll('.month-label')
    .data(calendar.months);

  monthLabels.exit().remove();

  monthLabels.enter()
    .append('text')
    .attr('class', 'month-label')
    .merge(monthLabels as any)
    .attr('x', (d: any) => xScale((d.startWeek + d.endWeek) / 2))
    .attr('y', -12)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('fill', '#999')
    .text((d: any) => `${d.monthLabel} ${d.year}`);
}

