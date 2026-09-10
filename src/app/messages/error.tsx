'use client';

import { useEffect } from 'react';
import { Ic } from '../components/icons';
import styles from './messages.module.css';

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Messages page error:', error);
  }, [error]);

  return (
    <div className={styles.root}>
      <div className={styles.shell}>
        <main className={styles.error} role="alert">
          <div className={styles.emptyIcon} aria-hidden><Ic.Chat /></div>
          <h1 className={styles.emptyTitle}>Something went wrong</h1>
          <p className={styles.emptyText}>We couldn’t load your messages. Please try again.</p>
          <button type="button" className={styles.primaryButton} onClick={reset}>Try again</button>
        </main>
      </div>
    </div>
  );
}
