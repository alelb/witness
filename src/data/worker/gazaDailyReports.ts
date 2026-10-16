// Gaza daily reports pipeline: fetch → normalize → aggregate. Plain async TypeScript, run by the dataset worker and
// tested directly. Only the month buckets, the latest report and the skipped row count leave this module.
import { summarizeDailyReports, type DailyReportsSummary } from '../aggregators/timeSeries.ts';
import { normalizeDailyReports } from '../normalize/dailyReport.ts';
import { fetchCasualtiesDaily } from '../sources/casualtiesDaily.ts';
import { ok, type FetchJsonOptions, type SourceResult } from '../sources/fetchJson.ts';

export type GazaDailyReportsData = DailyReportsSummary;

export async function loadGazaDailyReports(
  options?: FetchJsonOptions,
): Promise<SourceResult<GazaDailyReportsData>> {
  const rows = await fetchCasualtiesDaily(options);
  if (!rows.ok) return rows;
  const { reports, skippedRows } = normalizeDailyReports(rows.data);
  return ok(summarizeDailyReports(reports, skippedRows));
}
