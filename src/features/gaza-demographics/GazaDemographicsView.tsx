import { lazy, Suspense, useEffect, useState } from 'react';
import {
  ChartFrameSkeleton,
  DATA_PORTAL_URL,
  formatCount,
  formatIsoDate,
  KpiCard,
  KpiCardSkeleton,
  SourceNote,
  StateBoundary,
} from '../../components';
import { AGE_BRACKETS, SEX_BUCKETS } from '../../data/aggregators/demographics.ts';
import { useDataset } from '../../hooks/useDataset.ts';
import { ChartsErrorBoundary } from './ChartsErrorBoundary.tsx';
import styles from './GazaDemographicsView.module.css';

// The charts are a separate chunk, so the KPI never waits for the chart library.
const loadCharts = () => import('./DemographicCharts.tsx');
const DemographicCharts = lazy(loadCharts);

// Browsers cache a failed dynamic import by URL, so importing the chunk again rejects without a request. On Retry,
// fall back to the chunk's URL from the error message (Chromium, Firefox) with a query that makes it a new module.
function reloadCharts(attempt: number): ReturnType<typeof loadCharts> {
  return loadCharts().catch((error: unknown) => {
    const url = error instanceof Error ? /https?:\/\/\S+/.exec(error.message)?.[0] : undefined;
    if (url === undefined) throw error;
    return import(/* @vite-ignore */ `${url}?retry=${attempt}`) as ReturnType<typeof loadCharts>;
  });
}

// Sized for the usual case, an empty Unknown bucket (not drawn): one row less than the definitions.
function ChartSkeletons() {
  return (
    <>
      <ChartFrameSkeleton rows={SEX_BUCKETS.length - 1} />
      <ChartFrameSkeleton rows={AGE_BRACKETS.length - 1} />
    </>
  );
}

// One date per figure, always worded "last updated": "as of 7 October" would read as "since 7 October" (2023).
function lastUpdated(isoDate: string | null | undefined): string | null {
  return isoDate == null ? null : `last updated ${formatIsoDate(isoDate)}`;
}

// Gaza demographics view. The main figure is the total from Gaza daily reports; the named count is the card's aside,
// below it, a separate figure from a separate dataset, never merged. Without the summary, the named count is the main
// figure and the card has no aside.
export function GazaDemographicsView() {
  const { status, data, retry } = useDataset('gaza-demographics');
  // A failed lazy import stays failed: Retry swaps in a fresh `lazy()` and remounts the boundary.
  const [charts, setCharts] = useState({ attempt: 0, Charts: DemographicCharts });
  const retryCharts = () =>
    setCharts(({ attempt }) => ({
      attempt: attempt + 1,
      Charts: lazy(() => reloadCharts(attempt + 1)),
    }));

  // Start the chunk download on mount, in parallel with the data. A failure surfaces through the lazy component.
  useEffect(() => {
    loadCharts().catch(() => {});
  }, []);

  const named = data?.demographics.total ?? 0;
  const summary = data?.summary ?? null;
  const reported = summary?.gazaReported ?? null;
  const reportedTotal = reported?.killedTotal ?? null;
  const namedUpdated = lastUpdated(summary?.killedInGaza.lastUpdate);
  const reportedUpdated = lastUpdated(reported?.lastUpdate);

  const card =
    reportedTotal === null ? (
      <KpiCard
        label="People killed in Gaza identified by name"
        value={named}
        description={
          <p>
            The list does not include everyone reported killed.{' '}
            {namedUpdated === null ? 'Last update date unavailable.' : `List ${namedUpdated}.`}
          </p>
        }
        footer={<SourceNote datasetName="Killed in Gaza" href={DATA_PORTAL_URL} />}
      />
    ) : (
      <KpiCard
        // Start of the daily reports series (first `report_date` in `casualties_daily.json`).
        label="People killed in Gaza since 7 October 2023"
        value={reportedTotal}
        description={
          <p>
            From Gaza daily reports
            {reportedUpdated === null ? '' : `, ${reportedUpdated}`}.
          </p>
        }
        aside={
          <div className={styles.named}>
            <p>
              <strong className={styles.namedValue}>{formatCount(named)}</strong> identified by name
            </p>
            <p className={styles.namedNote}>
              Killed in Gaza list
              {namedUpdated === null ? '; last update date unavailable.' : `, ${namedUpdated}.`}
            </p>
          </div>
        }
        footer={
          <SourceNote datasetName="Gaza daily reports and Killed in Gaza" href={DATA_PORTAL_URL} />
        }
      />
    );

  return (
    <section className={styles.view} aria-label="Gaza demographics">
      <StateBoundary
        status={status}
        isEmpty={named === 0 && reportedTotal === null}
        onRetry={retry}
        skeleton={
          <div className={styles.view}>
            <KpiCardSkeleton />
            <div className={styles.charts}>
              <ChartSkeletons />
            </div>
          </div>
        }
      >
        {card}
        {named > 0 && data !== null && (
          <div className={styles.charts}>
            <ChartsErrorBoundary key={charts.attempt} onRetry={retryCharts}>
              <Suspense fallback={<ChartSkeletons />}>
                <charts.Charts demographics={data.demographics} namedUpdated={namedUpdated} />
              </Suspense>
            </ChartsErrorBoundary>
          </div>
        )}
      </StateBoundary>
    </section>
  );
}
