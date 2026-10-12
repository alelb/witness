import { useEffect } from 'react';
import type { ViewDefinition } from '../features/view.ts';
import { Layout } from './Layout.tsx';
import { useViewRoute } from './useViewRoute.ts';
import { ViewNav } from './ViewNav.tsx';
import { views as registeredViews } from './views.ts';

// App shell: routes between the registered views and shows the menu once there are two. Views live in `features/`;
// the shell only wires them up.
export function App({ views = registeredViews }: { views?: readonly ViewDefinition[] }) {
  const route = useViewRoute(views);
  const { Component } = route.view;

  // After a view change, move focus to the new content and start at the top, as the skip link does.
  useEffect(() => {
    if (!route.changed) return;
    document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [route]);

  return (
    <Layout
      nav={views.length > 1 ? <ViewNav views={views} currentId={route.view.id} /> : undefined}
    >
      <Component key={route.view.id} />
    </Layout>
  );
}
