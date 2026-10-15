// Source module: Gaza daily casualties (Gaza daily reports). No transformation here beyond picking fields: only the
// report date, source, period, and the reported cumulatives leave this module. The `ext_*` fields (extrapolated by
// Tech for Palestine) are never read.
import { fail, fetchJson, ok, type FetchJsonOptions, type SourceResult } from './fetchJson.ts';

export const CASUALTIES_DAILY_URL =
  'https://data.techforpalestine.org/api/v2/casualties_daily.min.json';

/** The only shape that leaves this module. Values stay `unknown` until the daily report normalizer. */
export interface CasualtiesDailyRow {
  reportDate: unknown;
  reportSource: unknown;
  reportPeriod: unknown;
  killedCum: unknown;
  injuredCum: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Explains why `value` is not a valid payload, or returns `undefined` when it is. */
export function findShapeProblem(value: unknown): string | undefined {
  if (!Array.isArray(value)) return 'Payload is not an array';
  const index = value.findIndex((row) => !isRecord(row));
  if (index !== -1) return `Row ${index} is not an object`;
  return undefined;
}

/** Picks the five fields by name. A field left out of a row stays `undefined` (missing data is data). */
export function toDailyRows(payload: readonly Record<string, unknown>[]): CasualtiesDailyRow[] {
  return payload.map((row) => ({
    reportDate: row.report_date,
    reportSource: row.report_source,
    reportPeriod: row.report_period,
    killedCum: row.killed_cum,
    injuredCum: row.injured_cum,
  }));
}

export async function fetchCasualtiesDaily(
  options?: FetchJsonOptions,
): Promise<SourceResult<CasualtiesDailyRow[]>> {
  const result = await fetchJson(CASUALTIES_DAILY_URL, options);
  if (!result.ok) return result;
  const problem = findShapeProblem(result.data);
  if (problem !== undefined) return fail('shape', CASUALTIES_DAILY_URL, problem);
  return ok(toDailyRows(result.data as Record<string, unknown>[]));
}
