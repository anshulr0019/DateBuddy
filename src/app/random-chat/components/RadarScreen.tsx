'use client';

import { hapticLight } from '@/app/lib/haptics';

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
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <div className="relative h-56 w-56 mb-10" role="status" aria-label="Searching for a conversation partner">
        {/* Radar rings */}
        <div className="rc-ring absolute inset-0 rounded-full border border-[#FF6B9D]/25" style={{ animationDelay: '0s' }} />
        <div className="rc-ring absolute inset-0 rounded-full border border-[#7B68EE]/25" style={{ animationDelay: '0.5s' }} />
        <div className="rc-ring absolute inset-0 rounded-full border border-[#FF6B9D]/20" style={{ animationDelay: '1s' }} />

        {/* Sweep */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="rc-sweep absolute inset-0" />
        </div>

        {/* Blips */}
        <div className="rc-blip absolute left-[38%] top-[30%] h-2 w-2 rounded-full bg-[#F43F5E] shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
        <div className="rc-blip absolute right-[28%] top-[55%] h-1.5 w-1.5 rounded-full bg-[#7B68EE] shadow-[0_0_8px_rgba(123,104,238,0.9)]" style={{ animationDelay: '1.2s' }} />
        <div className="rc-blip absolute left-[26%] bottom-[30%] h-2 w-2 rounded-full bg-[#FB7185] shadow-[0_0_8px_rgba(251,113,133,0.9)]" style={{ animationDelay: '2.1s' }} />

        {/* Center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="rc-pulse absolute inset-0 rounded-full bg-[#FF6B9D]/40" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_12px_40px_-10px_rgba(244,63,94,0.6)]">
              <span className="text-3xl">🎲</span>
            </div>
          </div>
        </div>
      </div>

      <h1 className="text-[20px] font-extrabold text-[#1E293B] mb-1.5 text-center">Looking for your vibe…</h1>
      <p className="text-[13px] text-[#1E293B]/55 font-medium text-center max-w-[260px] leading-relaxed">
        {vibe
          ? <>Matching you with someone in the <span className="font-bold text-[#F43F5E]">{vibe}</span> mood.</>
          : 'Scanning for someone who wants to talk right now.'}
      </p>
      <p className="mt-3 rounded-full bg-white/80 border border-gray-200/80 px-4 py-1.5 text-[12px] font-semibold text-[#1E293B]/60">
        {onlineCount > 0 ? <>🔴 {onlineCount} people online right now</> : '🔴 A few people are looking too'}
      </p>

      <button
        onClick={() => { hapticLight(); onCancel(); }}
        disabled={busy}
        className="mt-10 rounded-full bg-white border border-gray-200 text-[#1E293B]/70 px-8 py-3 text-[14px] font-bold hover:bg-gray-50 active:scale-95 transition-all cursor-pointer disabled:opacity-60 shadow-2xs"
      >
        Cancel
      </button>
    </div>
  );
}
