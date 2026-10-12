# Phase 10 — MVP hardening: Plan

Branch: `phase-10-mvp-hardening`

## 1. Audit on `main`

Run every audit against the shipped site (Pages URL, or `pnpm build && pnpm preview` on `main`) before changing any
code. Write each finding as a row in the audit log in `validation.md` (area, finding, WCAG criterion, fix or reason
it is out of scope).

1.1 Contrast: compute the ratio of every text and non-text token pair in both palettes of `src/app/tokens.css`
(text, muted, link on `--color-bg` and `--color-surface`; `--color-chart-bar` and the hatch on `--color-surface`; the
tooltip text on `--color-bg`; `--color-focus` on both backgrounds; `--color-bg` on `--color-link` for Retry). Use a
small scratchpad script (not committed).
1.2 Keyboard: tab through the success, loading, chart-error (block the `DemographicCharts` chunk in DevTools) and
dataset-error states, in light and dark mode. Check the skip link, focus visibility, focus order, Recharts arrow-key
navigation, and the tooltip without a pointer.
1.3 VoiceOver on macOS Safari and iOS Safari: landmarks, heading list, KPI figure, both chart summaries, loading text,
error and Retry. Note whether the KPI label and chart titles should be headings.
1.4 Dark mode visual pass of every state, including skeletons, the hatched Unknown bar (force one with a local data
override in dev only), the tooltip, the footer.
1.5 Reduced motion (DevTools "Emulate CSS prefers-reduced-motion"), 200% zoom, and a 24 px default font size at
320 px and 360 px.
1.6 Measure every interactive element's box in DevTools; list anything under 44×44 px.
1.7 Lighthouse mobile ×3 on the Pages URL; record the median of each category.

## 2. Accessibility and dark-mode fixes

2.1 Fix each audit finding in the smallest place: tokens in `tokens.css` (both palettes), styles in the component's
CSS Module, markup in the component. Update the contrast ratios in the `tokens.css` header comment.
2.2 If the review decides the KPI label and chart titles become headings, wrap the `figcaption` text in an `h2` in
`KpiCard.tsx` and `ChartFrame.tsx` without changing their visual style, and keep the figures named by them
(`aria-labelledby`).
2.3 Add a test for each markup fix (for example, a heading role or an accessible name) next to the component's
existing tests.

## 3. Tablet and desktop layout

3.1 `KpiCard`: add an optional `aside?: ReactNode` prop for the secondary figure. In `KpiCard.module.css`, base
layout unchanged (`aside` below the description, above the footer); `@media (min-width: 640px)`, when `aside` is set,
a two-column grid: label, value and description in the first column, `aside` in the second, footer spanning both.
Re-measure the card at 640 px and 1024 px and set the `min-height` so the skeleton still matches; give
`KpiCardSkeleton` an `aside` variant (`withAside` prop) with the same columns.
3.2 `GazaDemographicsView.tsx`: move the named figure (`styles.named`) from the card `footer` into `aside`; the footer
keeps only the `SourceNote`. The no-summary card (named count as the main figure) passes no `aside`. Use the
`withAside` skeleton when loading.
3.3 Wrap the chart area in a `<div className={styles.charts}>` that contains the `ChartsErrorBoundary` (and therefore
the `Suspense` fallback, the charts, and the chart `LoadError`); use the same wrapper around `<ChartSkeletons />` in
the loading skeleton.
3.4 `GazaDemographicsView.module.css`: `.charts` is a one-column grid with the view's `gap`;
`@media (min-width: 1024px)` it becomes `grid-template-columns: repeat(2, minmax(0, 1fr))`, and a single child (the
chart `LoadError`) spans both columns (`.charts > :only-child { grid-column: 1 / -1; }`).
3.5 `ChartFrame.module.css`: make the frame fill its grid cell and push the source to the bottom (for example
`grid-template-rows` with a flexible row before `.source`, or `margin-top: auto` on a flex column); the plot keeps its
`--rows`-based height. Apply the same to the skeleton so its height still matches.
3.6 Check that the `1200px` cap and gutters are unchanged; no `max-width` media queries anywhere (`grep`).

## 4. Release assets

4.1 Create `public/favicon.svg`: a 64×64 `viewBox`, a rounded tile filled with the light `--color-surface` value and a
"W" in the light `--color-text` value, with a `<style>` holding `@media (prefers-color-scheme: dark)` that swaps in
the dark values. No external fonts: use a `<path>` or `system-ui` text.
4.2 In `index.html`, add `<link rel="icon" href="./favicon.svg" type="image/svg+xml" />` (resolved by Vite under the
`/witness/` base). Check in `dist/index.html` that the link points to `/witness/favicon.svg` and that the file is in
`dist/`.
4.3 In `README.md`, add a "What Witness shows" section after the live link: the MVP view in three or four bullets, the
data source, and the undercount caveat (wording from `SiteFooter`).

## 5. Tests

5.1 `src/components/KpiCard.test.tsx`: `aside` renders inside the figure, after the value; without `aside` the
markup is unchanged; `KpiCardSkeleton withAside` shares the card's container class.
5.2 `src/components/ChartFrame.test.tsx`: the source note is still the last child of the frame (layout change must
not reorder the DOM).
5.3 `src/features/gaza-demographics/GazaDemographicsView.test.tsx`: with the summary, the named figure is in the
card and the footer holds only the source; without the summary there is no aside; both charts render inside the
charts wrapper; the chart `LoadError` renders inside the wrapper; loading renders the KPI skeleton plus the two chart
skeletons inside the wrapper.
5.4 Update `src/app/App.test.tsx` only if the new markup breaks its assertions.

## 6. Performance and manual checks

6.1 `pnpm build`: record initial JS, initial CSS, chart chunk and worker sizes (gzip) in `validation.md`; confirm
`recharts` is only in the chart chunk.
6.2 `pnpm preview`, Chrome DevTools Performance with 4× CPU and "Fast 4G": record long tasks during load and CLS.
6.3 Run the responsive matrix, the keyboard pass, and the VoiceOver passes from `validation.md` on `pnpm preview`,
then again on the Pages URL after the deploy.
6.4 After the deploy: Lighthouse mobile ×3 on the Pages URL; the real Android phone over Slow 4G via remote
DevTools.

## 7. Docs, roadmap and release

7.1 Run every check in `validation.md` and fix any failure.
7.2 Update `CHANGELOG.md` after committing.
7.3 Open a PR, confirm `ci` is green, and wait for the owner's review before merging.
7.4 After the merge and a successful deploy, mark Phase 10 ✅ in `specs/roadmap.md`.
7.5 When the owner asks: `git tag -a v1.0.0 -m "Witness MVP"` on the merge commit, push the tag, and create the GitHub
release with `gh release create v1.0.0` and notes summarised from `CHANGELOG.md`.
