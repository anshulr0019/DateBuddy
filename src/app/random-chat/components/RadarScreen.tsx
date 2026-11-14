'use client';

import { useState, useEffect } from 'react';
import { hapticLight } from '@/app/lib/haptics';

const VIBE_INSIGHTS = [
  {
    tag: 'Dating Tip',
    insight: 'Sharing what genuinely made you laugh today sparks instant chemistry faster than standard small talk.',
  },
  {
    tag: 'Connection',
    insight: 'Asking open-ended questions about passions creates authentic conversational flow.',
  },
  {
    tag: 'Icebreaker',
    insight: 'Try asking about a recent music or food discovery to give your conversation an easy starting point.',
  },
  {
    tag: 'Chemistry',
    insight: 'Mutual curiosity is the strongest predictor of a great first conversation.',
  },
  {
    tag: 'Pro Tip',
    insight: 'Finding one unique common interest turns an anonymous chat into a real spark.',
  },
  {
    tag: 'Vibe Check',
    insight: 'Be yourself from the first message. The right match vibes with the real you.',
  },
];

export function RadarScreen({
  vibe,
  onCancel,
  busy,
}: {
  vibe: string | null;
  onCancel: () => void;
  busy: boolean;
}) {
  const [insightIndex, setInsightIndex] = useState(0);

  // Rotate insights every 3.8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % VIBE_INSIGHTS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const currentInsight = VIBE_INSIGHTS[insightIndex];

  return (
    <div className="w-full max-w-[400px] flex flex-col items-center px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
      <h2 className="rc-title font-display text-[30px] leading-[1.15] tracking-tight text-infyn-ink text-center">
        Looking for your vibe…
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-infyn-secondary text-center max-w-[300px]">
        {vibe ? (
          <>Matching you with someone in a <span className="text-infyn-ink font-semibold whitespace-nowrap">{vibe}</span> mood.</>
        ) : (
          'Looking for someone who wants to chat right now.'
        )}
      </p>

      <div className="mt-6 w-full rounded-2xl bg-infyn-surface border border-infyn-border px-4 py-3.5 min-h-[96px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-infyn-rose">{currentInsight.tag}</p>
        <p key={insightIndex} className="mt-1 text-[14px] leading-relaxed text-infyn-ink animate-soft-arrive">
          {currentInsight.insight}
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          hapticLight();
          onCancel();
        }}
        disabled={busy}
        className="mt-5 min-h-[48px] px-8 rounded-full bg-infyn-surface border border-infyn-border text-[15px] font-semibold text-infyn-ink active:bg-infyn-surface-soft transition-colors disabled:opacity-60 cursor-pointer"
      >
        Cancel
      </button>
    </div>
  );
}
