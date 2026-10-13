import { describe, expect, it } from 'vitest';
import { views } from './views.ts';

describe('views', () => {
  it('registers at least one view', () => {
    expect(views.length).toBeGreaterThan(0);
  });

  it('has unique kebab-case ids', () => {
    const ids = views.map((view) => view.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has non-empty labels and titles', () => {
    for (const view of views) {
      expect(view.label.trim()).not.toBe('');
      expect(view.title.trim()).not.toBe('');
    }
  });
});
