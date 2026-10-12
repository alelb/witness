# Phase 10 — MVP hardening: Validation

The branch can be merged when every item below holds on `phase-10-mvp-hardening`.

## Automated checks

Run locally and in CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [ ] All checks pass locally, and the `ci` workflow is green on the PR.

### Components

- [ ] `KpiCard`: `aside` renders inside the figure after the value; without `aside` the markup is unchanged.
- [ ] `KpiCardSkeleton withAside` shares the card's container class.
- [ ] `ChartFrame`: the source note is still the last child of the frame.
- [ ] Every markup fix from the audit has a test (for example a heading role or an accessible name).

### View

- [ ] With the summary, the named figure is in the card's aside and the footer holds only the source.
- [ ] Without the summary, the card has no aside.
- [ ] Both charts, the chart skeletons (loading), and the chart `LoadError` render inside the charts wrapper.
- [ ] Existing view tests still pass: loading, error with Retry, empty, no charts when the named total is 0.

## Structural checks (review)

- [ ] New layout rules are `min-width` queries on `640px` and `1024px` only; `grep -rn "max-width:" src --include=*.css`
      finds no media query.
- [ ] The base (phone) layout is unchanged: the 360 px screenshots before and after match, apart from audit fixes.
- [ ] No theme toggle, no `localStorage`, no new runtime or dev dependency.
- [ ] `tokens.css` header lists the contrast ratios of both palettes after the fixes.
- [ ] `dist/index.html` links `/witness/favicon.svg`, and the file is in `dist/`.
- [ ] `README.md` has the "What Witness shows" section.

## Audit log

Filled in during plan group 1 (on `main`) and closed during group 2. Every row ends as fixed or out of scope with a
reason.

| Area | Finding | WCAG | Light / dark | Resolution |
| ---- | ------- | ---- | ------------ | ---------- |
|      |         |      |              |            |

## Contrast (after fixes)

At least 4.5:1 for text, 3:1 for non-text (bars, hatch, focus ring), in both palettes.

| Pair                                   | Light | Dark | Pass |
| -------------------------------------- | ----- | ---- | ---- |
| text / bg, surface                     |       |      | [ ]  |
| muted / bg, surface                    |       |      | [ ]  |
| link / bg, surface                     |       |      | [ ]  |
| chart-bar, hatch / surface             |       |      | [ ]  |
| tooltip text / tooltip bg              |       |      | [ ]  |
| focus ring / bg, surface               |       |      | [ ]  |
| Retry label (bg) / Retry button (link) |       |      | [ ]  |

## Bundle check

From `pnpm build` output. Baseline on `main` (2026-10-12): initial JS 72.51 kB gzip, initial CSS 1.91 kB gzip,
chart chunk 102.54 kB gzip, worker 4.13 kB.

- [ ] Initial JS ≤ ~200 kB gzip (tech-stack budget), and within ~5 kB of the baseline.
- [ ] `recharts` is only in the lazy chart chunk.

| Date | Initial JS (gzip) | Initial CSS (gzip) | Chart chunk (gzip) | Worker | Notes |
| ---- | ----------------- | ------------------ | ------------------ | ------ | ----- |
|      |                   |                    |                    |        |       |

## Main-thread and layout-shift check (manual)

On `pnpm preview`, Chrome DevTools Performance panel, 4× CPU throttling, "Fast 4G", trace from reload until both
charts appear, at 360 px and at 1440 px.

- [ ] No task from data work longer than 50 ms on the main thread.
- [ ] CLS 0: the KPI and chart skeletons have their final size at every breakpoint.

| Date | Width | Long tasks > 50 ms | CLS | Notes |
| ---- | ----- | ------------------ | --- | ----- |
|      |       |                    |     |       |

## Lighthouse (release gate)

Lighthouse mobile defaults on <https://alelb.github.io/witness/> after the deploy, median of 3 runs. Baseline
(2026-10-12, one run): 98 / 100 / 96 / 100.

- [ ] Performance ≥ 90.
- [ ] Accessibility 100.
- [ ] Best Practices 100 (no favicon 404, no console error).
- [ ] SEO 100.

| Date | Lighthouse | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |
| ---- | ---------- | ----------- | ------------- | -------------- | --- | --- | --- | --- |
|      |            |             |               |                |     |     |     |     |

## Manual checks: responsive matrix

At 360 px first (Chrome DevTools device mode), then across the full matrix from `tech-stack.md`, in light and dark
mode.

| Width                | No horizontal scroll | Layout as expected (see below) | Charts fit on screen | Skeleton = final size | Dark mode OK |
| -------------------- | -------------------- | ------------------------------ | -------------------- | --------------------- | ------------ |
| 320 px               | [ ]                  | [ ]                            | [ ]                  | [ ]                   | [ ]          |
| 360 px               | [ ]                  | [ ]                            | [ ]                  | [ ]                   | [ ]          |
| 640×360 (landscape)  | [ ]                  | [ ]                            | [ ]                  | [ ]                   | [ ]          |
| 768 px               | [ ]                  | [ ]                            | [ ]                  | [ ]                   | [ ]          |
| 1024 px              | [ ]                  | [ ]                            | [ ]                  | [ ]                   | [ ]          |
| 1440 px              | [ ]                  | [ ]                            | [ ]                  | [ ]                   | [ ]          |
| 360 px at 200 % zoom | [ ]                  | [ ]                            | [ ]                  | [ ]                   | [ ]          |

Expected layout:

- [ ] Below 640 px: one column; the named figure below the main figure in the card; charts stacked.
- [ ] 640–1023 px: the card shows the main and named figures side by side, the source below both; charts stacked.
- [ ] From 1024 px: the card full width on top; Sex and Age side by side, frames of equal height, sources aligned at
      the bottom; content capped at 1200 px.
- [ ] Without the summary (block `summary.json`), the card is one column at every width.
- [ ] With the chart chunk blocked, the error message with Retry spans the chart row at 1024 px and above.
- [ ] With a 24 px default font size at 320 px, nothing is clipped or overlapped.
- [ ] With "prefers-reduced-motion: reduce", the skeleton pulse does not animate.

## Manual checks: keyboard

In Chrome and Safari on macOS, light and dark.

- [ ] The skip link appears on the first Tab and moves focus to the main content.
- [ ] Every interactive element shows a visible focus ring with at least 3:1 contrast.
- [ ] Focus order follows the visual order at 360 px and at 1440 px.
- [ ] Each chart can be focused and its bars navigated with the arrow keys; the tooltip opens without a pointer.
- [ ] Retry is reachable and works in the dataset-error and chart-error states.

## Manual checks: screen reader

VoiceOver on macOS Safari and on iOS Safari.

- [ ] Landmarks: banner, main, the "Gaza demographics" region, contentinfo.
- [ ] The KPI figure is announced with its label; the named figure and its date are announced.
- [ ] Each chart is announced with its title, then its summary.
- [ ] "Loading data…" is announced while loading; the error message is announced, with Retry.
- [ ] Heading decision recorded (KPI label and chart titles as headings or not).

## Manual checks: real phone

An Android phone through Chrome remote DevTools, network throttled to "Slow 4G", on the Pages URL.

- [ ] The KPI figure appears before the charts; no jank while scrolling during load.
- [ ] Tapping a bar shows its label, count, and share; no horizontal scroll.
- [ ] Dark mode follows the phone's system setting.

| Date | Phone model / Android / Chrome | Network | Time to KPI | Time to charts | Notes |
| ---- | ------------------------------ | ------- | ----------- | -------------- | ----- |
|      |                                | Slow 4G |             |                |       |

## Done when (roadmap)

- [ ] Accessibility pass (contrast, keyboard, screen-reader summaries) and dark-mode audit complete, every finding
      resolved.
- [ ] KPI row from 640 px and the two-column chart grid from 1024 px, across the full responsive matrix (including
      landscape and 200% zoom).
- [ ] Re-checked on a real low-end phone over a throttled network.
- [ ] Performance budget met: initial JS ≤ ~200 kB gzip, Lighthouse mobile ≥ 90.
- [ ] MVP released on GitHub Pages: the merge is deployed, the favicon is live, and the `v1.0.0` tag and GitHub
      release exist (created when the owner asks).

## Not required for this phase

- A theme toggle, data tables, axe tests, a CI size check, TalkBack, social-share meta tags.
