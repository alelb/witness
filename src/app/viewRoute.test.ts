import { describe, expect, it } from 'vitest';
import { parseViewHash, viewHref } from './viewRoute.ts';

describe('parseViewHash', () => {
  it.each([
    ['', { kind: 'default' }],
    ['#', { kind: 'default' }],
    ['#/', { kind: 'default' }],
    ['#/gaza-demographics', { kind: 'view', id: 'gaza-demographics' }],
    ['#/unknown', { kind: 'view', id: 'unknown' }],
    // Nested paths are not routes: the id `a/b` matches no view, so it is treated as unknown.
    ['#/a/b', { kind: 'view', id: 'a/b' }],
    ['#main', { kind: 'ignore' }],
  ])('parses %j', (hash, expected) => {
    expect(parseViewHash(hash)).toEqual(expected);
  });
});

describe('viewHref', () => {
  it('builds the hash route for a view id', () => {
    expect(viewHref('gaza-demographics')).toBe('#/gaza-demographics');
  });
});
