import type { ViewDefinition } from '../features/view.ts';

// Two stand-in views for router and shell tests, so they do not depend on the registered ones.
export const fakeViews: readonly ViewDefinition[] = [
  {
    id: 'first',
    label: 'First view',
    title: 'First',
    Component: () => <section aria-label="First view">First content</section>,
  },
  {
    id: 'second',
    label: 'Second view',
    title: 'Second',
    Component: () => <section aria-label="Second view">Second content</section>,
  },
];

// Navigate like the browser does on a link, typed hash, back or forward: the URL changes, then `hashchange` fires.
export function navigateTo(hash: string) {
  history.pushState(null, '', hash === '' ? location.pathname : hash);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
