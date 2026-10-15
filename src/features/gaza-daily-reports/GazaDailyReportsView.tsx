import { Suspense } from 'react';
import {
  ChartFrameSkeleton,
  ChartsErrorBoundary,
  DATA_PORTAL_URL,
  formatCount,
  formatIsoDate,
  KpiCard,
  KpiCardSkeleton,
  SourceNote,
  StateBoundary,
  useRetryableLazy,
} from '../../components';
import { useDataset } from '../../hooks/useDataset.ts';
import styles from './GazaDailyReportsView.module.css';

// The chart is a separate chunk, so the KPI never waits for the chart library.
const loadChart = () => import('./DailyReportsChart.tsx');

function ChartSkeleton() {
  return <ChartFrameSkeleton controls details />;
}

// Gaza over time view: the latest reported totals, then the people reported killed per month (or the cumulative
// total) from the Gaza daily reports. Reported values only; days without a report are counted in the table.
export function GazaDailyReportsView() {
  const { status, data, retry } = useDataset('gaza-daily-reports');
  const chart = useRetryableLazy(loadChart);
  const latest = data?.latest ?? null;

  return (
    <section className={styles.view} aria-label="Gaza over time">
      <StateBoundary
        status={status}
        isEmpty={latest === null}
        onRetry={retry}
        skeleton={
          <div className={styles.view}>
            <KpiCardSkeleton />
            <ChartSkeleton />
          </div>
        }
      >
        {data !== null && latest !== null && (
          <>
            <KpiCard
              // Start of the daily reports series (first `report_date` in `casualties_daily.json`).
              label="People killed in Gaza since 7 October 2023"
              value={latest.killedCum}
              description={
                <p>From Gaza daily reports, last updated {formatIsoDate(latest.date)}.</p>
              }
              aside={
                latest.injuredCum === null ? undefined : (
                  <p>
                    <strong className={styles.injuredValue}>
                      {formatCount(latest.injuredCum)}
                    </strong>{' '}
                    injured
                  </p>
                )
              }
              footer={<SourceNote datasetName="Gaza daily reports" href={DATA_PORTAL_URL} />}
            />
            <ChartsErrorBoundary key={chart.attempt} onRetry={chart.retry}>
              <Suspense fallback={<ChartSkeleton />}>
                <chart.Component
                  months={data.months}
                  latest={latest}
                  skippedRows={data.skippedRows}
                />
              </Suspense>
            </ChartsErrorBoundary>
          </>
        )}
      </StateBoundary>
    </section>
  );
}
