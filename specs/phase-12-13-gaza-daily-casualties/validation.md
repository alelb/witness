# Phase 12–13 — Gaza daily casualties: Validation

The branch can be merged when every item below holds on `phase-12-13-gaza-daily-casualties`.

## Automated checks

Run locally and in CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

2026-10-15: all checks pass locally (29 test files, 352 tests) and `ci` is green on PR #13.

- [x] All checks pass locally, and the `ci` workflow is green on the PR.

### Data

- [x] Source: a non-array payload or a non-object row is a `shape` error; no `ext_*` field leaves the module.
- [x] Normalizer: `reported` is `true` only for a known source with a positive `report_period`; `"missing"` and
      period 0 are `false`.
- [x] Normalizer: counts are kept only on reported days and only as non-negative integers; anything else is `null`.
- [x] Normalizer: rows with an invalid date are counted in `skippedRows`; reports are sorted; the later duplicate wins.
- [x] `byMonth`: month-end cumulative from the last reported day; the first month counts from 0; a month with no
      reported cumulative is `null` and the next one sets `spansFrom`; `partial` is right.
- [x] Invariant: the sum of the monthly `killed` equals `latestReport().killedCum`, on the fixture and on generated
      series.
- [x] The worker loader returns only `{ months, latest, skippedRows }`.

### Components and view

- [x] `TimeSeriesChart` renders in `bars` and `line` mode with its SVG named by the title; `null` points draw no bar.
- [x] `ChartFrame` without `rows` has the fixed plot height; the `details` slot renders; the skeleton matches.
- [x] Gaza over time: loading skeleton, error with Retry, empty state, KPI total and date, injured aside present and
      absent, chart chunk failure with Retry.
- [x] The toggle switches between "Per month" and "Cumulative", `aria-pressed` follows, and the summary follows the
      mode; the table has one row per month with "No report" and the partial-month label.
- [x] With the real registry: the "Views" menu shows "Gaza demographics" and "Gaza over time"; the default view is
      still Gaza demographics.
- [x] Existing Gaza demographics, App, router and component tests still pass after the lazy-chunk extraction.

## Structural checks (review)

- [x] Registering the view is a feature folder plus one line in `src/app/views.ts`; the router, menu and layout are
      unchanged.
- [x] Only `src/components/*Chart.tsx` import `recharts`; `recharts` is not in the initial chunk.
- [x] No `ext_*` field is read anywhere in `src/`.
- [x] No new runtime or dev dependency. CSS uses tokens and `min-width` queries only.
- [x] Gaza demographics view: only the lazy-chunk helper moved; markup, figures and styles unchanged.

## Bundle check

Baseline on `main` (2026-10-13, after PR #12): initial JS 73.16 kB gzip, initial CSS 2.25 kB gzip, chart chunk
102.54 kB gzip, worker 4.13 kB.

- [x] Initial JS within ~5 kB gzip of the baseline, and ≤ ~200 kB gzip (tech-stack budget).
- [x] Chart code stays in lazy chunks; sizes recorded below.

| Date       | Initial JS (gzip) | Initial CSS (gzip) | Chart chunk(s) (gzip)                                         | Worker  | Notes                                                                        |
| ---------- | ----------------- | ------------------ | ------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| 2026-10-15 | 73.73 kB          | 2.79 kB            | 101.87 kB shared, 1.71 kB demographics, 9.29 kB daily reports | 6.82 kB | +0.57 kB JS (view, helper), +0.54 kB CSS; `LineChart` only in its own chunk. |

## Live cross-checks

On the live data, dated, recorded here:

2026-10-15, on `pnpm preview`: KPI 74,392, last updated 14 October 2026, equal to `summary.json`
`gaza.killed.total` (74,392) and `gaza.last_update` (2026-10-14). The 37 monthly figures sum to 74,392 (pipeline run
on the full download). Table and tooltips: October 2023 8,525 (first and highest), March 2024 2,747, October 2026 (to
14 Oct) 360 with cumulative 74,392. Injured aside 175,440, the last `injured_cum`. 125 days without a report, in 28
months.

- [x] The KPI killed total and its date equal `summary.json` `gaza.killed.total` and `gaza.last_update`.
- [x] The sum of the monthly bars equals the KPI total.
- [x] The table rows equal the chart values (spot-check the first, the highest, and the last month).
- [x] The injured aside equals the last reported `injured_cum`.

## Manual checks

On `pnpm preview`, then on <https://alelb.github.io/witness/> after the deploy. Light and dark, at 320 px, 360 px,
640×360 landscape, 768 px, 1024 px, 1440 px, and 360 px at 200% zoom.

2026-10-15, on `pnpm preview` (headless Chromium, light and dark at every width of the matrix): no horizontal scroll;
37 columns; year ticks 2024–2026 below 1024 px and 2023–2026 from 1024 px (the first label is left out where it would
overlap 2024; at 200% zoom only 2024 is labelled); at most 4 Y ticks (0–9,000 per month, 0–75,000 cumulative); plot
288 px, 252 px (70svh) at 640×360; the partial October 2026 column outlined. Tapping a column shows "March 2024 /
2,747"; tapping the line's end shows "October 2026 (to 14 Oct) / 74,392". Table: stacked list at 360 px, regular
table at 768 px; at 200% zoom figures no longer break inside a number and the toggle buttons stack (fixed during the
check). Menu links 44 px high; a menu click moves focus to `main` and sets the title; Back, Forward and reload keep the
right view; `#/unknown` becomes `…/witness/`. Tab order: skip link, menu, KPI source, toggle, chart, table summary,
chart source, footer. No console errors. Lighthouse and the Pages URL: pending the deploy.

2026-10-16, branch build against a `main` build on `pnpm preview`: Gaza demographics compared at 375 px and 1280 px in
light and dark has the same text inside `main`, and the same position, size, color and font size for all 20 headings,
paragraphs, figures, charts, buttons and tables. Menu: at 320 px both links fit on one row (154/145 × 44 px and
108/115 × 44 px); at 180 px (about 360 px at 200% zoom) they wrap to two rows with no horizontal scroll. The current
link has `aria-current="page"`, weight 700, an underline and body text color; the other has weight 400, no underline
and link color. This holds on both routes in light and dark.

- [x] No horizontal page scroll at any width; the chart, toggle and table are readable at 320 px.
- [x] Monthly columns and year ticks fit at 320 px; the partial month is outlined; the cumulative line reaches the
      latest report.
- [x] Tapping a column or the line shows the month and value; nothing depends on hover.
- [x] The table is a stacked list below 640 px and a regular table from 640 px; at 200% zoom nothing is clipped.
- [x] The whole chart fits on screen at 640×360.
- [x] The "Views" menu wraps at 320 px, its links are at least 44×44 px, and the current one is marked by weight and
      underline in both palettes.
- [x] Menu link, typed hash, Back and Forward switch views; focus moves to `main`; the title reads
      "Gaza over time · Witness" / "Gaza demographics · Witness".
- [x] `#/gaza-daily-reports` survives a reload; `#/unknown` falls back to Gaza demographics and becomes `…/witness/`.
- [x] The Gaza demographics view looks the same as on `main`, apart from the menu.
- [x] Keyboard: Tab reaches the menu, the toggle, the chart and the table's `details`; Enter/Space work; focus is
      always visible.
- [x] No console errors.
- [ ] Lighthouse mobile performance ≥ 90 on `#/killed-in-gaza` and `#/gaza-daily-reports` (scores recorded here).

### Owner review (2026-10-16)

The Tech for Palestine source was repeated on every KPI card and chart and in the footer. Now each view names its
datasets in `ViewDefinition.datasets`, and the footer is the page's one source line: "Source: Gaza daily reports and
Killed in Gaza, Tech for Palestine" or "Source: Gaza daily reports, Tech for Palestine". `SourceNote` and the source
slots of `KpiCard` and `ChartFrame` are removed. Without the source line, the KPI card `min-height` drops from
24.5rem/22rem to 19.5rem/18.5rem: the tallest card measures 19.25rem at 320 px and 18.31rem from 640 px. On
`pnpm preview` at 320, 360, 639, 640, 1024 and 1440 px on both routes, layout shift is 0, there is no horizontal
scroll, and "Tech for Palestine" appears once per page. The Gaza demographics view now differs from `main` by design:
no source lines in the card and charts, and a shorter card.

- [x] The source is named once per page, in the footer, with the current view's datasets.
- [x] The KPI card swap causes no layout shift at any width with the lower `min-height`.

The per-month count of days without a report was dropped from the UI and from `MonthBucket` (owner review: it added
little for readers, and 28 of 37 months have some). Days without a report are still never filled in: their counts are
ignored, a month with no reported cumulative reads "No report", and the next one says which months it covers. On
`pnpm preview` at 320, 360 and 768 px: the table has Month, Killed and Cumulative, the description reads "Gaza daily
reports, last updated 14 October 2026.", no horizontal scroll, no console errors.

## Done when (roadmap)

- [ ] The view is live on the Pages URL, readable at 360 px with no horizontal scroll, and its figures match the
      aggregator output.

## Not required for this phase

- VoiceOver testing, injured charts, `ext_*` series, daily granularity, West Bank.
