import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tooltipLines, yearLabel, yearTicks, type TimeSeriesPoint } from './timeSeries.ts';
import { TimeSeriesChart } from './TimeSeriesChart.tsx';

const WIDTH = 360;
const HEIGHT = 240;

// jsdom has no layout: report a fixed size so `ResponsiveContainer` renders the chart.
class ResizeObserverStub {
  private readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    const entry = {
      target,
      contentRect: { width: WIDTH, height: HEIGHT, top: 0, left: 0, right: WIDTH, bottom: HEIGHT },
    } as unknown as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}

const POINTS: TimeSeriesPoint[] = [
  { key: '2023-11', label: 'November 2023', value: 6_275 },
  { key: '2023-12', label: 'December 2023', value: null },
  { key: '2024-01', label: 'January 2024', value: 7_000 },
  { key: '2024-02', label: 'February 2024 (to 14 Feb)', value: 2_000, partial: true },
];

describe('TimeSeriesChart', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(WIDTH);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(HEIGHT);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: WIDTH,
      height: HEIGHT,
      top: 0,
      left: 0,
      right: WIDTH,
      bottom: HEIGHT,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it.each(['bars', 'line'] as const)('renders in %s mode, its SVG named by the title', (mode) => {
    render(<TimeSeriesChart title="Killed over time" points={POINTS} mode={mode} />);
    // Recharts' accessibility layer gives the SVG `role="application"`; its `<title>` is the accessible name.
    expect(screen.getByRole('application', { name: 'Killed over time' })).toBeInTheDocument();
  });

  it('draws one column per non-null point, the partial one outlined', () => {
    const { container } = render(
      <TimeSeriesChart title="Killed over time" points={POINTS} mode="bars" />,
    );
    const columns = [...container.querySelectorAll('.recharts-bar-rectangle path')];
    expect(columns).toHaveLength(3);
    expect(columns.map((column) => column.getAttribute('fill'))).toEqual([
      'var(--color-chart-bar)',
      'var(--color-chart-bar)',
      'var(--color-surface)',
    ]);
    expect(columns[2]).toHaveAttribute('stroke', 'var(--color-chart-bar)');
  });

  it('draws the line without dots', () => {
    const { container } = render(
      <TimeSeriesChart title="Killed over time" points={POINTS} mode="line" />,
    );
    expect(container.querySelector('.recharts-line-curve')).not.toBeNull();
    expect(container.querySelector('.recharts-line-dots')).toBeNull();
  });

  it('labels the X axis with years and the Y axis with at most 4 formatted counts', () => {
    const { container } = render(
      <TimeSeriesChart title="Killed over time" points={POINTS} mode="bars" />,
    );
    const text = (selector: string) =>
      [...container.querySelectorAll(`${selector} text`)].map((node) => node.textContent);
    // Four wide columns: the first point has room for its year before January.
    expect(text('.recharts-xAxis-tick-labels')).toEqual(['2023', '2024']);
    const yTicks = text('.recharts-yAxis-tick-labels');
    expect(yTicks.length).toBeLessThanOrEqual(4);
    expect(yTicks).toContain('0');
    expect(yTicks.every((tick) => /^[\d,]+$/.test(tick ?? ''))).toBe(true);
  });
});

it('drops the first year label when 37 months leave no room for it before January', () => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  const months = Array.from({ length: 37 }, (_, i) => {
    const date = new Date(Date.UTC(2023, 9 + i, 1)).toISOString().slice(0, 7);
    return { key: date, label: date, value: i };
  });
  const { container } = render(<TimeSeriesChart title="Killed" points={months} mode="bars" />);
  const ticks = [...container.querySelectorAll('.recharts-xAxis-tick-labels text')].map(
    (node) => node.textContent,
  );
  expect(ticks).toEqual(['2024', '2025', '2026']);
  vi.unstubAllGlobals();
});

describe('yearTicks', () => {
  // October 2023 to February 2025: Januaries at indexes 3 and 15.
  const keys = Array.from({ length: 17 }, (_, i) =>
    new Date(Date.UTC(2023, 9 + i, 1)).toISOString().slice(0, 7),
  );

  it('ticks every January and the first point when there is room before the next January', () => {
    expect(yearTicks(keys, 3)).toEqual(['2023-10', '2024-01', '2025-01']);
    expect(yearTicks(keys, 1)).toEqual(['2023-10', '2024-01', '2025-01']);
  });

  it('leaves the first point out when its label would overlap the next January', () => {
    expect(yearTicks(keys, 4)).toEqual(['2024-01', '2025-01']);
    expect(yearTicks(keys, Infinity)).toEqual(['2024-01']);
  });

  it('keeps Januaries at least minGap points apart on a narrow plot', () => {
    const months = Array.from({ length: 37 }, (_, i) =>
      new Date(Date.UTC(2023, 9 + i, 1)).toISOString().slice(0, 7),
    );
    expect(yearTicks(months, 13)).toEqual(['2024-01', '2026-01']);
    expect(yearTicks(months, 12)).toEqual(['2024-01', '2025-01', '2026-01']);
  });

  it('does not repeat a first point in January, and keeps a lone first point', () => {
    expect(yearTicks(['2024-01', '2024-02'], 5)).toEqual(['2024-01']);
    expect(yearTicks(['2024-03', '2024-04'], 5)).toEqual(['2024-03']);
    expect(yearTicks([], 5)).toEqual([]);
  });

  it('labels a tick with its year', () => {
    expect(yearLabel('2023-10')).toBe('2023');
  });
});

describe('tooltipLines', () => {
  it('shows the label and the formatted value', () => {
    expect(tooltipLines({ key: '2023-10', label: 'October 2023', value: 8_525 })).toEqual([
      'October 2023',
      '8,525',
    ]);
  });

  it('keeps a partial label and a negative value', () => {
    expect(
      tooltipLines({
        key: '2026-10',
        label: 'October 2026 (to 14 Oct)',
        value: -20,
        partial: true,
      }),
    ).toEqual(['October 2026 (to 14 Oct)', '-20']);
  });

  it('reads "No report" for a null value', () => {
    expect(tooltipLines({ key: '2024-01', label: 'January 2024', value: null })).toEqual([
      'January 2024',
      'No report',
    ]);
  });
});
