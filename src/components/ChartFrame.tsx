import { useId, type CSSProperties, type ReactNode } from 'react';
import styles from './ChartFrame.module.css';

export interface ChartFrameProps {
  title: string;
  description?: ReactNode;
  /** Plain-language summary of the figures: the chart's text equivalent, read by screen readers only. */
  summary: string;
  /** Number of bars, which sets the plot height. Without it, the plot has a fixed height. */
  rows?: number;
  /** Controls for the chart (e.g. a mode toggle), between the description and the plot. */
  controls?: ReactNode;
  /** Extra content below the plot, e.g. a collapsible data table. */
  details?: ReactNode;
  /** The chart. */
  children: ReactNode;
}

/** The plot height follows the number of rows, or is fixed without them; see `.plot` in the CSS. */
function plotProps(rows: number | undefined): { className: string; style?: CSSProperties } {
  return rows === undefined
    ? { className: `${styles.plot} ${styles.plotFixed}` }
    : { className: `${styles.plot}`, style: { '--rows': rows } as CSSProperties };
}

// Library-agnostic chart wrapper: title, description, and plot area; the source is named once, in the footer. The title is also a heading, for heading navigation.
// The summary is the figure's accessible description, visually hidden: the bars already carry their labels and counts.
export function ChartFrame({
  title,
  description,
  summary,
  rows,
  controls,
  details,
  children,
}: ChartFrameProps) {
  const titleId = useId();
  const summaryId = useId();

  return (
    <figure className={styles.frame} aria-labelledby={titleId} aria-describedby={summaryId}>
      <figcaption id={titleId}>
        <h2 className={styles.title}>{title}</h2>
      </figcaption>
      {description !== undefined && <div className={styles.description}>{description}</div>}
      <p id={summaryId} className="visually-hidden">
        {summary}
      </p>
      {controls !== undefined && <div className={styles.controls}>{controls}</div>}
      <div {...plotProps(rows)}>{children}</div>
      {details !== undefined && <div className={styles.details}>{details}</div>}
    </figure>
  );
}

export interface ChartFrameSkeletonProps {
  /** As in `ChartFrame`: the plot height. */
  rows?: number;
  /** Reserve the height of one row of controls (tap-target high). */
  controls?: boolean;
  /** Reserve the height of a one-line `details` summary (tap-target high). */
  details?: boolean;
}

/**
 * Placeholder with the frame's container, plot height, and the line heights of its title, one-line description, and
 * any controls or details: swapping it for the frame causes no layout shift.
 */
export function ChartFrameSkeleton({
  rows,
  controls = false,
  details = false,
}: ChartFrameSkeletonProps) {
  const plot = plotProps(rows);
  return (
    <div className={styles.frame} aria-hidden="true">
      <span className={`${styles.bar} ${styles.barTitle}`} />
      <span className={`${styles.bar} ${styles.barShort} ${styles.barDescription}`} />
      {controls && <span className={`${styles.bar} ${styles.barShort} ${styles.barTapTarget}`} />}
      <div {...plot} className={`${plot.className} ${styles.plotSkeleton}`} />
      {details && <span className={`${styles.bar} ${styles.barShort} ${styles.barTapTarget}`} />}
    </div>
  );
}
