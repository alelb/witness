import { describe, expect, it } from 'vitest';
import fixture from '../sources/__fixtures__/casualties-daily.sample.json';
import { toDailyRows, type CasualtiesDailyRow } from '../sources/casualtiesDaily.ts';
import { normalizeDailyReport, normalizeDailyReports, REPORT_SOURCES } from './dailyReport.ts';

function row(overrides: Partial<CasualtiesDailyRow> = {}): CasualtiesDailyRow {
  return {
    reportDate: '2024-01-15',
    reportSource: 'mohtel',
    reportPeriod: 24,
    killedCum: 24_100,
    injuredCum: 60_800,
    ...overrides,
  };
}

describe('normalizeDailyReport: reported', () => {
  it.each([
    ...REPORT_SOURCES.map(
      (source) => [`source ${source}`, { reportSource: source }, true] as const,
    ),
    ['source "missing"', { reportSource: 'missing' }, false],
    ['an unknown source', { reportSource: 'other' }, false],
    ['an upper-case source', { reportSource: 'MOHTEL' }, false],
    ['an absent source', { reportSource: undefined }, false],
    ['period 24', { reportPeriod: 24 }, true],
    ['period 48', { reportPeriod: 48 }, true],
    ['period 0', { reportPeriod: 0 }, false],
    ['a negative period', { reportPeriod: -24 }, false],
    ['a non-integer period', { reportPeriod: 1.5 }, false],
    ['a string period', { reportPeriod: '24' }, false],
    ['an absent period', { reportPeriod: undefined }, false],
    ['a null period', { reportPeriod: null }, false],
  ] as const)('%s → %s', (_label, overrides, reported) => {
    expect(normalizeDailyReport(row(overrides))?.reported).toBe(reported);
  });
});

describe('normalizeDailyReport: counts', () => {
  it.each([
    ['an integer', 24_100, 24_100],
    ['zero', 0, 0],
    ['negative zero', -0, 0],
    ['an integer string', '24100', null],
    ['an empty string', '', null],
    ['a negative number', -1, null],
    ['a fraction', 1.5, null],
    ['NaN', Number.NaN, null],
    ['null', null, null],
    ['an absent value', undefined, null],
  ])('%s → %s', (_label, value, expected) => {
    const report = normalizeDailyReport(row({ killedCum: value, injuredCum: value }));
    expect(report?.killedCum).toBe(expected);
    expect(report?.injuredCum).toBe(expected);
  });

  it.each([
    ['"missing"', { reportSource: 'missing' }],
    ['period 0', { reportPeriod: 0 }],
  ])('ignores the counts on a day without a report (%s)', (_label, overrides) => {
    expect(normalizeDailyReport(row(overrides))).toEqual({
      date: '2024-01-15',
      reported: false,
      killedCum: null,
      injuredCum: null,
    });
  });
});

describe('normalizeDailyReport: date', () => {
  it.each([
    ['a datetime', '2024-01-15T00:00:00Z'],
    ['a day-first date', '15-01-2024'],
    ['an impossible day', '2023-02-30'],
    ['month 13', '2023-13-01'],
    ['a number', 20240115],
    ['an empty string', ''],
    ['an absent date', undefined],
  ])('returns null for %s', (_label, reportDate) => {
    expect(normalizeDailyReport(row({ reportDate }))).toBeNull();
  });

  it('accepts 29 February in a leap year', () => {
    expect(normalizeDailyReport(row({ reportDate: '2024-02-29' }))?.date).toBe('2024-02-29');
  });
});

describe('normalizeDailyReports', () => {
  it('sorts by date and counts the rows without a valid date', () => {
    const { reports, skippedRows } = normalizeDailyReports([
      row({ reportDate: '2024-01-17' }),
      row({ reportDate: 'not a date' }),
      row({ reportDate: '2024-01-15' }),
      row({ reportDate: undefined }),
      row({ reportDate: '2024-01-16' }),
    ]);
    expect(reports.map((r) => r.date)).toEqual(['2024-01-15', '2024-01-16', '2024-01-17']);
    expect(skippedRows).toBe(2);
  });

  it('keeps the later row for a duplicate date', () => {
    const { reports } = normalizeDailyReports([
      row({ reportDate: '2024-01-15', killedCum: 1 }),
      row({ reportDate: '2024-01-16', killedCum: 2 }),
      row({ reportDate: '2024-01-15', killedCum: 3 }),
    ]);
    expect(reports.map((r) => [r.date, r.killedCum])).toEqual([
      ['2024-01-15', 3],
      ['2024-01-16', 2],
    ]);
  });

  it('returns no reports for no rows', () => {
    expect(normalizeDailyReports([])).toEqual({ reports: [], skippedRows: 0 });
  });

  it('normalizes the fixture end to end', () => {
    const { reports, skippedRows } = normalizeDailyReports(toDailyRows(fixture));
    expect(skippedRows).toBe(0);
    expect(reports).toHaveLength(fixture.length);
    const byDate = new Map(reports.map((r) => [r.date, r]));
    // First day of the series.
    expect(byDate.get('2023-10-07')).toEqual({
      date: '2023-10-07',
      reported: true,
      killedCum: 232,
      injuredCum: 1_610,
    });
    // "missing": filled-in values are ignored.
    expect(byDate.get('2023-10-13')).toMatchObject({ reported: false, killedCum: null });
    // The last day of November 2023 had no report.
    expect(byDate.get('2023-11-30')).toMatchObject({ reported: false, killedCum: null });
    // A reported day without `killed_cum`.
    expect(byDate.get('2023-12-20')).toEqual({
      date: '2023-12-20',
      reported: true,
      killedCum: null,
      injuredCum: null,
    });
    // Period 0, then a 48 h report.
    expect(byDate.get('2024-08-11')).toMatchObject({ reported: false, killedCum: null });
    expect(byDate.get('2024-08-12')).toMatchObject({ reported: true, killedCum: 39_897 });
    expect(reports.at(-1)).toEqual({
      date: '2026-10-14',
      reported: true,
      killedCum: 74_392,
      injuredCum: 175_440,
    });
  });
});
