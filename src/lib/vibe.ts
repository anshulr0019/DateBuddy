/*
  Vibe: a light, private label derived from how someone actually uses the
  app over the last few weeks. Every vibe is backed by data we store
  (swipe and message timestamps, like/pass, text length) and comes with a
  one-line reason the user can read.
*/

export type VibeId =
  | 'new_energy'
  | 'comeback_kid'
  | 'night_owl'
  | 'early_spark'
  | 'deep_talker'
  | 'selective'
  | 'heart_collector'
  | 'easygoing';

export interface Vibe {
  id: VibeId;
  title: string;
  subline: string;
  reason: string;
}

export interface ActivityEvent {
  at: Date;
  kind: 'swipe' | 'message';
  liked?: boolean;
  /* Text length; only for text messages. */
  length?: number;
}

export const WINDOW_DAYS = 28;
const MIN_EVENTS = 15;
const MIN_SWIPES = 20;
const MIN_TEXTS = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

const VIBES: Record<VibeId, { title: string; subline: string }> = {
  new_energy: { title: 'New Energy', subline: 'Let’s get started.' },
  comeback_kid: { title: 'Comeback Kid', subline: 'Good to have you back.' },
  night_owl: { title: 'Night Owl', subline: 'The night suits you.' },
  early_spark: { title: 'Early Spark', subline: 'First move energy.' },
  deep_talker: { title: 'Deep Talker', subline: 'Going beyond “hey”.' },
  selective: { title: 'Selective', subline: 'Quality over quantity.' },
  heart_collector: { title: 'Heart Collector', subline: 'Open to possibilities.' },
  easygoing: { title: 'Easygoing', subline: 'Taking it as it comes.' },
};

const vibe = (id: VibeId, reason: string): Vibe => ({ id, ...VIBES[id], reason });

/* Hour of day (0-23) in the user's own time zone. */
export function localHour(at: Date, timeZone: string): number {
  const h = Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(at));
  return Number.isFinite(h) ? h % 24 : at.getUTCHours();
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/* Events must already be limited to the last WINDOW_DAYS (plus, for the
   comeback rule, the user's most recent earlier event if any). */
export function computeVibe(events: ActivityEvent[], timeZone: string, now: Date = new Date()): Vibe {
  const windowStart = now.getTime() - WINDOW_DAYS * DAY_MS;
  const sorted = [...events].sort((a, b) => a.at.getTime() - b.at.getTime());

  // Comeback: active in the last 2 days after a 5+ day gap.
  if (sorted.length >= 2) {
    const last = sorted[sorted.length - 1].at.getTime();
    if (now.getTime() - last <= 2 * DAY_MS) {
      const recent = sorted.filter((e) => e.at.getTime() >= last - 2 * DAY_MS);
      const before = sorted.filter((e) => e.at.getTime() < recent[0].at.getTime());
      if (before.length > 0) {
        const gapDays = Math.floor((recent[0].at.getTime() - before[before.length - 1].at.getTime()) / DAY_MS);
        if (gapDays >= 5) return vibe('comeback_kid', `Back after ${gapDays} days away`);
      }
    }
  }

  const inWindow = sorted.filter((e) => e.at.getTime() >= windowStart);
  if (inWindow.length < MIN_EVENTS) {
    return vibe('new_energy', 'We’ll find your vibe after a little more activity');
  }

  const hours = inWindow.map((e) => localHour(e.at, timeZone));
  const share = (test: (h: number) => boolean) => hours.filter(test).length / hours.length;
  const night = share((h) => h >= 22 || h < 4);
  if (night >= 0.5) return vibe('night_owl', `${Math.round(night * 100)}% of your activity is after 10pm`);
  const morning = share((h) => h >= 5 && h < 9);
  if (morning >= 0.4) return vibe('early_spark', `${Math.round(morning * 100)}% of your activity is before 9am`);

  const texts = inWindow.filter((e) => e.kind === 'message' && typeof e.length === 'number');
  if (texts.length >= MIN_TEXTS) {
    const avg = texts.reduce((sum, e) => sum + (e.length ?? 0), 0) / texts.length;
    if (avg >= 80) return vibe('deep_talker', `Your messages average ${Math.round(avg)} characters`);
  }

  const swipes = inWindow.filter((e) => e.kind === 'swipe');
  if (swipes.length >= MIN_SWIPES) {
    const ratio = swipes.filter((e) => e.liked).length / swipes.length;
    if (ratio <= 0.3) return vibe('selective', `You like about ${Math.max(1, Math.round(ratio * 10))} in 10 profiles you see`);
    if (ratio >= 0.7) return vibe('heart_collector', `You like about ${Math.round(ratio * 10)} in 10 profiles you see`);
  }

  return vibe('easygoing', 'No single pattern stands out — you keep it balanced');
}
