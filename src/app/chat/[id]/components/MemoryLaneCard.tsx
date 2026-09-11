'use client';

import React, { useState, useMemo, useCallback } from 'react';

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

  return (
    <div className="mx-4 mb-3 animate-vibe-slide-in">
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-infyn-rose/90 via-infyn-rose/85 to-infyn-rose/90" />
        {/* Soft particle dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-infyn-surface/10 animate-memory-float"
              style={{
                width: `${6 + Math.random() * 10}px`,
                height: `${6 + Math.random() * 10}px`,
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[18px]">💫</span>
              <div>
                <p className="text-[14px] font-extrabold text-white leading-tight">Memory Lane</p>
                <p className="text-[10.5px] text-white/60 font-medium">
                  Your journey with {cleanName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="h-6 w-6 rounded-full bg-infyn-surface/10 hover:bg-infyn-surface/20 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer text-[10px]"
              aria-label="Dismiss memory lane"
            >
              ✕
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-infyn-surface/10 backdrop-blur-sm p-2.5 text-center border border-infyn-border/10">
              <p className="text-[20px] font-black text-white">{stats.daysSinceFirst}</p>
              <p className="text-[9.5px] font-bold text-white/60 uppercase tracking-wider">Days</p>
            </div>
            <div className="rounded-xl bg-infyn-surface/10 backdrop-blur-sm p-2.5 text-center border border-infyn-border/10">
              <p className="text-[20px] font-black text-white">{stats.totalMessages}</p>
              <p className="text-[9.5px] font-bold text-white/60 uppercase tracking-wider">Messages</p>
            </div>
            <div className="rounded-xl bg-infyn-surface/10 backdrop-blur-sm p-2.5 text-center border border-infyn-border/10">
              <p className="text-[20px] font-black text-white">
                {stats.longestStreak}<span className="text-[12px]">🔥</span>
              </p>
              <p className="text-[9.5px] font-bold text-white/60 uppercase tracking-wider">Streak</p>
            </div>
          </div>

          {/* Fun facts */}
          <div className="space-y-1.5">
            {stats.myTopEmojis.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-infyn-surface/8 border border-infyn-border/10">
                <span className="text-[12px]">😄</span>
                <p className="text-[11.5px] text-white/80 font-medium">
                  Your fav emojis: {stats.myTopEmojis.join(' ')}
                </p>
              </div>
            )}
            {stats.theirTopEmojis.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-infyn-surface/8 border border-infyn-border/10">
                <span className="text-[12px]">💬</span>
                <p className="text-[11.5px] text-white/80 font-medium">
                  {cleanName}&apos;s fav: {stats.theirTopEmojis.join(' ')}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-infyn-surface/8 border border-infyn-border/10">
              <span className="text-[12px]">📊</span>
              <p className="text-[11.5px] text-white/80 font-medium">
                {stats.whoTextsMore === 'you' ? 'You text' : `${cleanName} texts`} more often
              </p>
            </div>
          </div>

          {/* Actions */}
          {!shared ? (
            <button
              type="button"
              onClick={handleShare}
              className="w-full py-2.5 rounded-xl bg-infyn-surface text-infyn-rose text-[12.5px] font-bold cursor-pointer active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
            >
              Share Memory in Chat 💕
            </button>
          ) : (
            <div className="text-center py-2 animate-popover-enter">
              <p className="text-[13px] font-bold text-white">Shared! 💕</p>
              <p className="text-[10.5px] text-white/50">{cleanName} can see your memories now</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
