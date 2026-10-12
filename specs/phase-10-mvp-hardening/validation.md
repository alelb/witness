# Phase 10 — MVP hardening: Validation

The branch can be merged when every item below holds on `phase-10-mvp-hardening`.

## Automated checks

Run locally and in CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [ ] All checks pass locally, and the `ci` workflow is green on the PR.

### Components

- [x] `KpiCard`: `aside` renders inside the figure after the value; without `aside` the markup is unchanged.
- [x] `ChartFrame`: the source note is still the last child of the frame.
- [x] Every markup fix from the audit has a test (for example a heading role or an accessible name).

### View

- [x] With the summary, the named figure is in the card's aside and the footer holds only the source.
- [x] Without the summary, the card has no aside.
- [x] Both charts, the chart skeletons (loading), and the chart `LoadError` render inside the charts wrapper.
- [x] Existing view tests still pass: loading, error with Retry, empty, no charts when the named total is 0.

## Structural checks (review)

- [x] New layout rules are `min-width` queries on `640px` and `1024px` only; `grep -rn "max-width:" src --include=*.css`
      finds no media query.
- [x] The base (phone) layout is unchanged: the 360 px screenshots before and after match, apart from audit fixes.
- [x] No theme toggle, no `localStorage`, no new runtime or dev dependency.
- [x] `tokens.css` header lists the contrast ratios of both palettes after the fixes.
- [x] `dist/index.html` links `/witness/favicon.svg`, and the file is in `dist/`.
- [x] `README.md` has the "What Witness shows" section.

## Audit log

Filled in during plan group 1 (on `main`) and closed during group 2. Every row ends as fixed or out of scope with a
reason.

Audited 2026-10-12 on `pnpm preview` of `main` (`221d84b`) in headless Chromium (Playwright), plus a contrast script
over `tokens.css`. VoiceOver, Safari and the real phone are owner checks (see the manual sections below).

| Area           | Finding                                                                                                                                                                                                                                | WCAG          | Light / dark | Resolution                                                                                                                                                                                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contrast       | Every text pair is at least 6.4:1, and every non-text pair (bars, hatch, focus ring) at least 4.2:1, in both palettes (table below). No token fails.                                                                                   | 1.4.3, 1.4.11 | Both         | No change. Ratios added to the `tokens.css` header (tooltip, Retry, hatch, focus ring).                                                                                                                                                                            |
| Contrast       | The tooltip box (`--color-bg` on `--color-surface`, 1.1:1) and the skeleton bars (`--color-border`, 1.3:1) are low contrast against the frame.                                                                                         | 1.4.11        | Both         | Out of scope: neither conveys information (the tooltip text is 15:1 or more; skeletons are `aria-hidden` placeholders).                                                                                                                                            |
| Keyboard       | Skip link on the first Tab, then source link, Sex chart, source link, Age chart, source link, footer link: visual order. 3 px focus ring on every element. Arrow keys on a focused chart open the tooltip; it closes on blur.          | 2.1.1, 2.4.7  | Both         | No change.                                                                                                                                                                                                                                                         |
| Tap targets    | Skip link 142×44, source and footer links 115×44, chart SVGs at least 294×120 at 360 px. Nothing under 44 px.                                                                                                                          | 2.5.8         | Both         | No change.                                                                                                                                                                                                                                                         |
| Headings       | The page has a single heading (`h1` "Witness"): the KPI label and the chart titles are plain `figcaption`s, so heading navigation (VoiceOver rotor) skips straight past the whole view.                                                | 1.3.1, 2.4.6  | Both         | Fixed: each `figcaption` wraps an `h2`, same visual style, figures still named by it. Tests in `KpiCard.test.tsx` and `ChartFrame.test.tsx`. Owner to confirm in review.                                                                                           |
| Dark mode      | Header, card, charts (bars, labels, counts), tooltip, focus ring, source links and footer all read well in the dark theme; skeletons follow `--color-border`. The hatch uses `--color-chart-bar` (4.4:1 on surface).                   | 1.4.3, 1.4.11 | Dark         | No change.                                                                                                                                                                                                                                                         |
| Reduced motion | Under `prefers-reduced-motion: reduce` the skeleton pulse runs once for 0.01 ms (`global.css`).                                                                                                                                        | 2.3.3         | Both         | No change.                                                                                                                                                                                                                                                         |
| Zoom / text    | 24 px default font (root 150%) at 320 px: no horizontal scroll, nothing outside the viewport, nothing clipped.                                                                                                                         | 1.4.4, 1.4.10 | Light        | No change. At a raised font size the KPI card grows past its `rem` min-height, so the skeleton is shorter than the card; accepted (default size is exact).                                                                                                         |
| Skeletons      | Chart skeletons were ~45 px shorter than the frames (262 vs 306 px at 360 px): title bar, description bar and source bar did not match the real line heights. Below the fold on phones; in view from 1024 px with charts side by side. | —             | Both         | Fixed: skeleton bars use the title and description line heights and a source line of `--tap-target` height. Skeleton = frame at 360, 640, 1024 px.                                                                                                                 |
| Error states   | Retry in the chart-error state never recovers in Chromium: the browser caches the failed chunk import, so the fresh `lazy()` rejects with no request (the jsdom test mocks the module and missed it). Dataset Retry works.             | —             | Both         | Fixed: Retry re-imports the chunk from the URL in the error message with a `?retry=n` query (a new module), and the chart CSS joins the main stylesheet (`cssCodeSplit: false`) so the retried chunk needs no CSS. Checked with the chunk blocked, then unblocked. |
| Release        | `/favicon.ico` 404 (console error, Best Practices 96).                                                                                                                                                                                 | —             | Both         | Fixed: `public/favicon.svg`, linked from `index.html`.                                                                                                                                                                                                             |

## Contrast (after fixes)

At least 4.5:1 for text, 3:1 for non-text (bars, hatch, focus ring), in both palettes.

| Pair                                   | Light         | Dark          | Pass |
| -------------------------------------- | ------------- | ------------- | ---- |
| text / bg, surface                     | 16.48 / 14.97 | 15.19 / 13.50 | [x]  |
| muted / bg, surface                    | 7.30 / 6.63   | 7.39 / 6.57   | [x]  |
| link / bg, surface                     | 7.01 / 6.37   | 9.09 / 8.07   | [x]  |
| chart-bar, hatch / surface             | 4.17          | 4.39          | [x]  |
| tooltip text / tooltip bg              | 16.48         | 15.19         | [x]  |
| focus ring / bg, surface               | 7.01 / 6.37   | 9.09 / 8.07   | [x]  |
| Retry label (bg) / Retry button (link) | 7.01          | 9.09          | [x]  |

## Bundle check

From `pnpm build` output. Baseline on `main` (2026-10-12): initial JS 72.51 kB gzip, initial CSS 1.91 kB gzip,
chart chunk 102.54 kB gzip, worker 4.13 kB.

- [x] Initial JS ≤ ~200 kB gzip (tech-stack budget), and within ~5 kB of the baseline.
- [x] `recharts` is only in the lazy chart chunk.

| Date       | Initial JS (gzip) | Initial CSS (gzip) | Chart chunk (gzip) | Worker  | Notes                                                                                                |
| ---------- | ----------------- | ------------------ | ------------------ | ------- | ---------------------------------------------------------------------------------------------------- |
| 2026-10-12 | 72.66 kB          | 2.27 kB            | 102.54 kB          | 4.13 kB | +0.15 kB JS, +0.36 kB CSS vs `main`; the chart chunk's 0.20 kB CSS is now in the initial stylesheet. |

## Main-thread and layout-shift check (manual)

On `pnpm preview`, Chrome DevTools Performance panel, 4× CPU throttling, "Fast 4G", trace from reload until both
charts appear, at 360 px and at 1440 px.

- [x] No task from data work longer than 50 ms on the main thread.
- [x] CLS 0: the KPI and chart skeletons have their final size at every breakpoint.

Measured in headless Chromium through CDP (4× CPU, Fast 4G) with buffered `PerformanceObserver`s, not the
Performance panel; the owner may confirm in DevTools.

| Date       | Width   | Long tasks > 50 ms                      | CLS | Notes                                                                                               |
| ---------- | ------- | --------------------------------------- | --- | --------------------------------------------------------------------------------------------------- |
| 2026-10-12 | 360 px  | 1 (86 ms), Recharts' first chart render | 0   | KPI at 3.6 s, charts at 3.9 s. Data work runs in the worker. Skeleton = final at 360, 640, 1024 px. |
| 2026-10-12 | 1440 px | 1 (63 ms), Recharts' first chart render | 0   | KPI at 3.5 s, charts at 3.8 s.                                                                      |

## Lighthouse (release gate)

Lighthouse mobile defaults on <https://alelb.github.io/witness/> after the deploy, median of 3 runs. Baseline
(2026-10-12, one run): 98 / 100 / 96 / 100.

- [ ] Performance ≥ 90.
- [ ] Accessibility 100.
- [ ] Best Practices 100 (no favicon 404, no console error).
- [ ] SEO 100.

| Date       | Lighthouse                                                     | Performance | Accessibility | Best Practices | SEO | LCP   | TBT   | CLS |
| ---------- | -------------------------------------------------------------- | ----------- | ------------- | -------------- | --- | ----- | ----- | --- |
| 2026-10-12 | 13.4.1, local `pnpm preview` (branch build), 1 run, pre-deploy | 99          | 100           | 100            | 100 | 2.0 s | 30 ms | 0   |

## Manual checks: responsive matrix

At 360 px first (Chrome DevTools device mode), then across the full matrix from `tech-stack.md`, in light and dark
mode.

| Width                | No horizontal scroll | Layout as expected (see below) | Charts fit on screen | Skeleton = final size | Dark mode OK |
| -------------------- | -------------------- | ------------------------------ | -------------------- | --------------------- | ------------ |
| 320 px               | [x]                  | [x]                            | [x]                  | [x]¹                  | [x]          |
| 360 px               | [x]                  | [x]                            | [x]                  | [x]                   | [x]          |
| 640×360 (landscape)  | [x]                  | [x]                            | [x]                  | [x]                   | [x]          |
| 768 px               | [x]                  | [x]                            | [x]                  | [x]                   | [x]          |
| 1024 px              | [x]                  | [x]                            | [x]                  | [x]                   | [x]          |
| 1440 px              | [x]                  | [x]                            | [x]                  | [x]                   | [x]          |
| 360 px at 200 % zoom | [x]                  | [x]                            | [x]                  | [x]¹                  | [x]          |

Run 2026-10-12 on `pnpm preview` in headless Chromium, light and dark, every width loaded with the data held back to
measure the skeletons first; 200% zoom emulated as a 180 px viewport.

¹ At 320 px and at 200% zoom the chart description and source wrap onto more lines than the skeleton has, so the
frames end taller (348 vs 306 px at 320 px; on `main` the skeleton was 262 px). The growth is below the fold: CLS
measured 0 at 320×700 and at 180×390.

Expected layout:

- [x] Below 640 px: one column; the named figure below the main figure in the card; charts stacked.
- [x] 640–1023 px: the card in one column (named figure below the main figure); charts stacked.
- [x] From 1024 px: the card full width on top; Sex and Age side by side, frames of equal height, sources aligned at
      the bottom; content capped at 1200 px.
- [x] Without the summary (block `summary.json`), the card is one column at every width.
- [x] With the chart chunk blocked, the error message with Retry spans the chart row at 1024 px and above.
- [x] With a 24 px default font size at 320 px, nothing is clipped or overlapped.
- [x] With "prefers-reduced-motion: reduce", the skeleton pulse does not animate.

## Manual checks: keyboard

In Chrome and Safari on macOS, light and dark. Chromium checked 2026-10-12 (headless, Playwright) at 360 px and
1440 px, before and after the layout change; Safari is still to do by the owner.

- [x] The skip link appears on the first Tab and moves focus to the main content.
- [x] Every interactive element shows a visible focus ring with at least 3:1 contrast.
- [x] Focus order follows the visual order at 360 px and at 1440 px.
- [x] Each chart can be focused and its bars navigated with the arrow keys; the tooltip opens without a pointer.
- [x] Retry is reachable and works in the dataset-error and chart-error states.

## Manual checks: screen reader

VoiceOver on macOS Safari and on iOS Safari. **Skipped by the owner (2026-10-12)**; the `h2` headings stay as proposed.

- [ ] Landmarks: banner, main, the "Gaza demographics" region, contentinfo.
- [ ] The KPI figure is announced with its label; the named figure and its date are announced.
- [ ] Each chart is announced with its title, then its summary.
- [ ] "Loading data…" is announced while loading; the error message is announced, with Retry.
- [x] Heading decision recorded (KPI label and chart titles as headings or not): proposed as `h2`s (audit log), owner
      to confirm in review after the VoiceOver pass.

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
- [x] The two-column chart grid from 1024 px, across the full responsive matrix (including
      landscape and 200% zoom).
- [ ] Re-checked on a real low-end phone over a throttled network.
- [ ] Performance budget met: initial JS ≤ ~200 kB gzip, Lighthouse mobile ≥ 90.
- [ ] MVP released on GitHub Pages: the merge is deployed, the favicon is live, and the `v1.0.0` tag and GitHub
      release exist (created when the owner asks).

## Not required for this phase

- A theme toggle, data tables, axe tests, a CI size check, TalkBack, social-share meta tags.
