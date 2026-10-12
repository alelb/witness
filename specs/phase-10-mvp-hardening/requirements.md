# Phase 10 — MVP hardening: Requirements

## Goal

Make the Gaza demographics view ready to release as the MVP: an accessibility and dark-mode pass, the tablet and
desktop enhancement the mobile layout has waited for, and a performance check against the budget in
[`tech-stack.md`](../tech-stack.md#performance-budget). The phase ends with the MVP released on GitHub Pages and
tagged `v1.0.0`. 🎯

Stakeholder stories this phase hardens rather than adds: [1.1] total KPI, [1.2] sex breakdown, [1.3] age
distribution, [2.3] performance on mobile and slow connections.

## Context (2026-10-12)

- The view renders one `KpiCard` (reported total as the main figure, the named count and its date in the card
  footer) and, below it, the lazily loaded `DemographicCharts`: two `ChartFrame`s ("Sex", "Age"), stacked in one
  column at every width. `GazaDemographicsView.module.css` only sets a one-column `gap`.
- Dark mode already exists: `tokens.css` redefines the colour tokens under `@media (prefers-color-scheme: dark)`, and
  `index.html` declares `color-scheme: light dark`. Contrast ratios for both palettes are recorded in the `tokens.css`
  header. Nothing has audited the dark theme end to end (hatch pattern, tooltip, focus ring, Retry button).
- Reduced motion: `global.css` cuts animations and transitions under `prefers-reduced-motion: reduce`; the only
  animation is the skeleton pulse. Charts have animations off.
- There are no data tables: the toggleable table was dropped in the Phase 8–9 owner review. The roadmap's "regular
  tables from `640px`" therefore has nothing to apply to (see Out of scope).
- `KpiCard` has a fixed `min-height` (24.5rem base, 22rem from `640px`) so its skeleton swap causes no layout shift; any
  layout change to the card must keep the skeleton the same height.
- In the loading state, `StateBoundary` wraps the skeleton in a `<div aria-busy="true">`; in the success state its
  children (card, charts or chart skeletons, or the chart `LoadError`) are direct children of the view's grid.
- Production build on `main` (2026-10-12): initial JS 230.55 kB (**72.51 kB gzip**), initial CSS 1.91 kB gzip, chart
  chunk 352.14 kB (**102.54 kB gzip**), worker 4.13 kB.
- Lighthouse 12.8.2, mobile defaults, on <https://alelb.github.io/witness/> (2026-10-12, one run): Performance **98**
  (FCP 1.7 s, LCP 1.9 s, TBT 20 ms, CLS 0, SI 2.1 s), Accessibility **100**, Best Practices **96**, SEO **100**. The only
  Best Practices failure is a console error: `/favicon.ico` returns 404 (no favicon).
- `README.md` holds the stakeholder requests and development notes; it does not say what the live site shows.
- No dataset changes: dataset facts stay in [`docs/data-sources.md`](../../docs/data-sources.md).

## In scope

### 1. Audit (on `main`, before any fix)

Record every finding in `validation.md` (audit log), then fix it in this phase or move it to Out of scope with a reason.

- **Contrast**: every token pair in both palettes, including `--color-chart-bar` against the hatch, the tooltip
  (`--color-bg` on `--color-surface`), the focus ring against `--color-bg` and `--color-surface` (WCAG 1.4.11), and the
  Retry button (`--color-bg` on `--color-link`). Update the ratios in the `tokens.css` header.
- **Keyboard**: skip link, tab order, visible focus on every interactive element (skip link, links, Retry, chart
  focus via Recharts' accessibility layer), no keyboard trap, tooltip reachable without a pointer.
- **Screen reader** (VoiceOver on macOS Safari and iOS Safari): landmarks (`header`, `main`, `footer`, the view's
  `section`), the page heading, the KPI figure announced with its label, each chart announced with its title then its
  summary, the loading text, and the error message with Retry. Check whether the KPI and chart titles should be
  headings for rotor navigation, and decide in review.
- **Dark mode**: the whole view in the dark theme, including skeletons, the hatched Unknown bar, the tooltip, the
  error state, and the footer.
- **Reduced motion and zoom**: skeleton pulse stops under `prefers-reduced-motion`; 200% zoom and a raised default
  font size reflow without clipping (WCAG 1.4.4, 1.4.10).
- **Tap targets**: every interactive element at least 44×44 px (tech-stack), or an inline-link exemption written down.

### 2. Dark mode

- Keep following the system setting through `prefers-color-scheme`. **No manual toggle and no stored preference**
  (decided 2026-10-12): nothing to persist, no new control.
- Fix any token that fails the audit, in both palettes, and keep `color-scheme` in sync.

### 3. Tablet and desktop enhancement

All new rules are `min-width` media queries on the existing breakpoints (`640px`, `1024px`); the base (phone) layout
does not change.

- **KPI card**: one column at every width: the main figure (reported total, its label and description), then the
  named figure, then the source note (owner review, 2026-10-12: the two-column KPI row from `640px` was dropped). The
  card stays one card with one source note: the named figure stays secondary and is never merged with the reported
  total (Phase 4–7). The card and its skeleton keep the same height at every width (no layout shift).
- **Desktop grid (`≥ 1024px`)**: the KPI card stays full width on top; the Sex and Age charts sit side by side below
  it (charts two per row, tech-stack). The charts get their own wrapper grid, so the KPI card, the loading wrapper,
  and the empty and error messages stay full width without per-item rules; the chart `LoadError` spans the whole
  chart row. The chart skeletons use the same wrapper, so the loading layout matches the loaded one.
- **Equal-height frames**: the two chart frames in a row share its height; each plot keeps its own height (rows ×
  row height, capped at `70svh`), and the source note sits at the bottom of each frame so the two sources line up.
- Content stays capped at `--content-max-width` (1200px).

### 4. Performance

- Check against the tech-stack budget: initial JS ≤ ~200 kB gzip, main thread never blocked > 50 ms by data work,
  Lighthouse mobile performance ≥ 90. Record the numbers by hand in `validation.md`; **no CI size check** (decided
  2026-10-12).
- Release gate on the Pages URL, Lighthouse mobile, median of 3 runs: **Performance ≥ 90, Accessibility 100,
  Best Practices 100, SEO 100**.
- Real-phone check: an Android phone driven through Chrome remote DevTools, network throttled to "Slow 4G"; record
  the model, the time to the KPI figure, the time to both charts, and any jank.

### 5. Release

- **Favicon**: `public/favicon.svg`, a letter "W" in the text colour on a neutral tile in the surface colour, with an
  embedded `prefers-color-scheme: dark` style so it follows the theme. Linked from `index.html` with a relative path
  that works under the Pages sub-path (`/witness/`), so `/favicon.ico` is no longer requested.
- **README**: a short "What Witness shows" section near the top: the MVP view (total killed reported by Gaza daily
  reports, people identified by name, sex and age charts), the live URL, the data source, and the undercount caveat.
  Stakeholder requests and development notes stay as they are.
- **Tag and release**: after the merge and a green deploy, an annotated tag `v1.0.0` on the merge commit and a GitHub
  release whose notes summarise the MVP from `CHANGELOG.md`. Created only when the owner asks.

## Out of scope

- A manual theme toggle or any stored preference.
- Data tables (none exist since the Phase 8–9 review), so the roadmap's "regular tables from `640px`" does not apply.
- Automated accessibility tests (axe) and a CI bundle-size check (decided 2026-10-12: Lighthouse and manual checks).
- TalkBack and Windows screen readers.
- Social-share meta tags (Open Graph, Twitter cards).
- Routing or a view registry (Phase 11), new datasets, changes to the worker, aggregators, or summaries' wording
  unless the audit finds an accessibility defect in them.
- A third chart, a legend, or a change to chart colours beyond audit fixes.

## Decisions

| Decision          | Choice                                                                   | Rationale                                                                     |
| ----------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Dark mode         | Audit the existing `prefers-color-scheme` theme; no toggle               | Already implemented; a toggle adds state and storage for little gain.         |
| KPI card          | One column at every width (two-column row dropped in owner review)       | Keeps the main/secondary hierarchy and one source note from Phase 4–7.        |
| Desktop grid      | Charts wrapper, two columns from `1024px`; KPI full width above          | Tech-stack breakpoint table.                                                  |
| Frame alignment   | Equal-height frames, sources aligned at the bottom                       | Borders and sources line up in a row; plots keep their own height.            |
| Order of work     | Audit on `main` → fixes → layout → release                               | Findings are recorded against the shipped site before anything changes.       |
| Accessibility QA  | Lighthouse + keyboard + VoiceOver (macOS, iOS); no axe dependency        | No new dependency; the manual checks cover what axe cannot.                   |
| Performance gate  | Recorded by hand; Lighthouse mobile median of 3: 90 / 100 / 100 / 100    | As in earlier phases; today 98 / 100 / 96 / 100.                              |
| Real phone        | Android + Chrome remote DevTools, Slow 4G                                | Repeatable throttling on a real CPU.                                          |
| Release artefacts | SVG favicon, README section, `v1.0.0` tag and GitHub release after merge | Fixes the 404, tells visitors what the site is, marks the MVP in git history. |

## Open questions

- Whether the KPI label and chart titles become headings (`h2`) inside their `figcaption`s: decided in review after
  the VoiceOver audit.
