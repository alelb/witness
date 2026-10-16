import type { MouseEvent, ReactNode } from 'react';
import { SiteFooter } from '../components';
import styles from './Layout.module.css';

// The skip link moves focus without changing the URL, so `#main` never replaces the current view's hash.
// `href="#main"` still works without JavaScript.
function skipToMain(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  document.getElementById('main')?.focus();
}

// Page frame: skip link, landmarks, the optional view menu, the centered content column capped at
// `--content-max-width`, and the footer naming the current view's datasets.
export function Layout({
  children,
  nav,
  datasets,
}: {
  children: ReactNode;
  nav?: ReactNode;
  datasets?: string;
}) {
  return (
    <>
      <a className={styles.skipLink} href="#main" onClick={skipToMain}>
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.inner}>
          <h1 className={styles.title}>Witness</h1>
          <p className={styles.intro}>
            Open data bearing witness to Palestinians killed by Israel in Gaza and the West Bank.
          </p>
          {nav}
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        <div className={styles.inner}>{children}</div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.inner}>
          <SiteFooter datasets={datasets} />
        </div>
      </footer>
    </>
  );
}
