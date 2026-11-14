'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Ic } from '../../../components/icons';

interface MemoryLaneCardProps {
  matchId: number | null;
  messages: Array<{ senderId: number; content: string; createdAt: string }>;
  myId: number | null;
  partnerName: string;
  matchedAt?: string | null;
  onSendMemory: (text: string) => void;
}

const STORAGE_KEY_PREFIX = 'datebuddy_memorylane_';

function extractEmojis(text: string): string[] {
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu;
  return text.match(emojiRegex) || [];
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.floor(Math.abs(d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function getStreakDays(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const unique = [...new Set(dates.map((d) => d.toDateString()))].sort();
  let streak = 1;
  let maxStreak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    if (daysBetween(prev, curr) === 1) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 1;
    }
  }
  return maxStreak;
}

export function MemoryLaneCard({
  matchId,
  messages,
  myId,
  partnerName,
  matchedAt,
  onSendMemory,
}: MemoryLaneCardProps) {
  const cleanName = partnerName?.split(' ')[0] || 'your match';
  const storageKey = `${STORAGE_KEY_PREFIX}${matchId}`;

  const [dismissed, setDismissed] = useState(() => {
    if (!matchId) return true;
    try {
      return !!localStorage.getItem(storageKey);
    } catch {
      return false;
    }
  });
  const [shared, setShared] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Compute stats
  const stats = useMemo(() => {
    if (!messages.length || !myId) return null;

    const totalMessages = messages.length;
    const myMessages = messages.filter((m) => m.senderId === myId);
    const theirMessages = messages.filter((m) => m.senderId !== myId);

    // Days since first message
    const firstDate = new Date(messages[0].createdAt);
    const now = new Date();
    const daysSinceFirst = daysBetween(firstDate, now);

    // Must be at least 7 days old
    if (daysSinceFirst < 7) return null;

    // Top emojis
    const myEmojiMap = new Map<string, number>();
    const theirEmojiMap = new Map<string, number>();
    for (const m of myMessages) {
      for (const e of extractEmojis(m.content)) {
        myEmojiMap.set(e, (myEmojiMap.get(e) || 0) + 1);
      }
    }
    for (const m of theirMessages) {
      for (const e of extractEmojis(m.content)) {
        theirEmojiMap.set(e, (theirEmojiMap.get(e) || 0) + 1);
      }
    }
    const myTopEmojis = [...myEmojiMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([e]) => e);
    const theirTopEmojis = [...theirEmojiMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([e]) => e);

    // Streak
    const allDates = messages.map((m) => new Date(m.createdAt));
    const longestStreak = getStreakDays(allDates);

    // Who texts more
    const whoTextsMore = myMessages.length > theirMessages.length ? 'you' : cleanName;

    return {
      totalMessages,
      daysSinceFirst,
      myTopEmojis,
      theirTopEmojis,
      longestStreak,
      whoTextsMore,
      firstDate,
    };
  }, [messages, myId, cleanName]);

  const handleShare = useCallback(() => {
    if (!stats) return;
    const lines = [
      `💫 Memory Lane — ${cleanName} & Me`,
      `━━━━━━━━━━━━━`,
      `📅 Talking for ${stats.daysSinceFirst} days`,
      `💬 ${stats.totalMessages} messages exchanged`,
      `🔥 Longest streak: ${stats.longestStreak} day${stats.longestStreak !== 1 ? 's' : ''}`,
      stats.myTopEmojis.length > 0 ? `😄 My fav emojis: ${stats.myTopEmojis.join(' ')}` : '',
      `━━━━━━━━━━━━━`,
      `Here's to many more memories! 💕`,
    ].filter(Boolean);
    onSendMemory(lines.join('\n'));
    setShared(true);
  }, [stats, cleanName, onSendMemory]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ dismissed: true, at: Date.now() }));
    } catch { /* ignore */ }
  }, [storageKey]);

  if (dismissed || !stats) return null;

  const facts = [
    stats.myTopEmojis.length > 0 ? `Your favourite emojis: ${stats.myTopEmojis.join(' ')}` : null,
    stats.theirTopEmojis.length > 0 ? `${cleanName}'s favourites: ${stats.theirTopEmojis.join(' ')}` : null,
    `${stats.whoTextsMore === 'you' ? 'You text' : `${cleanName} texts`} a little more often`,
  ].filter(Boolean) as string[];

  return (
    <section className="mx-4 mb-3 rounded-2xl border border-infyn-border bg-infyn-surface" aria-label={`Memory Lane with ${cleanName}`}>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex-1 min-w-0 min-h-[52px] pl-4 pr-2 flex items-center gap-3 text-left cursor-pointer"
        >
          <span className="h-8 w-8 shrink-0 grid place-items-center rounded-full bg-infyn-blush text-infyn-rose" aria-hidden>
            <Ic.Sparkle className="w-4 h-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-infyn-ink">Memory Lane</span>
            <span className="block text-[13px] text-infyn-secondary truncate">
              {stats.daysSinceFirst} days · {stats.totalMessages} messages with {cleanName}
            </span>
          </span>
          <span className={`shrink-0 text-infyn-secondary transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} aria-hidden>
            <Ic.ChevDown />
          </span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="h-11 w-11 mr-1 shrink-0 grid place-items-center rounded-full text-infyn-muted active:bg-infyn-surface-soft cursor-pointer"
          aria-label="Hide Memory Lane"
        >
          <Ic.X className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 animate-soft-arrive">
          <dl className="grid grid-cols-3 gap-2 border-t border-infyn-border pt-3">
            {[
              { label: 'Days', value: stats.daysSinceFirst },
              { label: 'Messages', value: stats.totalMessages },
              { label: 'Best streak', value: stats.longestStreak },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <dd className="font-display text-[24px] leading-tight text-infyn-ink tabular-nums">{item.value}</dd>
                <dt className="text-[12px] text-infyn-secondary">{item.label}</dt>
              </div>
            ))}
          </dl>
          <ul className="mt-3 space-y-1 text-[13px] text-infyn-secondary">
            {facts.map((fact) => <li key={fact}>{fact}</li>)}
          </ul>
          {!shared ? (
            <button
              type="button"
              onClick={handleShare}
              className="mt-3 w-full min-h-[44px] rounded-full border border-infyn-rose-line text-infyn-rose text-[14px] font-semibold active:bg-infyn-blush transition-colors cursor-pointer"
            >
              Share in chat
            </button>
          ) : (
            <p className="mt-3 text-center text-[13px] text-infyn-secondary" role="status">Added to your conversation.</p>
          )}
        </div>
      )}
    </section>
  );
}
