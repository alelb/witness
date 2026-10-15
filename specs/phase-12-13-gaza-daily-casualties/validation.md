# Phase 12–13 — Gaza daily casualties: Validation

The branch can be merged when every item below holds on `phase-12-13-gaza-daily-casualties`.

## Automated checks

Run locally and in CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [ ] All checks pass locally, and the `ci` workflow is green on the PR.

### Data

- [ ] Source: a non-array payload or a non-object row is a `shape` error; no `ext_*` field leaves the module.
- [ ] Normalizer: `reported` is `true` only for a known source with a positive `report_period`; `"missing"` and
      period 0 are `false`.
- [ ] Normalizer: counts are kept only on reported days and only as non-negative integers; anything else is `null`.
- [ ] Normalizer: rows with an invalid date are counted in `skippedRows`; reports are sorted; the later duplicate wins.
- [ ] `byMonth`: month-end cumulative from the last reported day; the first month counts from 0; a month with no
      reported cumulative is `null` and the next one sets `spansFrom`; `daysWithoutReport` and `partial` are right.
- [ ] Invariant: the sum of the monthly `killed` equals `latestReport().killedCum`, on the fixture and on generated
      series.
- [ ] The worker loader returns only `{ months, latest, skippedRows }`.

### Components and view

- [ ] `TimeSeriesChart` renders in `bars` and `line` mode with its SVG named by the title; `null` points draw no bar.
- [ ] `ChartFrame` without `rows` has the fixed plot height; the `details` slot renders; the skeleton matches.
- [ ] Gaza over time: loading skeleton, error with Retry, empty state, KPI total and date, injured aside present and
      absent, chart chunk failure with Retry.
- [ ] The toggle switches between "Per month" and "Cumulative", `aria-pressed` follows, and the summary follows the
      mode; the table has one row per month with "No report" and the partial-month label.
- [ ] With the real registry: the "Views" menu shows "Gaza demographics" and "Gaza over time"; the default view is
      still Gaza demographics.
- [ ] Existing Gaza demographics, App, router and component tests still pass after the lazy-chunk extraction.

## Structural checks (review)

- [ ] Registering the view is a feature folder plus one line in `src/app/views.ts`; the router, menu and layout are
      unchanged.
- [ ] Only `src/components/*Chart.tsx` import `recharts`; `recharts` is not in the initial chunk.
- [ ] No `ext_*` field is read anywhere in `src/`.
- [ ] No new runtime or dev dependency. CSS uses tokens and `min-width` queries only.
- [ ] Gaza demographics view: only the lazy-chunk helper moved; markup, figures and styles unchanged.

## Bundle check

Baseline on `main` (2026-10-13, after PR #12): initial JS 73.16 kB gzip, initial CSS 2.25 kB gzip, chart chunk
102.54 kB gzip, worker 4.13 kB.

- [ ] Initial JS within ~5 kB gzip of the baseline, and ≤ ~200 kB gzip (tech-stack budget).
- [ ] Chart code stays in lazy chunks; sizes recorded below.

| Date | Initial JS (gzip) | Initial CSS (gzip) | Chart chunk(s) (gzip) | Worker | Notes |
| ---- | ----------------- | ------------------ | --------------------- | ------ | ----- |
|      |                   |                    |                       |        |       |

## Live cross-checks

On the live data, dated, recorded here:

- [ ] The KPI killed total and its date equal `summary.json` `gaza.killed.total` and `gaza.last_update`.
- [ ] The sum of the monthly bars equals the KPI total.
- [ ] The table rows equal the chart values (spot-check the first, the highest, and the last month).
- [ ] The injured aside equals the last reported `injured_cum`.

## Manual checks

On `pnpm preview`, then on <https://alelb.github.io/witness/> after the deploy. Light and dark, at 320 px, 360 px,
640×360 landscape, 768 px, 1024 px, 1440 px, and 360 px at 200% zoom.

- [ ] No horizontal page scroll at any width; the chart, toggle and table are readable at 320 px.
- [ ] Monthly columns and year ticks fit at 320 px; the partial month is outlined; the cumulative line reaches the
      latest report.
- [ ] Tapping a column or the line shows the month and value; nothing depends on hover.
- [ ] The table is a stacked list below 640 px and a regular table from 640 px; at 200% zoom nothing is clipped.
- [ ] The whole chart fits on screen at 640×360.
- [ ] The "Views" menu wraps at 320 px, its links are at least 44×44 px, and the current one is marked by weight and
      underline in both palettes.
- [ ] Menu link, typed hash, Back and Forward switch views; focus moves to `main`; the title reads
      "Gaza over time · Witness" / "Gaza demographics · Witness".
- [ ] `#/gaza-daily-reports` survives a reload; `#/unknown` falls back to Gaza demographics and becomes `…/witness/`.
- [ ] The Gaza demographics view looks the same as on `main`, apart from the menu.
- [ ] Keyboard: Tab reaches the menu, the toggle, the chart and the table's `details`; Enter/Space work; focus is
      always visible.
- [ ] No console errors.
- [ ] Lighthouse mobile performance ≥ 90 on `#/killed-in-gaza` and `#/gaza-daily-reports` (scores recorded here).

## Done when (roadmap)

- [ ] The view is live on the Pages URL, readable at 360 px with no horizontal scroll, and its figures match the
      aggregator output.

## Not required for this phase

- VoiceOver testing, injured charts, `ext_*` series, daily granularity, West Bank.
