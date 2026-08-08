'use client';

import { useEffect } from 'react';

const HEARTBEAT_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes — inside the 5-min "online" window

/**
 * Fires a lightweight POST /api/heartbeat on mount and every 4 minutes
 * while the tab is visible. This keeps `lastActiveAt` fresh so the
 * "Active Now" indicators in the discovery feed are accurate.
 */
export default function Heartbeat() {
  useEffect(() => {
    const ping = () => {
      if (document.hidden) return;
      fetch('/api/heartbeat', { method: 'POST' }).catch(() => {});
    };

    // Fire immediately on mount
    ping();

    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    const onVisible = () => { if (!document.hidden) ping(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
