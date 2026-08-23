/* Time formatting helpers shared by the Messages module. */

export function formatClock(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* Compact relative time for the conversation list: now, 5m, 3h, Yesterday, Mon, 12 Jul */
export function formatListTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();

  if (diffMs < 60_000) return 'now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m`;
  if (isSameDay(d, now)) return `${Math.floor(diffMs / 3_600_000)}h`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return 'Yesterday';

  if (diffMs < 7 * 86_400_000) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

/* Date-divider label for the chat feed: Today, Yesterday, 12 Jul 2026 */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  if (isSameDay(d, now)) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return 'Yesterday';

  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Human-friendly last seen / presence label:
 * - "Online" if active within 5 minutes or explicitly online
 * - "Active 10m ago"
 * - "Active 2h ago"
 * - "Active yesterday"
 * - "Offline"
 */
export function formatLastSeen(lastActiveAt?: string | null, isOnline?: boolean): { label: string; isOnline: boolean } {
  if (isOnline) return { label: 'Online', isOnline: true };
  if (!lastActiveAt) return { label: 'Offline', isOnline: false };

  const d = new Date(lastActiveAt);
  if (isNaN(d.getTime())) return { label: 'Offline', isOnline: false };

  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 0) return { label: 'Online', isOnline: true };

  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 5) {
    return { label: 'Online', isOnline: true };
  }
  if (diffMins < 60) {
    return { label: `Active ${diffMins}m ago`, isOnline: false };
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return { label: `Active ${diffHours}h ago`, isOnline: false };
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return { label: 'Active yesterday', isOnline: false };
  }
  if (diffDays < 7) {
    return { label: `Active ${diffDays}d ago`, isOnline: false };
  }
  return { label: 'Offline', isOnline: false };
}

