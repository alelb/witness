import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeViews, navigateTo } from '../test/fakeViews.tsx';
import { useViewRoute } from './useViewRoute.ts';

const [first, second] = fakeViews;

beforeEach(() => {
  history.replaceState(null, '', '/');
  document.title = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useViewRoute', () => {
  it('starts on the default view without a hash', () => {
    const { result } = renderHook(() => useViewRoute(fakeViews));
    expect(result.current).toEqual({ view: first, changed: false });
  });

  it('starts on the view named by the hash', () => {
    history.replaceState(null, '', '#/second');
    const { result } = renderHook(() => useViewRoute(fakeViews));
    expect(result.current).toEqual({ view: second, changed: false });
  });

  it('starts on the default view for an ignored fragment', () => {
    history.replaceState(null, '', '#main');
    const { result } = renderHook(() => useViewRoute(fakeViews));
    expect(result.current.view).toBe(first);
  });

  it('switches view on hashchange to a known id', () => {
    const { result } = renderHook(() => useViewRoute(fakeViews));
    act(() => navigateTo('#/second'));
    expect(result.current).toEqual({ view: second, changed: true });
    act(() => navigateTo('#/'));
    expect(result.current).toEqual({ view: first, changed: true });
  });

  it('falls back to the default view for an unknown id and clears it from the URL', () => {
    history.replaceState(null, '', '#/second');
    const { result } = renderHook(() => useViewRoute(fakeViews));
    const replaceState = vi.spyOn(history, 'replaceState');
    const length = history.length;
    act(() => navigateTo('#/unknown'));
    expect(result.current.view).toBe(first);
    expect(replaceState).toHaveBeenCalledWith(null, '', location.pathname + location.search);
    expect(location.hash).toBe('');
    // Only the navigation itself added an entry; the correction did not.
    expect(history.length).toBe(length + 1);
  });

  it('clears an unknown id from the URL on the first render', () => {
    history.replaceState(null, '', '#/unknown');
    const { result } = renderHook(() => useViewRoute(fakeViews));
    expect(result.current.view).toBe(first);
    expect(location.hash).toBe('');
  });

  it('keeps the current view for a fragment that is not a route', () => {
    history.replaceState(null, '', '#/second');
    const { result } = renderHook(() => useViewRoute(fakeViews));
    act(() => navigateTo('#main'));
    expect(result.current).toEqual({ view: second, changed: false });
  });

  it('sets the document title from the view', () => {
    renderHook(() => useViewRoute(fakeViews));
    expect(document.title).toBe('First · Witness');
    act(() => navigateTo('#/second'));
    expect(document.title).toBe('Second · Witness');
  });
});
