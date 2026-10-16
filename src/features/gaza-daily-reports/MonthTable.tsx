import { formatCount } from '../../components/format.ts';
import type { LatestReport, MonthBucket } from '../../data/aggregators/timeSeries.ts';
import styles from './MonthTable.module.css';
import { bucketLabel, skippedRowsNote, spansNote } from './summaries.ts';

export interface MonthTableProps {
  months: readonly MonthBucket[];
  latest: LatestReport;
  skippedRows: number;
}

const NO_REPORT = 'No report';

function count(value: number | null): string {
  return value === null ? NO_REPORT : formatCount(value);
}

// The chart's data table, collapsed by default: one row per month, oldest first. Below 640 px each row is a stacked
// list item labelled by its column names; from 640 px it is a regular table. The explicit roles keep the table
// semantics when the stacked layout changes the elements' `display`.
export function MonthTable({ months, latest, skippedRows }: MonthTableProps) {
  const skipped = skippedRowsNote(skippedRows);
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>Figures by month</summary>
      <table className={styles.table} role="table">
        <thead role="rowgroup">
          <tr role="row">
            <th role="columnheader" scope="col">
              Month
            </th>
            <th role="columnheader" scope="col">
              Killed
            </th>
            <th role="columnheader" scope="col">
              Cumulative
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {months.map((bucket) => {
            const note = spansNote(bucket);
            return (
              <tr key={bucket.month} role="row">
                <th role="rowheader" scope="row">
                  {bucketLabel(bucket, latest)}
                  {note !== null && <span className={styles.note}>{note}</span>}
                </th>
                <td role="cell" data-label="Killed">
                  {count(bucket.killed)}
                </td>
                <td role="cell" data-label="Cumulative">
                  {count(bucket.killedCum)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {skipped !== null && <p className={styles.note}>{skipped}</p>}
    </details>
  );
}
