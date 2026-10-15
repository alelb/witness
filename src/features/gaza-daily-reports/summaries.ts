// Plain-language text for the Gaza over time view: month labels, the chart's text equivalents, and the table notes.
// Pure functions: no React. Figures come from the month buckets and the latest report, never recomputed here.
import { formatCount, formatIsoDate } from '../../components/format.ts';
import type { LatestReport, MonthBucket } from '../../data/aggregators/timeSeries.ts';

const monthFormat = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const shortDayFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const longDayFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

function utcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

/** `'2023-10'` → `"October 2023"`. */
export function monthLabel(month: string): string {
  return monthFormat.format(utcDate(`${month}-01`));
}

/** The last day a partial month covers: the latest report's date, when it falls in that month. */
function partialDay(bucket: MonthBucket, latest: LatestReport | null): string | null {
  return bucket.partial && latest !== null && latest.date.startsWith(bucket.month)
    ? latest.date
    : null;
}

/** `"October 2026 (to 14 Oct)"` for a partial month, `"October 2023"` otherwise. */
export function bucketLabel(bucket: MonthBucket, latest: LatestReport | null): string {
  const day = partialDay(bucket, latest);
  const label = monthLabel(bucket.month);
  return day === null ? label : `${label} (to ${shortDayFormat.format(utcDate(day))})`;
}

/** `1` → `"1 person"`, `74392` → `"74,392 people"`. */
function people(n: number): string {
  return n === 1 ? '1 person' : `${formatCount(n)} people`;
}

/**
 * "From October 2023 to October 2026 (to 14 October), 74,392 people were reported killed. The highest monthly figure
 * was October 2023, with 8,525 people killed." A month whose figure spans earlier months is not a monthly figure, and
 * months without a reported total are counted.
 */
export function monthlySummary(months: readonly MonthBucket[], latest: LatestReport): string {
  const first = months[0];
  const last = months.at(-1);
  if (first === undefined || last === undefined) return '';
  const day = partialDay(last, latest);
  const to =
    day === null
      ? monthLabel(last.month)
      : `${monthLabel(last.month)} (to ${longDayFormat.format(utcDate(day))})`;
  const total = latest.killedCum;
  const sentences = [
    `From ${monthLabel(first.month)} to ${to}, ${people(total)} ${total === 1 ? 'was' : 'were'} reported killed.`,
  ];

  let highest: MonthBucket | null = null;
  for (const bucket of months) {
    if (bucket.killed === null || bucket.spansFrom !== null) continue;
    if (highest === null || bucket.killed > (highest.killed ?? 0)) highest = bucket;
  }
  if (highest !== null && highest.killed !== null && highest.killed > 0) {
    sentences.push(
      `The highest monthly figure was ${monthLabel(highest.month)}, with ${people(highest.killed)} killed.`,
    );
  }

  const withoutTotal = months.filter((bucket) => bucket.killed === null).length;
  if (withoutTotal > 0) {
    sentences.push(
      withoutTotal === 1
        ? '1 month has no reported total.'
        : `${withoutTotal} months have no reported total.`,
    );
  }
  return sentences.join(' ');
}

/** "The reported total rose from 8,525 at the end of October 2023 to 74,392 on 14 October 2026." */
export function cumulativeSummary(months: readonly MonthBucket[], latest: LatestReport): string {
  const latestText = `${formatCount(latest.killedCum)} on ${formatIsoDate(latest.date)}`;
  const first = months.find((bucket) => bucket.killedCum !== null);
  if (first === undefined || first.killedCum === null || first.month === latest.date.slice(0, 7)) {
    return `The reported total was ${latestText}.`;
  }
  return `The reported total rose from ${formatCount(first.killedCum)} at the end of ${monthLabel(first.month)} to ${latestText}.`;
}

/** "Covers January 2024 to August 2024." for a figure that spans months without a reported total. */
export function spansNote(bucket: MonthBucket): string | null {
  return bucket.spansFrom === null
    ? null
    : `Covers ${monthLabel(bucket.spansFrom)} to ${monthLabel(bucket.month)}.`;
}

/** "1 row without a valid date was left out.", or `null` for none. */
export function skippedRowsNote(skippedRows: number): string | null {
  if (skippedRows <= 0) return null;
  return skippedRows === 1
    ? '1 row without a valid date was left out.'
    : `${formatCount(skippedRows)} rows without a valid date were left out.`;
}
