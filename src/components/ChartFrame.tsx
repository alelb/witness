import { useId, type CSSProperties, type ReactNode } from 'react';
import styles from './ChartFrame.module.css';

export interface ChartFrameProps {
  title: string;
  description?: ReactNode;
  /** Plain-language summary of the figures: the chart's text equivalent, read by screen readers only. */
  summary: string;
  /** Number of bars, which sets the plot height. */
  rows: number;
  /** A `SourceNote`. */
  source: ReactNode;
  /** The chart. */
  children: ReactNode;
}

/** The plot height follows the number of rows; see `.plot` in the CSS. */
function plotStyle(rows: number): CSSProperties {
  return { '--rows': rows } as CSSProperties;
}

// Library-agnostic chart wrapper: title, plot area, and source. The title is also a heading, for heading navigation.
// The summary is the figure's accessible description, visually hidden: the bars already carry their labels and counts.
export function ChartFrame({
  title,
  description,
  summary,
  rows,
  source,
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
      <div className={styles.plot} style={plotStyle(rows)}>
        {children}
      </div>
      <div className={styles.source}>{source}</div>
    </figure>
  );
}

/**
 * Placeholder with the frame's container, plot height, and the line heights of its title, one-line description, and
 * source: swapping it for the frame causes no layout shift.
 */
export function ChartFrameSkeleton({ rows }: { rows: number }) {
  return (
    <div className={styles.frame} aria-hidden="true">
      <span className={`${styles.bar} ${styles.barTitle}`} />
      <span className={`${styles.bar} ${styles.barShort} ${styles.barDescription}`} />
      <div className={`${styles.plot} ${styles.plotSkeleton}`} style={plotStyle(rows)} />
      <div className={styles.source}>
        <span className={`${styles.bar} ${styles.barShort} ${styles.barSource}`} />
      </div>
    </div>
  );
}
