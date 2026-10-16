# Phase 12–13 — Gaza daily casualties: Plan

Branch: `phase-12-13-gaza-daily-casualties`

## 1. Source

1.1 `src/data/sources/casualtiesDaily.ts`: `CASUALTIES_DAILY_URL` (minified v2 endpoint), `CasualtiesDailyRow`
(`reportDate`, `reportSource`, `reportPeriod`, `killedCum`, `injuredCum`, all `unknown`), `findShapeProblem()` (array of
objects), `toDailyRows()` picking only those five fields, and `fetchCasualtiesDaily(options)` returning a
`SourceResult`, following `killedInGaza.ts`.
1.2 `src/data/sources/__fixtures__/casualties-daily.sample.json`: about 20 real rows (2026-10-15 download), kept with
all their fields, covering: the first days of October 2023, a `report_source: "missing"` day with filled-in values, a
`report_period: 0` day, a 48 h report, a reported day without `killed_cum`, the end of November 2023 (last day without
a report), a month boundary, and the last rows of the series.
1.3 `src/data/sources/casualtiesDaily.test.ts`: shape errors (not an array, a non-object row), field picking (no
`ext_*` field leaves the module), fetch errors passed through.

## 2. Normalizer

2.1 `src/data/normalize/types.ts`: add `DailyReport { date; reported; killedCum; injuredCum }`.
2.2 `src/data/normalize/dailyReport.ts`: `REPORT_SOURCES = ['mohtel', 'gmotel', 'unocha']`,
`normalizeDailyReport(row): DailyReport | null` (null for an invalid date), and
`normalizeDailyReports(rows): { reports: DailyReport[]; skippedRows: number }` (sorted by date, the later duplicate
wins).
2.3 `src/data/normalize/dailyReport.test.ts`: table-driven rules for `reported` (each source, `"missing"`, period 0,
24, 48, absent, non-integer, string), counts (integers, strings, negatives, fractions, `null`), counts ignored on days
without a report, invalid and duplicate dates, the fixture end to end.

## 3. Aggregators

3.1 `src/data/aggregators/timeSeries.ts`: `MonthBucket`, `LatestReport`, `byMonth(reports)`, `latestReport(reports)`,
and `summarizeDailyReports(reports, skippedRows)` → `{ months, latest, skippedRows }` (the worker payload).
3.2 `src/data/aggregators/timeSeries.test.ts`: month-end cumulative from the last reported day; first month counts
from 0; a month without a reported cumulative (`null`, then `spansFrom` on the next month); a negative difference kept;
`daysWithoutReport` for missing, period 0 and absent days; `partial` on and off; `latestReport` with a later injured
gap; the invariant (sum of monthly `killed` = latest `killedCum`) on the fixture and on generated series.

## 4. Worker and dataset registry

4.1 `src/data/worker/gazaDailyReports.ts`: `loadGazaDailyReports(options)`: fetch → normalize → aggregate.
4.2 `src/data/worker/datasets.ts`: add `'gaza-daily-reports'` to `DatasetData` and `loaders`.
4.3 `src/data/worker/gazaDailyReports.test.ts`: the loader with a stubbed `fetch` (success on the fixture, error passed
through); only aggregates in the result.

## 5. Shared components

5.1 Lazy chunk helper: move `reloadCharts` and the preload effect from `GazaDemographicsView.tsx` to
`src/components/lazyChunk.ts` (`useRetryableLazy(load)` → `{ Component, attempt, retry }`, preloading on mount), and
`ChartsErrorBoundary.tsx` to `src/components/`. Export both from the barrel (no `recharts` import).
5.2 `GazaDemographicsView.tsx`: use the helper; markup and behaviour unchanged. Its existing tests pass unchanged
(only import paths may move).
5.3 `ChartFrame.tsx` / `.module.css`: optional `rows` (fixed `min(var(--chart-time-height), 70svh)` plot without it;
new token in `tokens.css`) and optional `details` slot; same for `ChartFrameSkeleton`. Tests for both variants.
5.4 `TimeSeriesChart.tsx` + `.module.css`: `bars` (`BarChart`, vertical columns) and `line` (`LineChart`, no dots)
in a `ResponsiveContainer`; year ticks on January and the first point; at most 4 Y ticks with `formatCount`; outlined
partial column; click tooltip with month and value; animations off; `title` on the SVG.
5.5 `TimeSeriesChart.test.tsx`: smoke render in both modes (SVG named by the title), tick selection helper and
tooltip content as pure functions, `null` points draw no bar.
5.6 Update the header comments of `components/index.ts` and `HorizontalBarChart.tsx` for the `*Chart.tsx` rule.

## 6. View

6.1 `src/features/gaza-daily-reports/summaries.ts`: `monthLabel('2023-10')` → "October 2023", `monthlySummary()`,
`cumulativeSummary()`, using `formatCount` and `formatIsoDate`; singular/plural handled. Tests in
`summaries.test.ts`.
6.2 `DailyReportsChart.tsx` (default export, the lazy chunk): `ChartFrame` titled "Killed over time", the toggle
(`aria-pressed` buttons), `TimeSeriesChart`, the hidden summary for the current mode, and the `details` table.
6.3 `MonthTable.tsx` + `.module.css`: `<details>` "Figures by month"; stacked list below 640 px, table from 640 px
(`min-width` query only); "No report", "(to 14 Oct)", `spansFrom` and `skippedRows` notes.
6.4 `GazaDailyReportsView.tsx` + `.module.css`: `useDataset('gaza-daily-reports')`, `StateBoundary`, `KpiCard` (total,
date, injured aside), and the lazy chart with Retry from 5.1.
6.5 `index.ts`: export the `view` (`id: 'gaza-daily-reports'`, label and title "Gaza over time").
6.6 `src/app/views.ts`: add `gazaDailyReports.view` as the second entry.
6.7 Tests: `GazaDailyReportsView.test.tsx` (loading, error with Retry, empty, KPI figures and date, injured aside
present/absent, chart chunk failure with Retry), `DailyReportsChart.test.tsx` (toggle switches mode, `aria-pressed`,
summary follows; table rows, "No report", partial label), `App.test.tsx` updated for the real two-view registry (menu
shown, both links, default view unchanged).

## 7. Checks, docs and roadmap

7.1 Run `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`; record the bundle sizes in
`validation.md`.
7.2 On `pnpm preview`, then on the Pages URL after the deploy: the full responsive matrix in light and dark for both
views and the menu; keyboard pass; live cross-checks; Lighthouse mobile on both routes.
7.3 `docs/data-sources.md`: catalog row "In use (Phase 12–13)" with the source module; add the source module path.
7.4 README "What Witness shows": add the new view.
7.5 Update `CHANGELOG.md` after committing.
7.6 Open a PR, confirm `ci` is green, and wait for the owner's review before merging.
7.7 After the merge and a successful deploy, mark Phase 12–13 ✅ in `specs/roadmap.md`.
