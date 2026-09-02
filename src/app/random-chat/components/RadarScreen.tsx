'use client';

import { useState, useEffect } from 'react';
import { hapticLight } from '@/app/lib/haptics';
import { PremiumGlobe } from './PremiumGlobe';

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
    insight: 'Skip the generic "hey" — asking about recent music or food discoveries gets 4x better replies.',
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
  onlineCount,
  onCancel,
  busy,
}: {
  vibe: string | null;
  onlineCount: number;
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
    <div className="flex-1 min-h-0 flex flex-col items-center justify-between px-6 pt-4 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
      {/* Top Header info */}
      <div className="text-center">
        <h1 className="text-[22px] font-extrabold text-[#1E293B] mb-1">Looking for your vibe…</h1>
        <p className="text-[13px] text-[#1E293B]/55 font-medium max-w-[280px] mx-auto leading-relaxed">
          {vibe ? (
            <>
              Matching you with someone in the{' '}
              <span className="font-bold text-[#F43F5E] capitalize">{vibe}</span> mood.
            </>
          ) : (
            'Scanning for someone who wants to chat right now.'
          )}
        </p>
      </div>

      {/* 3D Holographic Matchmaking Globe */}
      <PremiumGlobe vibe={vibe} onlineCount={onlineCount} />

      {/* Rotating Insights Card — Clean & Premium */}
      <div className="w-full max-w-[340px] flex flex-col items-center">
        <div className="w-full bg-white/90 backdrop-blur-md border border-[#FF6B9D]/20 rounded-2xl p-3.5 shadow-sm min-h-[92px] flex flex-col justify-center transition-all duration-300">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FFF0F4] text-[#F43F5E]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </span>
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#F43F5E] bg-[#FFF0F4] px-2 py-0.5 rounded-full">
              {currentInsight.tag}
            </span>
          </div>
          <p
            key={insightIndex}
            className="text-[12.5px] font-medium text-[#1E293B]/80 leading-snug animate-fade-in"
          >
            {currentInsight.insight}
          </p>
        </div>

        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-gray-200/80 px-3.5 py-1 text-[11.5px] font-semibold text-[#1E293B]/60 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {onlineCount > 0 ? `${onlineCount} people looking right now` : 'Scanning active members nearby'}
        </p>
      </div>

      {/* Cancel Button */}
      <button
        onClick={() => {
          hapticLight();
          onCancel();
        }}
        disabled={busy}
        className="mt-2 rounded-full bg-white border border-gray-200 text-[#1E293B]/70 px-8 py-2.5 text-[13.5px] font-bold hover:bg-gray-50 active:scale-95 transition-all cursor-pointer disabled:opacity-60 shadow-2xs"
      >
        Cancel
      </button>
    </div>
  );
}
