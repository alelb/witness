# Changelog

All notable changes to Witness, grouped by date (newest first).

## 2026-10-16

- Name the data source once per page, in the footer, with the current view's datasets, instead of on every card and
  chart; lower the KPI card's reserved height to match (owner review).

## 2026-10-15

- Add the Phase 12–13 Gaza daily casualties spec (requirements, plan, validation).
- Add the Gaza daily casualties source, normalizer and monthly aggregators: reported values only (the `ext_*` fields
  are never read); days without a report are counted per month; the monthly figures sum to the latest reported total.
- Add the "Gaza over time" view: the latest reported killed total with the injured total beside it, people reported
  killed per month with a toggle to the cumulative total, and a collapsible table of the figures by month.
- Show the "Views" menu, now that two views are registered.
- Share the lazy chart chunk with Retry between views, and let `ChartFrame` take a fixed-height plot, controls and a
  details slot. Only `src/components/*Chart.tsx` files import Recharts.

## 2026-10-13

- Name the view's URL `#/killed-in-gaza`, after the dataset it shows (owner review).
- Complete Phase 11 — View registry / navigation: hash routing is live at <https://alelb.github.io/witness/>.

## 2026-10-12

- Rename the project from Shaded to Witness: the site moves from `/shaded/` to <https://alelb.github.io/witness/>.
- Add the Phase 10 MVP hardening spec (requirements, plan, validation).
- Audit accessibility and dark mode on the shipped site: every token pair passes in both palettes, keyboard and tap
  targets pass; findings and fixes are logged in the Phase 10 validation.
- Make the KPI label and the chart titles `h2` headings, for heading navigation.
- Show the named figure beside the reported total from 640 px, inside the same card, with a matching skeleton.
- Show the Sex and Age charts side by side from 1024 px, in equal-height frames with their sources aligned.
- Match the chart skeletons to the frames' line heights, so loading causes no layout shift.
- Fix chart Retry after a failed chunk load: the chunk is re-imported under a fresh URL, and the chart CSS is part of
  the main stylesheet.
- Add an SVG favicon that follows the light and dark theme, fixing the `/favicon.ico` 404.
- Add a "What Witness shows" section to the README.
- Complete Phase 10 — MVP hardening: the tablet and desktop layout is live at <https://alelb.github.io/witness/>.
- Keep the KPI card in one column at every width: the named figure stays below the reported total (owner review).
- Add the Phase 11 View registry / navigation spec (requirements, plan, validation).
- Add the view registry: each feature exports a `view`, and registering one is a single line in `app/views.ts`.
- Add hash routes `#/<view-id>`: unknown ids fall back to the default view and are cleared from the URL, other
  fragments are ignored, and back and forward work; the tab title reads "<view> · Witness".
- Add a "Views" menu shown from two views, with focus moving to the content on a view change; the skip link no longer
  changes the URL.

## 2026-10-09

- Revise the Phase 3 spec: a minimal defensive person normalizer instead of per-dataset modules or a generic engine.
- Add the person normalizer (`normalize/person.ts`): raw `{ age, sex }` rows become typed records; missing or
  unparseable values become Unknown, `0` is kept as a real age, and no row is dropped.
- Add table-driven tests for the age and sex rules, fixture-to-records and messy-row tests, and a 75,000-row
  performance check.
- Confirm the normalizer on live Killed in Gaza data: 72,835 records (50,959 male, 21,876 female, 1,072 aged 0), no
  Unknown values.
- Complete Phase 3 — Normalizer.
- Add the Phase 4–7 First live view spec (requirements, plan, validation).
- Add demographic aggregators (`bySex`, `byAgeBracket`, `summarizeDemographics`) with ordered buckets and an Unknown
  bucket always present; tests prove every breakdown sums to the total.
- Add the `summary.json` source module: the named-list update date and record count, and the total killed reported by
  Gaza daily reports; invalid values become `null`.
- Add the dataset Web Worker and `useDataset()`: fetch, normalize, and aggregate off the main thread; only aggregates
  cross the thread boundary; retry and StrictMode safe.
- Add shared UI states and components: `StateBoundary` (loading, error with Retry, empty), `KpiCard` with a
  same-height skeleton, and `SourceNote`.
- Add the Gaza demographics view: 74,250 people killed in Gaza since 7 October 2023 (Gaza daily reports) as the main
  figure, 72,835 identified by name below it, one "last updated" date for each figure.
- Reword the header intro: "Open data bearing witness to Palestinians killed by Israel in Gaza and the West Bank."
- Remove the footer "Source code" link and the max-width on the intro and the limitations note.
- Complete Phase 4–7 — First live view: the KPI card is live at <https://alelb.github.io/witness/>.
- Add the Phase 8–9 Demographic charts spec (requirements, plan, validation).
- Add Recharts, isolated in a `HorizontalBarChart` component: counts written on every bar, a tap/click tooltip with
  count and share, the Unknown bucket hatched, wrapped category labels, and no animation.
- Add `ChartFrame`: a figure named by its title and described by a visually hidden text summary, with a plot height
  that follows the number of bars and a same-height skeleton.
- Add `formatShare` (one decimal, `<0.1%` for tiny non-zero shares) and plain-language sex and age summaries that
  lead with children (0–17) and always state the Unknown count.
- Add the "Sex" and "Age" charts below the KPI card: lazy-loaded and preloaded on mount, an empty Unknown bucket is
  not drawn, and a failed chart download shows Retry while the KPI stays visible.
- Add a chart bar color token with at least 3:1 contrast in light and dark mode.
- Complete Phase 8–9 — Demographic charts: the sex and age charts are live at <https://alelb.github.io/witness/>.

## 2026-10-08

- Add the Phase 3 Normalizer spec (requirements, plan, validation).

## 2026-10-07

- Add project documentation: README with stakeholder requests and data sources, mission, roadmap, and tech stack.
- Add the Phase 0 scaffold spec (requirements, plan, validation).
- Scaffold the Vite + React + TypeScript (strict) project with pnpm, Node 24, ESLint, Prettier, Vitest, and React
  Testing Library; TypeScript pinned to 6.0.x until typescript-eslint supports TypeScript 7.
- Add the folder layout from the tech stack with typed stub modules and sample unit and component tests.
- Add a Development section to the README.
- Complete Phase 0 — Scaffold.
- Define responsive design rules: phone, tablet (`640px`), and desktop (`1024px`) layouts, a `1200px` max content
  width, landscape and 200% text zoom support, and a responsive test matrix used by Phase 1 and Phase 10.
- Add a `/changelog` skill to keep this changelog up to date before merging.
- Add the Phase 1 CI & deploy skeleton spec (requirements, plan, validation).
- Add GitHub Actions CI (format check, lint, typecheck, test, build) on pull requests and branch pushes.
- Add GitHub Pages deploy from `main`, reusing the CI checks; the site is served under `/witness/`.
- Add the mobile-first app shell: light and dark design tokens, breakpoints, a skip link and page landmarks, an
  intro line, and a footer with Tech for Palestine attribution and the limitations note.
- Add tests for the app shell and footer, and a CI badge, live URL, and deploy note to the README.
- Complete Phase 1 — CI & deploy skeleton: the shell is live at <https://alelb.github.io/witness/>.
- Add the Phase 2 Killed in Gaza source module spec (requirements, plan, validation).
- Add a shared `fetchJson` helper for source modules: a 60 s total timeout, cancellation through the caller's
  `AbortSignal`, and plain, serializable errors (`network`, `timeout`, `aborted`, `http`, `parse`) instead of
  exceptions.
- Add the Killed in Gaza source: v3 payload types, a shape guard, and `fetchKilledInGaza`, which returns only `age`
  and `sex` per record (looked up by header name) and keeps rows with missing values.
- Add a synthetic Killed in Gaza fixture and unit tests for the fetch helper and the source module.
- Confirm the live Killed in Gaza endpoint loads from the GitHub Pages origin with CORS open.
- Complete Phase 2 — Source module: Killed in Gaza.
