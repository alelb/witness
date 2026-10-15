import { describe, expect, it } from 'vitest';
import type { LatestReport, MonthBucket } from '../../data/aggregators/timeSeries.ts';
import {
  bucketLabel,
  cumulativeSummary,
  monthLabel,
  monthlySummary,
  skippedRowsNote,
  spansNote,
} from './summaries.ts';

function bucket(month: string, killed: number | null, killedCum: number | null = killed) {
  return {
    month,
    killed,
    killedCum,
    daysWithoutReport: 0,
    partial: false,
    spansFrom: null,
  } satisfies MonthBucket as MonthBucket;
}

const LATEST: LatestReport = { date: '2026-10-14', killedCum: 74_392, injuredCum: 175_440 };

const MONTHS: MonthBucket[] = [
  bucket('2023-10', 8_525, 8_525),
  bucket('2023-11', 6_275, 14_800),
  bucket('2026-09', 59_232, 74_032),
  { ...bucket('2026-10', 360, 74_392), partial: true },
];

describe('monthLabel', () => {
  it.each([
    ['2023-10', 'October 2023'],
    ['2024-01', 'January 2024'],
    ['2026-12', 'December 2026'],
  ])('%s → %s', (month, label) => {
    expect(monthLabel(month)).toBe(label);
  });
});

describe('bucketLabel', () => {
  it('names a partial month by its last day', () => {
    expect(bucketLabel(MONTHS[3] as MonthBucket, LATEST)).toBe('October 2026 (to 14 Oct)');
  });

  it('names a full month, or a partial one without a report in it, by the month only', () => {
    expect(bucketLabel(MONTHS[0] as MonthBucket, LATEST)).toBe('October 2023');
    const partial = { ...bucket('2026-11', null), partial: true };
    expect(bucketLabel(partial, LATEST)).toBe('November 2026');
  });
});

describe('monthlySummary', () => {
  it('states the period, the total and the highest month', () => {
    expect(monthlySummary(MONTHS, LATEST)).toBe(
      'From October 2023 to October 2026 (to 14 October), 74,392 people were reported killed. ' +
        'The highest monthly figure was September 2026, with 59,232 people killed.',
    );
  });

  it('leaves a figure that spans months out of the highest one, and counts the months without a total', () => {
    const months = [
      MONTHS[0] as MonthBucket,
      bucket('2023-11', null),
      bucket('2023-12', null),
      { ...bucket('2024-01', 9_000, 17_525), spansFrom: '2023-11' },
    ];
    expect(
      monthlySummary(months, { date: '2024-01-31', killedCum: 17_525, injuredCum: null }),
    ).toBe(
      'From October 2023 to January 2024, 17,525 people were reported killed. ' +
        'The highest monthly figure was October 2023, with 8,525 people killed. ' +
        '2 months have no reported total.',
    );
  });

  it('handles the singular', () => {
    const months = [bucket('2024-01', null), { ...bucket('2024-02', 1), spansFrom: '2024-01' }];
    expect(monthlySummary(months, { date: '2024-02-29', killedCum: 1, injuredCum: null })).toBe(
      'From January 2024 to February 2024, 1 person was reported killed. 1 month has no reported total.',
    );
    expect(
      monthlySummary([bucket('2024-01', 1)], {
        date: '2024-01-31',
        killedCum: 1,
        injuredCum: null,
      }),
    ).toBe(
      'From January 2024 to January 2024, 1 person was reported killed. ' +
        'The highest monthly figure was January 2024, with 1 person killed.',
    );
  });

  it('returns an empty string without months', () => {
    expect(monthlySummary([], LATEST)).toBe('');
  });
});

describe('cumulativeSummary', () => {
  it('states the rise from the first month-end total to the latest report', () => {
    expect(cumulativeSummary(MONTHS, LATEST)).toBe(
      'The reported total rose from 8,525 at the end of October 2023 to 74,392 on 14 October 2026.',
    );
  });

  it('starts from the first month with a reported total', () => {
    const months = [bucket('2023-10', null), ...MONTHS.slice(1)];
    expect(cumulativeSummary(months, LATEST)).toMatch(
      /^The reported total rose from 14,800 at the end of November 2023/,
    );
  });

  it('states the total only when the first total is in the latest month', () => {
    expect(cumulativeSummary([MONTHS[3] as MonthBucket], LATEST)).toBe(
      'The reported total was 74,392 on 14 October 2026.',
    );
  });
});

describe('notes', () => {
  it('names the months a spanning figure covers', () => {
    expect(spansNote({ ...bucket('2024-08', 25_891), spansFrom: '2024-01' })).toBe(
      'Covers January 2024 to August 2024.',
    );
    expect(spansNote(bucket('2024-08', 25_891))).toBeNull();
  });

  it('counts the rows without a valid date', () => {
    expect(skippedRowsNote(0)).toBeNull();
    expect(skippedRowsNote(1)).toBe('1 row without a valid date was left out.');
    expect(skippedRowsNote(1_200)).toBe('1,200 rows without a valid date were left out.');
  });
});
