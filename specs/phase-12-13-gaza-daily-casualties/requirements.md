# Phase 12–13 — Gaza daily casualties: Requirements

## Goal

Show when people were killed in Gaza: a second view, "Gaza over time", built from the Gaza daily reports. It shows
the people reported killed per month, with a toggle to the cumulative total, and a KPI card with the latest reported
totals. It is the second registered view, so the "Views" menu from Phase 11 appears for the first time.

This phase merges the former Phases 12 (source, normalizer, aggregators) and 13 (view), so it ships something
visible (decided 2026-10-15). Stakeholder stories and principles:

- Roadmap Milestone C (time series); [3.1] modular UI layout: the view plugs in through the Phase 11 registry.
- Mission principles 1 (data as witness: no extrapolated value shown), 3 (days without a report are explicit), 4
  (attribution and last update date), 5 and 6 (mobile first, text and table equivalents).

## Context (2026-10-15)

- Dataset profiled on 2026-10-15; structure, field meanings and value rules are in
  [`docs/data-sources.md`](../../docs/data-sources.md#gaza-daily-casualties). In short: one record per calendar day,
  1,104 rows from 2023-10-07 to 2026-10-14, no missing or duplicate dates; 125 days have no report
  (`report_source: "missing"` or `report_period: 0`); the `ext_*` fields are extrapolated by Tech for Palestine.
- Live figures, reported values only (2026-10-15): 74,392 killed and 175,440 injured as of 2026-10-14, the same total
  and date as `summary.json` `gaza.killed.total`. 37 months; the monthly figures sum to 74,392; the highest month is
  October 2023 (8,525); October 2026 so far (to 14 October): 360.
- Phase 11 delivered the view registry (`src/app/views.ts`, one view), hash routing, and a "Views" menu shown only from
  two views. Its menu checks were deferred to this phase.
- The data layer already has `fetchJson()` (no-throw `SourceResult`), the dataset registry
  (`src/data/worker/datasets.ts`) and `useDataset(id)`. The Gaza demographics view uses `KpiCard`, `StateBoundary`,
  `SourceNote`, `ChartFrame` and a lazily loaded chart chunk with Retry (`reloadCharts`, `ChartsErrorBoundary`, both
  inside `features/gaza-demographics/`).
- `HorizontalBarChart.tsx` is currently the only file that imports `recharts` (Phase 8–9 rule).
- Production build on `main` (2026-10-13, after PR #12): initial JS **73.16 kB gzip**, initial CSS 2.25 kB gzip,
  chart chunk 102.54 kB gzip, worker 4.13 kB.

## In scope

### 1. Data: source, normalizer, aggregators

- **Source** `src/data/sources/casualtiesDaily.ts`: the minified endpoint (`…/api/v2/casualties_daily.min.json`,
  494 kB, 38 kB gzip). The payload must be an array of objects, otherwise a `shape` error. Only `report_date`,
  `report_source`, `report_period`, `killed_cum` and `injured_cum` leave the module, as `unknown` values.
- **Normalizer** `src/data/normalize/dailyReport.ts`: each row becomes a `DailyReport`
  `{ date: string; reported: boolean; killedCum: number | null; injuredCum: number | null }`.
  - `reported` is `true` only when `report_source` is a known source (`mohtel`, `gmotel`, `unocha`) and
    `report_period` is a positive integer. `"missing"`, `report_period: 0`, absent or other values → `false`.
  - `killedCum` / `injuredCum`: the value only on a reported day and only if it is a non-negative integer;
    otherwise `null`. Values on days without a report are not used: they were filled in by Tech for Palestine.
  - `ext_*` fields are **never** read (decided 2026-10-15: reported values only).
  - A row without a valid `YYYY-MM-DD` `report_date` cannot be placed in time: it is not a `DailyReport`, and the
    normalizer returns how many such rows there were (`skippedRows`), shown under the table when above 0. Reports are
    sorted by date; for a duplicate date, the later row in the file wins.
- **Aggregators** `src/data/aggregators/timeSeries.ts`, pure:
  - `byMonth(reports)` → one `MonthBucket` per calendar month from the first to the last report, in order:
    `{ month: 'YYYY-MM'; killed: number | null; killedCum: number | null; daysWithoutReport: number; partial: boolean;
spansFrom: string | null }`.
  - `killedCum` = the last reported `killedCum` in the month. `killed` = that value minus the last reported
    cumulative before the month (0 before the first report: the series starts on 7 October 2023). A month with no
    reported cumulative has `killed` and `killedCum` `null`; the next month with one counts from the last known value
    and sets `spansFrom` to the first month it covers. A negative difference (a downward correction) is kept as is.
  - `daysWithoutReport` counts the month's days with `reported: false`, or with no row at all.
  - `partial` is `true` for the last month when the latest report is not on the month's last day.
  - `latestReport(reports)` → `{ date; killedCum; injuredCum }` from the last reported day with a `killedCum`
    (`injuredCum` from the last reported day with one), or `null`.
  - Invariant, enforced by tests: the sum of the non-null monthly `killed` = `latestReport().killedCum`.
- **Worker:** dataset id `gaza-daily-reports` in `datasets.ts`, loader `src/data/worker/gazaDailyReports.ts`; only the
  37 month buckets, the latest report and `skippedRows` cross the thread boundary.

### 2. Shared components: `src/components/`

- **`TimeSeriesChart`** (`TimeSeriesChart.tsx`): props
  `{ title; points: readonly { key; label; value: number | null; partial?: boolean }[]; mode: 'bars' | 'line' }`.
  - `bars`: one vertical column per month; `line`: the cumulative line, no dots, no area fill. One neutral color
    (`--color-chart-bar`); a partial month is drawn as an outlined column and named "(to 14 Oct)" in its tooltip; a
    `null` value draws nothing (no zero bar).
  - X axis: month categories, ticks only on January plus the first month, labelled with the year ("2024"), so the
    labels fit at 320 px. Y axis: at most 4 ticks, `formatCount`. Legends: none (one series).
  - `Tooltip trigger="click"` (tap): month and value. Animations off. Its SVG is named by `title`.
  - The recharts isolation rule becomes: **only `src/components/*Chart.tsx` import `recharts`** (decided 2026-10-15).
- **`ChartFrame`**: `rows` becomes optional; without it the plot has a fixed height, capped relative to the viewport
  (`min(<height token>, 70svh)`). A new optional `details` slot renders between the plot and the source.
  `ChartFrameSkeleton` follows the same rule.
- **Lazy chart chunk with Retry**, extracted from `features/gaza-demographics/` to `src/components/` (decided
  2026-10-15): the retryable `lazy()` import (including the fresh-URL fallback) and the preload on mount become a
  shared helper, and `ChartsErrorBoundary` moves alongside it. The Gaza demographics view uses them with unchanged
  behaviour and markup; its tests keep passing.

### 3. View: `src/features/gaza-daily-reports/`

- `index.ts` exports `view = { id: 'gaza-daily-reports', label: 'Gaza over time', title: 'Gaza over time', … }`; one
  line in `src/app/views.ts` registers it **after** the Gaza demographics view, which stays the default.
- `<section aria-label="Gaza over time">`, mobile first, same structure as the Gaza demographics view: KPI card first,
  then the chart frame, in one column.
- **KPI card:** label "People killed in Gaza since 7 October 2023", value `latestReport.killedCum`; description "From
  Gaza daily reports, last updated 14 October 2026."; aside "175,440 injured". (Owner review: no source note in the card or the chart; the footer cites
  the view's datasets once, "Source: Gaza daily reports, Tech for Palestine".)
  Without an injured total, no aside.
- **Chart frame** (lazy chunk, loaded and retried like the demographics charts):
  - Title "Killed over time"; a two-button toggle "Per month" / "Cumulative" (`aria-pressed`, tap targets ≥ 44 px),
    default "Per month". The toggle changes the chart and its summary only; the table stays the same.
  - Visually hidden summary, from pure functions in `summaries.ts`:
    - per month: "From October 2023 to October 2026 (to 14 October), 74,392 people were reported killed. The highest
      monthly figure was October 2023, with 8,525 people killed."
    - cumulative: "The reported total rose from 8,525 at the end of October 2023 to 74,392 on 14 October 2026."
  - **Table** in `<details>` "Figures by month": Month, Killed, Cumulative, Days without report; one row per month,
    newest last; a partial month reads "October 2026 (to 14 Oct)"; `null` reads "No report"; a `spansFrom` row says
    which months it includes. Below 640 px each row is a stacked list item; from 640 px a regular table
    (tech-stack rule). A note under the table when `skippedRows > 0`.
  - The description line says that days without a report are shown in the table, and the shared limitations caveat
    stays visible in the footer.
- **States:** loading skeleton sized like the final layout (KPI + one fixed-height chart frame); error with Retry;
  empty when there is no reported cumulative at all.
- **Menu:** with two views, the "Views" menu appears in the header ("Gaza demographics", "Gaza over time") with the
  Phase 11 behaviour (focus to `main`, title "Gaza over time · Witness").

## Out of scope

- Injured charts, children/women or other breakdown series, `ext_*` fields, daily granularity, date-range filters.
- West Bank (Phase 14–15). Lazy loading of whole views. CSV download.
- Changes to the Gaza demographics view's content, figures or layout (only the lazy-chunk helper moves).
- VoiceOver testing (keyboard and automated checks only, decided 2026-10-15).

## Decisions

| Decision          | Choice                                                                      | Rationale                                                                    |
| ----------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Merge 12 and 13   | One phase, one PR                                                           | Ships something visible; the data shape is decided with its only consumer.   |
| Figures           | Reported values only; `ext_*` never read                                    | Mission principle 1. Today equal to `ext_*` at every month end.              |
| Granularity       | Months, with a toggle to the cumulative line                                | 1,100+ daily bars are unreadable at 360 px; multi-day reports make spikes.   |
| Monthly figure    | Difference of month-end reported cumulatives                                | Daily `killed` may include retroactive counts; the cumulative reconciles.    |
| Days w/o report   | Counted per month and shown in the table                                    | Mission principle 3, without marking the chart.                              |
| Partial month     | Shown, outlined, "(to 14 Oct)"                                              | The latest deaths are not hidden; the label prevents a false drop.           |
| Injured           | KPI aside only                                                              | One series in the charts, sober and readable on a phone.                     |
| View id and label | `#/gaza-daily-reports`, "Gaza over time"                                    | The id names the source as the KPI cites it; the label says what it shows.   |
| Chart component   | One `TimeSeriesChart` (`bars` / `line`); `*Chart.tsx` may import `recharts` | Two modes share axes and tooltip; the library stays behind component files.  |
| Lazy chunk        | Shared helper extracted from the Gaza demographics view                     | Both views need the same retryable lazy import; no copy.                     |
| Text equivalent   | Short hidden summary + collapsible table                                    | 37 values do not fit a summary; journalists can read the figures.            |
| Tests             | Trimmed real fixture + table-driven cases                                   | Covers the real quirks (missing, period 0, 48 h, absent cumulative, months). |

## Open questions

- None blocking. Summary and table wording can be refined in review, as long as it stays sober and attributed.
