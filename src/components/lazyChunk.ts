import { lazy, useCallback, useEffect, useState, type ComponentType } from 'react';

/** A dynamic import of a lazily loaded chunk whose default export is a component, e.g. `() => import('./Charts.tsx')`. */
export type ChunkLoader<P> = () => Promise<{ default: ComponentType<P> }>;

// Browsers cache a failed dynamic import by URL, so importing the chunk again rejects without a request. On Retry,
// fall back to the chunk's URL from the error message (Chromium, Firefox) with a query that makes it a new module.
function reloadChunk<P>(load: ChunkLoader<P>, attempt: number): ReturnType<ChunkLoader<P>> {
  return load().catch((error: unknown) => {
    const url = error instanceof Error ? /https?:\/\/\S+/.exec(error.message)?.[0] : undefined;
    if (url === undefined) throw error;
    return import(/* @vite-ignore */ `${url}?retry=${attempt}`) as ReturnType<ChunkLoader<P>>;
  });
}

/**
 * A `lazy()` component for a chunk, with Retry. A failed lazy import stays failed: `retry()` swaps in a fresh `lazy()`
 * and bumps `attempt`, which the caller uses as the `key` of its `ChartsErrorBoundary` to remount it. The chunk
 * download starts on mount, in parallel with the data; a failure surfaces through the lazy component.
 * `load` must be stable (defined at module level).
 */
export function useRetryableLazy<P>(load: ChunkLoader<P>) {
  const [chunk, setChunk] = useState(() => ({ attempt: 0, Component: lazy(load) }));
  const retry = useCallback(
    () =>
      setChunk(({ attempt }) => ({
        attempt: attempt + 1,
        Component: lazy(() => reloadChunk(load, attempt + 1)),
      })),
    [load],
  );

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  return { Component: chunk.Component, attempt: chunk.attempt, retry };
}
