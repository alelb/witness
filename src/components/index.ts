// Reusable UI components (KpiCard, ChartFrame, SourceNote, StateBoundary). No data fetching here.
// Only `*Chart.tsx` files import the chart library, and none is re-exported: this barrel is part of the initial chunk.
// Lazily loaded modules import them directly, e.g. from `./HorizontalBarChart.tsx`.
export { ChartFrame, ChartFrameSkeleton } from './ChartFrame.tsx';
export { ChartsErrorBoundary } from './ChartsErrorBoundary.tsx';
export { formatCount, formatIsoDate, formatShare } from './format.ts';
export { KpiCard, KpiCardSkeleton } from './KpiCard.tsx';
export { useRetryableLazy } from './lazyChunk.ts';
export { SiteFooter, DATA_PORTAL_URL } from './SiteFooter.tsx';
export { SourceNote } from './SourceNote.tsx';
export { LoadError, StateBoundary } from './StateBoundary.tsx';
