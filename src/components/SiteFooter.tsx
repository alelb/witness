import styles from './SiteFooter.module.css';

export const DATA_PORTAL_URL = 'https://data.techforpalestine.org/';

// The page's one source line and the limitations note. Always rendered, so every view cites its datasets once, below
// its figures, and the caveat stays visible near every view.
export function SiteFooter({ datasets }: { datasets?: string }) {
  return (
    <div className={styles.footer}>
      <p>
        {datasets === undefined ? 'Data:' : `Source: ${datasets},`}{' '}
        <a className={styles.link} href={DATA_PORTAL_URL}>
          Tech for Palestine
        </a>
      </p>
      <p className={styles.note}>
        Reported figures may undercount the real toll because of information disruption and bodies
        not yet recovered.
      </p>
    </div>
  );
}
