import { useId, type ReactNode } from 'react';
import { formatCount } from './format.ts';
import styles from './KpiCard.module.css';

export interface KpiCardProps {
  label: string;
  value: number;
  description?: ReactNode;
  /** A secondary figure: below the description on phones, in a second column from 640 px. */
  aside?: ReactNode;
  footer?: ReactNode;
}

// One headline figure. The figure is named by its label, so screen readers announce the label with the value. The
// label is also a heading, for heading navigation.
export function KpiCard({ label, value, description, aside, footer }: KpiCardProps) {
  const labelId = useId();
  return (
    <figure
      className={aside === undefined ? styles.card : `${styles.card} ${styles.withAside}`}
      aria-labelledby={labelId}
    >
      <figcaption id={labelId}>
        <h2 className={styles.label}>{label}</h2>
      </figcaption>
      <p className={styles.value}>{formatCount(value)}</p>
      {description !== undefined && <div className={styles.description}>{description}</div>}
      {aside !== undefined && <div className={`${styles.asideSlot} ${styles.aside}`}>{aside}</div>}
      {footer !== undefined && <div className={styles.footer}>{footer}</div>}
    </figure>
  );
}

/**
 * Placeholder with the card's container and min-height: swapping it for the card causes no layout shift.
 * `withAside` matches a card with an `aside`, including its two columns from 640 px.
 */
export function KpiCardSkeleton({ withAside = false }: { withAside?: boolean }) {
  return (
    <div
      className={[styles.card, withAside && styles.withAside, styles.skeleton]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
    >
      <span className={`${styles.bar} ${styles.barLabel}`} />
      <span className={`${styles.bar} ${styles.barValue}`} />
      <span className={styles.bar} />
      {withAside && (
        <div className={styles.asideSlot}>
          <span className={`${styles.bar} ${styles.barLabel}`} />
          <span className={`${styles.bar} ${styles.barShort}`} />
        </div>
      )}
      <span className={`${styles.bar} ${styles.barShort} ${styles.barFooter}`} />
    </div>
  );
}
