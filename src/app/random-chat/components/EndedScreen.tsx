'use client';

import { GlassCard, PrimaryButton } from '@/app/components/shared';
import { hapticSuccess } from '@/app/lib/haptics';
import type { RandomChatSession } from '../types';

export function EndedScreen({
  session,
  onFindSomeoneNew,
  onGoHome,
  busy,
}: {
  session: RandomChatSession | null;
  onFindSomeoneNew: () => void;
  onGoHome: () => void;
  busy: boolean;
}) {
  const endedByMe = session?.endedByMe ?? null;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] flex flex-col items-center text-center">
      <div className="animate-bubble-enter w-full max-w-[320px]">
        <div className="h-16 w-16 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center text-3xl mb-5">
          {endedByMe === true ? '👋' : '💬'}
        </div>

        <h1 className="text-[22px] font-extrabold text-[#1E293B] mb-1.5">
          {endedByMe === true ? 'Conversation ended' : 'Your partner left'}
        </h1>
        <p className="text-[13px] text-[#1E293B]/55 font-medium leading-relaxed max-w-[260px] mx-auto">
          {endedByMe === true
            ? 'You stepped out. When you&apos;re ready, jump back in and meet someone new.'
            : 'The conversation ended before it took off. Someone else is out there waiting to match your vibe.'}
        </p>

        <div className="mt-8 space-y-2.5">
          <PrimaryButton onClick={() => { hapticSuccess(); onFindSomeoneNew(); }}>
            {busy ? 'Finding someone…' : 'Find someone new 🎲'}
          </PrimaryButton>
          <button
            onClick={onGoHome}
            className="w-full py-2.5 rounded-2xl text-[13px] font-bold text-[#1E293B]/45 hover:text-[#1E293B]/70 hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
