import { describe, expect, it } from 'vitest';
import { normalizeDailyReports } from '../normalize/dailyReport.ts';
import type { DailyReport } from '../normalize/types.ts';
import fixture from '../sources/__fixtures__/casualties-daily.sample.json';
import { toDailyRows } from '../sources/casualtiesDaily.ts';
import { byMonth, latestReport, summarizeDailyReports, type MonthBucket } from './timeSeries.ts';

/** A reported day; `killedCum` and `injuredCum` default to `null`. */
function day(date: string, killedCum: number | null = null, injuredCum: number | null = null) {
  return { date, reported: true, killedCum, injuredCum } satisfies DailyReport;
}

/** A day without a report. */
function gap(date: string): DailyReport {
  return { date, reported: false, killedCum: null, injuredCum: null };
}

function sumKilled(months: readonly MonthBucket[]): number {
  return months.reduce((acc, { killed }) => acc + (killed ?? 0), 0);
}

function fixtureReports(): DailyReport[] {
  return normalizeDailyReports(toDailyRows(fixture)).reports;
}

describe('byMonth', () => {
  it('returns no months for no reports', () => {
    expect(byMonth([])).toEqual([]);
  });

  it('takes the month-end cumulative from the last reported day, the first month counting from 0', () => {
    const months = byMonth([
      day('2023-10-07', 232),
      day('2023-10-30', 8_300),
      day('2023-10-31', 8_525),
      day('2023-11-01', 8_805),
      day('2023-11-29', 14_800),
      gap('2023-11-30'),
    ]);
    expect(months.map(({ month, killed, killedCum }) => [month, killed, killedCum])).toEqual([
      ['2023-10', 8_525, 8_525],
      ['2023-11', 6_275, 14_800],
    ]);
  });

  it('skips a reported day without a cumulative', () => {
    const [month] = byMonth([day('2024-01-01', 100), day('2024-01-31')]);
    expect(month).toMatchObject({ killed: 100, killedCum: 100, daysWithoutReport: 29 });
  });

  it('leaves a month without a reported cumulative null and spans the next one from it', () => {
    const months = byMonth([
      day('2024-01-31', 100),
      gap('2024-02-15'),
      day('2024-03-10'),
      day('2024-04-30', 400),
      day('2024-05-31', 500),
    ]);
    expect(months.map(({ month, killed, spansFrom }) => [month, killed, spansFrom])).toEqual([
      ['2024-01', 100, null],
      ['2024-02', null, null],
      ['2024-03', null, null],
      ['2024-04', 300, '2024-02'],
      ['2024-05', 100, null],
    ]);
    expect(months[1]?.killedCum).toBeNull();
  });

  it('spans from the first month when it has no reported cumulative', () => {
    const months = byMonth([gap('2024-01-31'), day('2024-02-29', 50)]);
    expect(months[0]).toMatchObject({ killed: null, spansFrom: null });
    expect(months[1]).toMatchObject({ killed: 50, spansFrom: '2024-01' });
  });

  it('keeps a negative difference (a downward correction)', () => {
    const months = byMonth([day('2024-01-31', 500), day('2024-02-29', 480)]);
    expect(months[1]).toMatchObject({ killed: -20, killedCum: 480 });
    expect(sumKilled(months)).toBe(480);
  });

  it('counts missing, period 0 and absent days as days without a report, within the series only', () => {
    // 7–31 October: 25 days, 3 reported. Period 0 and "missing" both normalize to `reported: false`.
    const months = byMonth([
      day('2023-10-07', 1),
      gap('2023-10-08'),
      gap('2023-10-09'),
      day('2023-10-10', 2),
      day('2023-10-31', 3),
      day('2023-11-01', 4),
      gap('2023-11-02'),
      day('2023-11-14', 5),
    ]);
    expect(months.map((m) => m.daysWithoutReport)).toEqual([22, 12]);
  });

  it('marks the last month partial only when the series ends before its last day', () => {
    const partial = byMonth([day('2026-09-30', 10), day('2026-10-14', 20)]);
    expect(partial.map((m) => m.partial)).toEqual([false, true]);
    const complete = byMonth([day('2026-09-30', 10), gap('2026-10-31')]);
    expect(complete.map((m) => m.partial)).toEqual([false, false]);
    expect(byMonth([day('2024-02-29', 10)])[0]?.partial).toBe(false);
    expect(byMonth([day('2023-02-28', 10)])[0]?.partial).toBe(false);
  });

  it('builds the fixture months', () => {
    const months = byMonth(fixtureReports());
    expect(months).toHaveLength(37);
    expect(months[0]).toEqual({
      month: '2023-10',
      killed: 8_525,
      killedCum: 8_525,
      daysWithoutReport: 21,
      partial: false,
      spansFrom: null,
    });
    // 1 December reported the same cumulative as 28 November.
    expect(months[2]).toMatchObject({ month: '2023-12', killed: 0, killedCum: 14_800 });
    expect(months[3]).toMatchObject({ month: '2024-01', killed: null, daysWithoutReport: 31 });
    expect(months[10]).toMatchObject({ month: '2024-08', killed: 25_891, spansFrom: '2024-01' });
    expect(months.at(-1)).toMatchObject({
      month: '2026-10',
      killed: 360,
      killedCum: 74_392,
      partial: true,
      daysWithoutReport: 11,
    });
  });
});

describe('latestReport', () => {
  it('returns null without a reported killed cumulative', () => {
    expect(latestReport([])).toBeNull();
    expect(latestReport([gap('2024-01-01'), day('2024-01-02')])).toBeNull();
  });

  it('takes the last reported day with a killed cumulative', () => {
    expect(
      latestReport([day('2024-01-01', 10, 30), day('2024-01-02', 12, 35), day('2024-01-03')]),
    ).toEqual({ date: '2024-01-02', killedCum: 12, injuredCum: 35 });
  });

  it('takes the injured cumulative from an earlier day when the later one has none', () => {
    expect(latestReport([day('2024-01-01', 10, 30), day('2024-01-02', 12)])).toEqual({
      date: '2024-01-02',
      killedCum: 12,
      injuredCum: 30,
    });
    expect(latestReport([day('2024-01-01', 10)])?.injuredCum).toBeNull();
  });

  it('leaves out an injured cumulative reported after the latest killed figure', () => {
    expect(latestReport([day('2024-01-01', 10, 30), day('2024-01-02', null, 40)])).toEqual({
      date: '2024-01-01',
      killedCum: 10,
      injuredCum: 30,
    });
  });

  it('reads the fixture', () => {
    expect(latestReport(fixtureReports())).toEqual({
      date: '2026-10-14',
      killedCum: 74_392,
      injuredCum: 175_440,
    });
  });
});

describe('summarizeDailyReports', () => {
  it('returns the months, the latest report and the skipped rows', () => {
    const reports = fixtureReports();
    expect(summarizeDailyReports(reports, 2)).toEqual({
      months: byMonth(reports),
      latest: latestReport(reports),
      skippedRows: 2,
    });
  });
});

describe('invariant: the monthly figures sum to the latest reported total', () => {
  it('holds on the fixture', () => {
    const reports = fixtureReports();
    expect(sumKilled(byMonth(reports))).toBe(latestReport(reports)?.killedCum);
  });

  /** Deterministic pseudo-random daily series (LCG) with gaps, absent days, missing counts and corrections. */
  function generatedSeries(seed: number, days: number): DailyReport[] {
    let state = seed;
    const next = () => {
      state = (state * 1_103_515_245 + 12_345) % 2 ** 31;
      return state / 2 ** 31;
    };
    const reports: DailyReport[] = [];
    let cum = 0;
    const start = Date.UTC(2023, 9, 7);
    for (let i = 0; i < days; i++) {
      const date = new Date(start + i * 86_400_000).toISOString().slice(0, 10);
      const roll = next();
      if (roll < 0.05) continue; // no row at all
      if (roll < 0.15) {
        reports.push(gap(date));
        continue;
      }
      cum = Math.max(0, cum + Math.floor(next() * 300) - (next() < 0.03 ? 400 : 0));
      reports.push(day(date, next() < 0.1 ? null : cum, null));
    }
    return reports;
  }

  it.each([1, 7, 42, 2023, 99_999])('holds on a generated series (seed %i)', (seed) => {
    const reports = generatedSeries(seed, 1_100);
    const months = byMonth(reports);
    expect(sumKilled(months)).toBe(latestReport(reports)?.killedCum ?? 0);
    // Contiguous months, and every day of the series counted once.
    const reportedDays = reports.filter((r) => r.reported).length;
    const first = reports[0]?.date ?? '';
    const last = reports.at(-1)?.date ?? '';
    const seriesDays = (Date.parse(last) - Date.parse(first)) / 86_400_000 + 1;
    expect(months.reduce((acc, m) => acc + m.daysWithoutReport, 0)).toBe(seriesDays - reportedDays);
    expect(months[0]?.month).toBe(first.slice(0, 7));
    expect(months.at(-1)?.month).toBe(last.slice(0, 7));
  });
});
