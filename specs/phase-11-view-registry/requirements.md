# Phase 11 — View registry / navigation: Requirements

## Goal

Let the app hold more than one view, so the Gaza daily casualties (Phases 12–13) and West Bank (Phases 14–15) views
can plug in without touching the existing one. A view is registered once in the app shell; the shell routes between
views and shows a navigation menu as soon as there are two of them.

Stakeholder story: [3.1] modular UI layout ("future datasets … integrated as new views without rewriting the core
dashboard framework"). Mission principle 8 (built to grow); tech-stack layering rule 3 ("The app shell only registers
it").

## Context (2026-10-12)

- `App.tsx` renders `<Layout><GazaDemographicsView /></Layout>`: one view, hard-wired. There is no routing and no
  navigation.
- `Layout.tsx` holds the skip link (`href="#main"`), the header (`h1` "Witness" and the intro), `<main id="main"
tabIndex={-1}>`, and the footer.
- The view is a `<section aria-label="Gaza demographics">`; its KPI label and chart titles are `h2`s (Phase 10).
- `src/features/gaza-demographics/index.ts` exports `GazaDemographicsView` only.
- The data side already has a registry: `src/data/worker/datasets.ts` maps dataset ids to loaders, and
  `useDataset(id)` reads it. This phase adds the matching registry on the UI side; it does not touch datasets.
- GitHub Pages serves `index.html` only at `/witness/`; any other path is a 404, so routes cannot be paths without a
  build step.
- `index.html` sets `<title>Witness</title>`.
- Production build on `main` (2026-10-12, after PR #11): initial JS 230.95 kB (**72.56 kB gzip**), initial CSS
  2.14 kB gzip, chart chunk 102.54 kB gzip, worker 4.13 kB.

## In scope

### 1. View definition and registry

- A `ViewDefinition` type: `id` (kebab-case, unique, used in the URL), `label` (menu text), `title` (document title
  part), and `Component` (the view, no props).
- Each feature folder exports its definition as `view` from its `index.ts`. The Gaza demographics view is
  `{ id: 'gaza-demographics', label: 'Gaza demographics', title: 'Gaza demographics' }`.
- `src/app/views.ts` is the ordered list of registered views. The first entry is the default view. **Registering a
  view = a new feature folder plus one line in `views.ts`**; no existing view, the router, the menu, or the layout
  changes.
- Views are imported statically (decided 2026-10-12): the initial bundle grows by each view's non-chart code; charts
  stay lazy inside their view. Lazy loading per view is deferred until the 200 kB budget asks for it.

### 2. Routing

- Hash routes (decided 2026-10-12): `#/<view-id>`, e.g. `https://alelb.github.io/witness/#/gaza-demographics`. No build
  change and no 404 handling on Pages.
- A hand-written hook (decided 2026-10-12), no router dependency.
- Rules:
  - No hash, or `#/`: the default view; the URL is left as it is.
  - `#/<known id>`: that view.
  - `#/<unknown id>`: the default view, and the URL is corrected with `history.replaceState` to the bare page URL
    (no new history entry).
  - Any fragment not starting with `#/` (the skip link's `#main`, or any future in-page anchor) is ignored: the
    current view stays.
- Back and forward follow `hashchange`, so browser history works without `pushState`.
- The skip link moves focus to `main` without changing the URL, so a reload after using it keeps the current view.
  Its `href="#main"` stays for no-JS.

### 3. Navigation menu

- Shown only when at least two views are registered (decided 2026-10-12). With today's single view the page looks
  exactly as it does now.
- When shown: a `<nav aria-label="Views">` in the header below the intro, a list of links (`href="#/<id>"`), the
  current one with `aria-current="page"`. Mobile first: links wrap onto more lines at 320 px, each tap target at least
  44×44 px, visible focus ring, no hover-only styling.

### 4. Current view

- `document.title` is `<view title> · Witness` (decided 2026-10-12), e.g. "Gaza demographics · Witness", for the
  default view too. The view's region keeps its `aria-label`. No new visible heading: the `h2`s from Phase 10 stay.
- On a view change after the first render (menu link, a typed hash, back or forward), focus moves to `main` and the
  page scrolls to the top (decided 2026-10-12), as the skip link does. On the first render focus does not move.

## Out of scope

- A second real view (Phase 13) or a placeholder view shipped to production.
- Lazy loading of whole views; nested routes, route parameters, query strings.
- Path-based URLs or a build step that copies `index.html` per view.
- Per-view meta descriptions or social-share tags.
- Changes to datasets, the worker, `useDataset()`, or the Gaza demographics view's content and layout.
- A visible view heading or a breadcrumb.
- Manual checks of the menu (decided 2026-10-12: automated tests with fake views now; manual checks with the real
  second view in Phase 13). Lighthouse (no visual change).

## Decisions

| Decision          | Choice                                                         | Rationale                                                                    |
| ----------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| URLs              | Hash routes `#/<view-id>`                                      | Work on GitHub Pages with no build step or 404 trick.                        |
| In-page fragments | Ignored by the router; the skip link no longer changes the URL | `#main` must not switch views or drop the current view on reload.            |
| Router            | Hand-written hook, no dependency                               | Flat list of views; tech-stack lists no router.                              |
| Registry          | `view` descriptor per feature, ordered list in `app/views.ts`  | One line to register a view; the first entry is the default.                 |
| Loading           | Static imports                                                 | No extra round trip before the KPI; charts are already lazy.                 |
| Menu              | Only from two views                                            | No one-item menu; the site does not change until Phase 13.                   |
| Unknown view      | Default view, URL corrected with `replaceState`                | No dead end, no extra history entry.                                         |
| Current view      | `document.title` + region label; focus to `main` on change     | Screen readers hear the new view; no visual change to the existing view.     |
| Validation        | Automated tests with fake views; bundle size; no Lighthouse    | The menu is invisible in production until Phase 13; the page looks the same. |

## Open questions

None.
