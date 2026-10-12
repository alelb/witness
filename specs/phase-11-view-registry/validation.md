# Phase 11 — View registry / navigation: Validation

The branch can be merged when every item below holds on `phase-11-view-registry`.

## Automated checks

Run locally and in CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

- [ ] All checks pass locally, and the `ci` workflow is green on the PR.

### Routing

- [ ] `parseViewHash`: `''`, `'#'` and `'#/'` give the default; `'#/<id>'` gives that id; `'#main'` is ignored.
- [ ] `useViewRoute`: the initial view follows the hash; `hashchange` to a known id switches view.
- [ ] An unknown id shows the default view and corrects the URL with `replaceState` (no new history entry).
- [ ] `#main` (and any fragment not starting with `#/`) keeps the current view.
- [ ] `document.title` is `<view title> · Witness`, and follows the view.

### Registry and shell

- [ ] `views.ts`: at least one view; ids unique and kebab-case; labels and titles non-empty.
- [ ] With one registered view, no "Views" navigation is rendered and the Gaza demographics view shows as before.
- [ ] With two fake views: one link per view with `href="#/<id>"`, `aria-current="page"` on the current one only.
- [ ] With two fake views: a view change renders the other view and moves focus to `main`; the first render does not
      move focus.
- [ ] The skip link focuses `main` and leaves the URL unchanged.
- [ ] Existing App, view and component tests still pass.

## Structural checks (review)

- [ ] Registering a view needs only a feature folder exporting `view` and one line in `src/app/views.ts`: the test
      with fake views passes them to `App` without touching any existing view, the router, the menu, or the layout.
- [ ] No new runtime or dev dependency; no router library.
- [ ] `ViewNav.module.css` uses tokens only and `min-width` queries only (if any).
- [ ] No change to `src/data/`, `src/hooks/`, or the Gaza demographics view's markup and styles.

## Bundle check

From `pnpm build` output. Baseline on `main` (2026-10-12, after PR #11): initial JS 72.56 kB gzip, initial CSS
2.14 kB gzip, chart chunk 102.54 kB gzip, worker 4.13 kB.

- [ ] Initial JS within ~2 kB gzip of the baseline, and ≤ ~200 kB gzip (tech-stack budget).
- [ ] `recharts` is still only in the lazy chart chunk.

| Date | Initial JS (gzip) | Initial CSS (gzip) | Chart chunk (gzip) | Worker | Notes |
| ---- | ----------------- | ------------------ | ------------------ | ------ | ----- |
|      |                   |                    |                    |        |       |

## Manual checks

On `pnpm preview`, then on <https://alelb.github.io/witness/> after the deploy. The menu itself is checked with the
real second view in Phase 13 (decided 2026-10-12); here only the unchanged site and the URLs are checked.

- [ ] At 360 px and 1440 px, light and dark, the page looks the same as on `main` (no menu, same layout).
- [ ] The tab title reads "Gaza demographics · Witness".
- [ ] `…/witness/#/gaza-demographics` opens the view; a reload keeps it.
- [ ] `…/witness/#/unknown` opens the default view and the address bar shows `…/witness/`; Back does not return to
      `#/unknown`.
- [ ] The skip link appears on the first Tab, moves focus to the main content, and the address bar does not change.
- [ ] No console errors.

## Done when (roadmap)

- [ ] Simple routing between views: hash routes, default view, unknown-view fallback, back and forward.
- [ ] Registering a view requires no change to existing views (structural check above).

## Not required for this phase

- A second real view, manual checks of the menu, Lighthouse, lazy loading of views, path-based URLs.
