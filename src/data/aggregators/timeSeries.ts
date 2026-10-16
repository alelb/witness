// Time-series aggregators: pure functions from daily reports to monthly, chart-ready values. No React, no DOM, no
// network. Monthly figures are differences of month-end reported cumulatives, so they always reconcile with the
// latest reported total.
import type { DailyReport } from '../normalize/types.ts';

/** One calendar month, from the first to the last day of the series. */
export interface MonthBucket {
  /** `YYYY-MM`. */
  month: string;
  /** People reported killed in the month (or since `spansFrom`), or `null` without a reported cumulative. */
  killed: number | null;
  /** The last reported cumulative in the month, or `null`. */
  killedCum: number | null;
  /** `true` for the last month when the series ends before the month's last day. */
  partial: boolean;
  /** When the months before had no reported cumulative: the first month `killed` covers. Otherwise `null`. */
  spansFrom: string | null;
}

export interface LatestReport {
  /** `YYYY-MM-DD` of the last reported day with a killed cumulative. */
  date: string;
  killedCum: number;
  /** From the last reported day with an injured cumulative up to `date`, which may be earlier; `null` if none. */
  injuredCum: number | null;
}

/** What the worker posts: aggregates only, never daily rows. */
export interface DailyReportsSummary {
  months: MonthBucket[];
  latest: LatestReport | null;
  /** Rows without a valid date, left out of every figure. */
  skippedRows: number;
}

/** `'2023-10'` → `'2023-11'`; `'2023-12'` → `'2024-01'`. */
function nextMonth(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number) as [number, number];
  return monthIndex === 12
    ? `${year + 1}-01`
    : `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

/** The month's last day, `YYYY-MM-DD`. */
function lastDayOf(month: string): string {
  const [year, monthIndex] = month.split('-').map(Number) as [number, number];
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, monthIndex, 0)).toISOString().slice(0, 10);
}

/** Expects reports sorted by date, one per date, as `normalizeDailyReports()` returns them. */
export function byMonth(reports: readonly DailyReport[]): MonthBucket[] {
  const first = reports[0];
  const last = reports.at(-1);
  if (first === undefined || last === undefined) return [];

  const lastMonth = last.date.slice(0, 7);
  const months: MonthBucket[] = [];
  let previousCum = 0;
  let uncoveredFrom: string | null = null;
  let index = 0;

  for (let month = first.date.slice(0, 7); month <= lastMonth; month = nextMonth(month)) {
    let monthCum: number | null = null;
    for (; index < reports.length && reports[index]!.date.startsWith(month); index++) {
      const report = reports[index]!;
      if (report.reported && report.killedCum !== null) monthCum = report.killedCum;
    }

    const partial = month === lastMonth && last.date !== lastDayOf(month);

    if (monthCum === null) {
      uncoveredFrom ??= month;
      months.push({
        month,
        killed: null,
        killedCum: null,
        partial,
        spansFrom: null,
      });
    } else {
      // A negative difference is a downward correction in the reports: kept as is.
      months.push({
        month,
        killed: monthCum - previousCum,
        killedCum: monthCum,
        partial,
        spansFrom: uncoveredFrom,
      });
      previousCum = monthCum;
      uncoveredFrom = null;
    }
  }
  return months;
}

export function latestReport(reports: readonly DailyReport[]): LatestReport | null {
  let latest: LatestReport | null = null;
  let injuredCum: number | null = null;
  for (const report of reports) {
    if (!report.reported) continue;
    if (report.injuredCum !== null) injuredCum = report.injuredCum;
    // Injured figures after the latest killed figure are left out: the card shows one date.
    if (report.killedCum !== null) {
      latest = { date: report.date, killedCum: report.killedCum, injuredCum };
    }
  }
  return latest;
}

export function summarizeDailyReports(
  reports: readonly DailyReport[],
  skippedRows: number,
): DailyReportsSummary {
  return { months: byMonth(reports), latest: latestReport(reports), skippedRows };
}
