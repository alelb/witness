// Chart-library-free helpers for `TimeSeriesChart`: its point type, X tick selection, and tooltip text. Pure
// functions, tested without rendering.
import { formatCount } from './format.ts';

export interface TimeSeriesPoint {
  /** `YYYY-MM`: the category on the X axis. */
  key: string;
  /** Shown in the tooltip, e.g. "October 2026 (to 14 Oct)". */
  label: string;
  /** `null` draws nothing: no zero bar, a gap in the line. */
  value: number | null;
  /** Drawn as an outlined column. */
  partial?: boolean;
}

export type TimeSeriesMode = 'bars' | 'line';

/**
 * The X ticks: Januaries at least `minGap` points apart (every year when there is room), plus the first point when
 * there is room for its label before the first January tick. Labels are years, so at most one tick per year.
 */
export function yearTicks(keys: readonly string[], minGap: number): string[] {
  const ticks: number[] = [];
  keys.forEach((key, index) => {
    const previous = ticks.at(-1);
    if (key.endsWith('-01') && (previous === undefined || index - previous >= minGap)) {
      ticks.push(index);
    }
  });
  const [firstTick] = ticks;
  if (keys.length > 0 && firstTick !== 0 && (firstTick === undefined || firstTick >= minGap)) {
    ticks.unshift(0);
  }
  return ticks.map((index) => keys[index] ?? '');
}

/** `'2024-01'` → `'2024'`. */
export function yearLabel(key: string): string {
  return key.slice(0, 4);
}

/** The tooltip's two lines: the point's label, then its value or "No report". */
export function tooltipLines(point: TimeSeriesPoint): [label: string, value: string] {
  return [point.label, point.value === null ? 'No report' : formatCount(point.value)];
}
