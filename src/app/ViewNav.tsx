import type { ViewDefinition } from '../features/view.ts';
import { viewHref } from './viewRoute.ts';
import styles from './ViewNav.module.css';

// Navigation between registered views; the shell shows it only when there are at least two.
export function ViewNav({
  views,
  currentId,
}: {
  views: readonly ViewDefinition[];
  currentId: string;
}) {
  return (
    <nav aria-label="Views" className={styles.nav}>
      <ul className={styles.list}>
        {views.map((view) => (
          <li key={view.id}>
            <a
              className={styles.link}
              href={viewHref(view.id)}
              aria-current={view.id === currentId ? 'page' : undefined}
            >
              {view.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
