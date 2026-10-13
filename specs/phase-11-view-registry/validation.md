# Phase 11 — View registry / navigation: Validation

The branch can be merged when every item below holds on `phase-11-view-registry`.

## Automated checks

Run locally and in CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [x] All checks pass locally, and the `ci` workflow is green on the PR.

### Routing

- [x] `parseViewHash`: `''`, `'#'` and `'#/'` give the default; `'#/<id>'` gives that id; `'#main'` is ignored.
- [x] `useViewRoute`: the initial view follows the hash; `hashchange` to a known id switches view.
- [x] An unknown id shows the default view and corrects the URL with `replaceState` (no new history entry).
- [x] `#main` (and any fragment not starting with `#/`) keeps the current view.
- [x] `document.title` is `<view title> · Witness`, and follows the view.

### Registry and shell

- [x] `views.ts`: at least one view; ids unique and kebab-case; labels and titles non-empty.
- [x] With one registered view, no "Views" navigation is rendered and the Gaza demographics view shows as before.
- [x] With two fake views: one link per view with `href="#/<id>"`, `aria-current="page"` on the current one only.
- [x] With two fake views: a view change renders the other view and moves focus to `main`; the first render does not
      move focus.
- [x] The skip link focuses `main` and leaves the URL unchanged.
- [x] Existing App, view and component tests still pass.

## Structural checks (review)

- [x] Registering a view needs only a feature folder exporting `view` and one line in `src/app/views.ts`: the test
      with fake views passes them to `App` without touching any existing view, the router, the menu, or the layout.
- [x] No new runtime or dev dependency; no router library.
- [x] `ViewNav.module.css` uses tokens only and `min-width` queries only (if any).
- [x] No change to `src/data/`, `src/hooks/`, or the Gaza demographics view's markup and styles.

## Bundle check

From `pnpm build` output. Baseline on `main` (2026-10-12, after PR #11): initial JS 72.56 kB gzip, initial CSS
2.14 kB gzip, chart chunk 102.54 kB gzip, worker 4.13 kB.

- [x] Initial JS within ~2 kB gzip of the baseline, and ≤ ~200 kB gzip (tech-stack budget).
- [x] `recharts` is still only in the lazy chart chunk.

| Date       | Initial JS (gzip) | Initial CSS (gzip) | Chart chunk (gzip) | Worker  | Notes                                    |
| ---------- | ----------------- | ------------------ | ------------------ | ------- | ---------------------------------------- |
| 2026-10-12 | 73.16 kB          | 2.25 kB            | 102.54 kB          | 4.13 kB | +0.60 kB JS, +0.11 kB CSS (menu styles). |

## Manual checks

On `pnpm preview`, then on <https://alelb.github.io/witness/> after the deploy. The menu itself is checked with the
real second view in Phase 13 (decided 2026-10-12); here only the unchanged site and the URLs are checked.

2026-10-12, on `pnpm preview` (headless Chromium): no Views menu, title "Gaza demographics · Witness",
`#/killed-in-gaza` survives a reload, `#/unknown` becomes `…/witness/` and Back skips it, the first Tab reaches the
skip link and Enter focuses `main` with the URL unchanged, no console errors. With one view the rendered markup is the
same as on `main` (the menu slot renders nothing), so the layout at 360 px and 1440 px is unchanged. Same results on
<https://alelb.github.io/witness/> after the deploy (2026-10-13).

- [x] At 360 px and 1440 px, light and dark, the page looks the same as on `main` (no menu, same layout).
- [x] The tab title reads "Gaza demographics · Witness".
- [x] `…/witness/#/killed-in-gaza` opens the view; a reload keeps it.
- [x] `…/witness/#/unknown` opens the default view and the address bar shows `…/witness/`; Back does not return to
      `#/unknown`.
- [x] The skip link appears on the first Tab, moves focus to the main content, and the address bar does not change.
- [x] No console errors.

## Done when (roadmap)

- [x] Simple routing between views: hash routes, default view, unknown-view fallback, back and forward.
- [x] Registering a view requires no change to existing views (structural check above).

## Not required for this phase

- A second real view, manual checks of the menu, Lighthouse, lazy loading of views, path-based URLs.
