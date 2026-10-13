# Phase 11 — View registry / navigation: Plan

Branch: `phase-11-view-registry`

## 1. View definition and registry

1.1 `src/features/view.ts`: `export interface ViewDefinition { id: string; label: string; title: string; Component:
ComponentType }`, with a comment on each field (id: kebab-case, unique, used in `#/<id>`). Features own the contract;
the app shell only consumes it.
1.2 `src/features/gaza-demographics/index.ts`: also export
`view: ViewDefinition = { id: 'killed-in-gaza', label: 'Gaza demographics', title: 'Gaza demographics', Component:
GazaDemographicsView }`.
1.3 `src/app/views.ts`: `export const views: readonly ViewDefinition[] = [gazaDemographics.view];` with a comment:
registering a view is one line here, and the first entry is the default.

## 2. Routing

2.1 `src/app/viewRoute.ts`, pure helpers with no React: `parseViewHash(hash: string): { kind: 'default' } | { kind:
'view'; id: string } | { kind: 'ignore' }` (`''` and `'#/'` → default; `'#/<id>'` → view; anything else, e.g.
`'#main'` → ignore) and `viewHref(id: string): string` → `'#/<id>'`.
2.2 `src/app/useViewRoute.ts`: `useViewRoute(views)` returns the current `ViewDefinition`. Initial state from
`location.hash` (ignored fragments → default). On `hashchange`: default → first view; known id → that view; unknown
id → first view and `history.replaceState(null, '', location.pathname + location.search)`; ignore → keep the current
view. Sets `document.title` to `` `${view.title} · Witness` `` whenever the view changes, including the first render,
and exposes whether the change came after the first render, so the shell can move focus (see 3.3).

## 3. App shell

3.1 `src/app/ViewNav.tsx` + `ViewNav.module.css`: `<nav aria-label="Views"><ul>` of `<a href={viewHref(id)}>`
links, `aria-current="page"` on the current one. Mobile first: a wrapping flex list with `gap`, links with
`min-height: var(--tap-target)`, `display: inline-flex; align-items: center`, current link marked by weight and an
underline (not colour alone); tokens only, both palettes.
3.2 `src/app/Layout.tsx`: optional `nav?: ReactNode` rendered in the header below the intro. The skip link gets an
`onClick` that calls `preventDefault()` and focuses `#main` (keeping `href="#main"` for no-JS), so the URL keeps the
current view.
3.3 `src/app/App.tsx`: `App({ views = registeredViews }: { views?: readonly ViewDefinition[] })`. Uses
`useViewRoute(views)`, renders `<Layout nav={views.length > 1 ? <ViewNav … /> : undefined}>` and the current view's
`Component`. After a view change that is not the first render: focus `main` (`preventScroll`) and
`window.scrollTo(0, 0)` in an effect.
3.4 `index.html`: keep `<title>Witness</title>` as the pre-JS title.

## 4. Tests

4.1 `src/app/viewRoute.test.ts`: table-driven `parseViewHash` cases (`''`, `'#'`, `'#/'`, `'#/killed-in-gaza'`,
`'#/unknown'`, `'#main'`, `'#/a/b'` → view `a/b`, treated as unknown), and `viewHref`.
4.2 `src/app/useViewRoute.test.tsx` (with two fake views): initial view from the hash; `hashchange` to a known id
switches; unknown id falls back to the default and calls `replaceState` without a new history entry; `#main` keeps
the current view; `document.title` follows the view.
4.3 `src/app/views.test.ts`: at least one view; ids unique and kebab-case; labels and titles non-empty.
4.4 `src/app/ViewNav.test.tsx`: renders a link per view in order, `aria-current` only on the current one.
4.5 `src/app/App.test.tsx`:

- With the real registry (one view): no `navigation` landmark named "Views"; the Gaza demographics view renders;
  `document.title` is "Gaza demographics · Witness". Existing assertions still pass.
- With two fake views passed as `views`: the menu shows both links with `href="#/<id>"`; the current one has
  `aria-current="page"`; changing the hash renders the other view, moves focus to `main`, and updates the title;
  the first render does not move focus.
- The skip link focuses `main` and leaves `location.hash` unchanged.

## 5. Checks, docs and roadmap

5.1 Run `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`; record the bundle sizes in
`validation.md`.
5.2 On `pnpm preview`, and on the Pages URL after the deploy: the page looks the same as `main` at 360 px and 1440 px;
`#/killed-in-gaza` and `#/unknown` behave as specified; the skip link keeps the URL.
5.3 Update `CHANGELOG.md` after committing.
5.4 Open a PR, confirm `ci` is green, and wait for the owner's review before merging.
5.5 After the merge and a successful deploy, mark Phase 11 ✅ in `specs/roadmap.md`.
