import { useState } from 'react';
import { ChartFrame, formatIsoDate } from '../../components';
import {
  TimeSeriesChart,
  type TimeSeriesMode,
  type TimeSeriesPoint,
} from '../../components/TimeSeriesChart.tsx';
import type { LatestReport, MonthBucket } from '../../data/aggregators/timeSeries.ts';
import styles from './DailyReportsChart.module.css';
import { MonthTable } from './MonthTable.tsx';
import { bucketLabel, cumulativeSummary, monthlySummary } from './summaries.ts';

export interface DailyReportsChartProps {
  months: readonly MonthBucket[];
  latest: LatestReport;
  skippedRows: number;
}

const TITLE = 'Killed over time';

const MODES: readonly { mode: TimeSeriesMode; label: string }[] = [
  { mode: 'bars', label: 'Per month' },
  { mode: 'line', label: 'Cumulative' },
];

function toPoints(
  months: readonly MonthBucket[],
  latest: LatestReport,
  mode: TimeSeriesMode,
): TimeSeriesPoint[] {
  return months.map((bucket) => ({
    key: bucket.month,
    label: bucketLabel(bucket, latest),
    value: mode === 'bars' ? bucket.killed : bucket.killedCum,
    partial: bucket.partial,
  }));
}

// The lazily loaded chart chunk: the only module of this view that pulls in the chart library. The toggle changes
// the chart and its summary; the table always lists both figures.
export default function DailyReportsChart({ months, latest, skippedRows }: DailyReportsChartProps) {
  const [mode, setMode] = useState<TimeSeriesMode>('bars');

  return (
    <ChartFrame
      title={TITLE}
      description={
        <p>
          Gaza daily reports, last updated {formatIsoDate(latest.date)}. Days without a report are
          counted in the table.
        </p>
      }
      summary={mode === 'bars' ? monthlySummary(months, latest) : cumulativeSummary(months, latest)}
      controls={
        <div className={styles.toggle} role="group" aria-label="Chart">
          {MODES.map((option) => (
            <button
              key={option.mode}
              type="button"
              className={styles.option}
              aria-pressed={mode === option.mode}
              onClick={() => setMode(option.mode)}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
      details={<MonthTable months={months} latest={latest} skippedRows={skippedRows} />}
    >
      <TimeSeriesChart title={TITLE} points={toPoints(months, latest, mode)} mode={mode} />
    </ChartFrame>
  );
}
