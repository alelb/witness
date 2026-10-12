// Hash routes: `#/<view-id>`. Any other fragment (e.g. the skip link's `#main`) belongs to the page, not the router.
export type ViewHash = { kind: 'default' } | { kind: 'view'; id: string } | { kind: 'ignore' };

export function parseViewHash(hash: string): ViewHash {
  if (hash === '' || hash === '#' || hash === '#/') return { kind: 'default' };
  if (hash.startsWith('#/')) return { kind: 'view', id: hash.slice(2) };
  return { kind: 'ignore' };
}

export function viewHref(id: string): string {
  return `#/${id}`;
}
