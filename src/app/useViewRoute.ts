import { useEffect, useState } from 'react';
import type { ViewDefinition } from '../features/view.ts';
import { parseViewHash } from './viewRoute.ts';

export interface ViewRoute {
  view: ViewDefinition;
  // True once the view has changed after the first render, so the shell can move focus to the new view.
  changed: boolean;
}

// The first registered view is the default.
function defaultView(views: readonly ViewDefinition[]): ViewDefinition {
  const [first] = views;
  if (!first) throw new Error('No views registered');
  return first;
}

// The view for a hash: `undefined` keeps the current view; an unknown id falls back to the default view.
function resolve(views: readonly ViewDefinition[], hash: string): ViewDefinition | undefined {
  const route = parseViewHash(hash);
  if (route.kind === 'ignore') return undefined;
  if (route.kind === 'default') return defaultView(views);
  return views.find((view) => view.id === route.id) ?? defaultView(views);
}

function isUnknownView(views: readonly ViewDefinition[], hash: string): boolean {
  const route = parseViewHash(hash);
  return route.kind === 'view' && !views.some((view) => view.id === route.id);
}

// Drop an unknown `#/<id>` from the URL without adding a history entry.
function clearHash() {
  history.replaceState(null, '', location.pathname + location.search);
}

// Current view from `location.hash`; follows `hashchange`, so back and forward work without `pushState`.
export function useViewRoute(views: readonly ViewDefinition[]): ViewRoute {
  const [route, setRoute] = useState<ViewRoute>(() => ({
    view: resolve(views, location.hash) ?? defaultView(views),
    changed: false,
  }));

  useEffect(() => {
    if (isUnknownView(views, location.hash)) clearHash();

    const onHashChange = () => {
      const next = resolve(views, location.hash);
      if (isUnknownView(views, location.hash)) clearHash();
      if (next === undefined) return;
      setRoute((current) => (current.view === next ? current : { view: next, changed: true }));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [views]);

  useEffect(() => {
    document.title = `${route.view.title} · Witness`;
  }, [route.view]);

  return route;
}
