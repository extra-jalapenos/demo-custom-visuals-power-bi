import { select, Selection } from 'd3-selection';
import { scaleLinear, scaleBand } from 'd3-scale';
import { range } from 'd3-array';
import {CalendarDay, CalendarGrid, DataPoint, RenderConfig, SeriesValue} from './types';
import { getWeekdayLabel } from './calendarLayout';
import {calculateMeasureStats} from "./dataTransform";
import powerbi from "powerbi-visuals-api";

interface RenderOptions {
  colorPalette: powerbi.extensibility.IColorPalette;
}

export function render(
  container: HTMLElement,
  calendar: CalendarGrid,
  dataPoints: DataPoint[],
  config: RenderConfig,
  options: RenderOptions
): void {
  select(container).selectAll('*').remove();

  if (calendar.weeks.length === 0) {
    const div = select(container).append("div").attr("class", "no-data-message");
    div.text("No data available");
    return;
  }

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const legendHeight = 60;
  const width = Math.max(containerWidth, calendar.weeks.length * config.tileSize + config.padding.left + config.padding.right);
  const height = Math.max(containerHeight, 7 * config.tileSize + config.padding.top + config.padding.bottom + legendHeight);

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
  const allSeries = extractUniqueSeries(dataPoints);

  renderTiles(g, calendar, dataPoints, config, stats, options, allSeries);
  renderYAxis(g, calendar, config);
  renderXAxis(g, calendar, config);
  renderLegend(svg, allSeries, options, config);
}

function renderTiles(
  g: Selection<SVGGElement, unknown, HTMLElement, unknown>,
  calendar: CalendarGrid,
  dataPoints: DataPoint[],
  config: RenderConfig,
  stats: ReturnType<typeof calculateMeasureStats>,
  options: RenderOptions,
  allSeries: string[]
): void {
  const opacityScale = scaleLinear<number>()
    .domain([0, stats.max])
    .range([0, 1]);

  const dayGroups = g.selectAll('.day-group')
    .data(calendar.days, (d: any) => d.key);

  dayGroups.exit().remove();

  const dayGroup = dayGroups.enter()
    .append('g')
    .attr('class', 'day-group')
    .merge(dayGroups as any);

  dayGroup
    .attr('transform', (d: CalendarDay) => `translate(${d.week * config.tileSize}, ${d.dayOfWeek * config.tileSize})`);

  const tiles = dayGroup.selectAll('.tile')
    .data((d: CalendarDay) => {
      if (!d.isPresent || !d.seriesValues || d.seriesValues.length === 0) {
        return [{
          series: '',
          value: null,
          colorIndex: -1,
          date: d.key,
          seriesCount: 0,
          index: 0,
        }];
      }
      return d.seriesValues.map((sv, i) => ({
        ...sv,
        date: d.key,
        seriesCount: d.seriesValues!.length,
        index: i,
      }));
    });

  tiles.exit().remove();

  tiles.enter()
    .append('rect')
    .attr('class', 'tile')
    .merge(tiles as any)
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', config.tileSize)
    .attr('height', config.tileSize)
    .attr('fill', (d: any) => {
      if (d.colorIndex < 0) {
        return '#f5f5f5';
      }
      const color = options.colorPalette.getColor(String(d.colorIndex));
      return color.value;
    })
    .attr('opacity', (d: any) => {
      if (d.value === null) {
        return 1;
      }
      const baseOpacity = opacityScale(d.value);
      return Math.min(baseOpacity / Math.max(d.seriesCount, 1), 1);
    })
    .attr('data-date', (d: any) => d.date)
    .attr('data-series', (d: any) => d.series)
    .attr('data-value', (d: any) => d.value !== null ? d.value : 'N/A')
    .on('mouseenter', function (event, d: any) {
      if (d.colorIndex < 0) return;
      select(this).classed('tile-highlight', true);
      showTooltip(event, d);
    })
    .on('mouseleave', function () {
      select(this).classed('tile-highlight', false);
      hideTooltip();
    })
    .on('click', function (event, d: any) {
      if (d.colorIndex < 0) return;
      const isActive = select(this).classed('tile-active');
      if (isActive) {
        g.selectAll('.tile').classed('tile-active', false).attr('opacity', function (this: any) {
          const tileData = select(this).datum() as any;
          return calculateOpacity(tileData, opacityScale);
        });
      } else {
        g.selectAll('.tile').classed('tile-active', false);
        g.selectAll('.tile').attr('opacity', 0.2);
        g.selectAll(`.tile[data-series="${d.series}"]`).classed('tile-active', true).attr('opacity', function (this: any) {
          const tileData = select(this).datum() as any;
          return calculateOpacity(tileData, opacityScale);
        });
      }
    });
}

function calculateOpacity(d: any, opacityScale: any): number {
  if (d.value === null) {
    return 1;
  }
  const baseOpacity = opacityScale(d.value);
  return Math.min(baseOpacity / Math.max(d.seriesCount, 1), 1);
}

function showTooltip(event: MouseEvent, d: any): void {
  const tooltip = select('body').selectAll('.tile-tooltip').data([null]);
  tooltip.exit().remove();
  tooltip.enter()
    .append('div')
    .attr('class', 'tile-tooltip');

  select('.tile-tooltip')
    .style('position', 'absolute')
    .style('background', '#333')
    .style('color', '#fff')
    .style('padding', '6px 10px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('z-index', '9999')
    .style('left', `${event.pageX + 10}px`)
    .style('top', `${event.pageY + 10}px`)
    .text(`${d.series}: ${d.value !== null ? d.value : 'N/A'}`);
}

function hideTooltip(): void {
  select('.tile-tooltip').remove();
}

function extractUniqueSeries(dataPoints: DataPoint[]): string[] {
  const seriesSet = new Set<string>();
  dataPoints.forEach(dp => {
    if (dp.seriesValues) {
      dp.seriesValues.forEach(sv => {
        seriesSet.add(sv.series);
      });
    }
  });
  return Array.from(seriesSet);
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

function renderLegend(
  svg: Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
  series: string[],
  options: RenderOptions,
  config: RenderConfig
): void {
  const legendY = config.padding.top + 7 * config.tileSize + config.padding.bottom - 40;
  const legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${config.padding.left}, ${legendY})`);

  const items = legend.selectAll('.legend-item')
    .data(series);

  items.exit().remove();

  items.enter()
    .append('g')
    .attr('class', 'legend-item')
    .merge(items as any)
    .attr('transform', (d, i) => `translate(${i * 150}, 0)`)
    .each(function (d, i) {
      const item = select(this);
      const color = options.colorPalette.getColor(String(i));

      item.append('rect')
        .attr('width', 14)
        .attr('height', 14)
        .attr('fill', color.value);

      item.append('text')
        .attr('x', 20)
        .attr('y', 11)
        .attr('font-size', '12px')
        .attr('fill', '#333')
        .text(d);
    });
}

