// Daily report normalizer: raw Gaza daily casualties rows to typed `DailyReport`s. Pure TypeScript: no React, no DOM,
// no network, so it is safe in a Worker. Nothing here throws. Only reported values are kept: on a day without a
// report the dataset's counts were filled in by Tech for Palestine, and they are ignored.
import type { CasualtiesDailyRow } from '../sources/casualtiesDaily.ts';
import type { DailyReport } from './types.ts';

/** Sources that publish reports (Ministry of Health, Government Media Office, UN OCHA). `missing` is not one. */
export const REPORT_SOURCES: readonly string[] = ['mohtel', 'gmotel', 'unocha'];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A `YYYY-MM-DD` string naming a real calendar day (no 30 February), or `null`. */
function toIsoDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = ISO_DATE.exec(value);
  if (match === null) return null;
  const [, year, month, day] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? value
    : null;
}

function isReported(source: unknown, period: unknown): boolean {
  return (
    typeof source === 'string' &&
    REPORT_SOURCES.includes(source) &&
    typeof period === 'number' &&
    Number.isInteger(period) &&
    period > 0
  );
}

function toCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value + 0 : null;
}

/** One report per row, or `null` when the row has no valid date and cannot be placed in time. */
export function normalizeDailyReport(row: CasualtiesDailyRow): DailyReport | null {
  const date = toIsoDate(row.reportDate);
  if (date === null) return null;
  const reported = isReported(row.reportSource, row.reportPeriod);
  return {
    date,
    reported,
    killedCum: reported ? toCount(row.killedCum) : null,
    injuredCum: reported ? toCount(row.injuredCum) : null,
  };
}

/** Reports sorted by date, one per date (the later row in the file wins), and the number of rows without a date. */
export function normalizeDailyReports(rows: readonly CasualtiesDailyRow[]): {
  reports: DailyReport[];
  skippedRows: number;
} {
  const byDate = new Map<string, DailyReport>();
  let skippedRows = 0;
  for (const row of rows) {
    const report = normalizeDailyReport(row);
    if (report === null) skippedRows++;
    else byDate.set(report.date, report);
  }
  // ISO dates sort as strings.
  const reports = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  return { reports, skippedRows };
}
