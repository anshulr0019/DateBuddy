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
        <div className="h-16 w-16 rounded-2xl bg-infyn-surface-soft/90 text-infyn-secondary mx-auto flex items-center justify-center mb-5">
          {endedByMe === true ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          )}
        </div>

        <h1 className="text-[22px] font-normal text-infyn-ink mb-1.5 font-display">
          {endedByMe === true ? 'Conversation ended' : 'Your partner left'}
        </h1>
        <p className="text-[13px] text-infyn-ink/55 font-medium leading-relaxed max-w-[260px] mx-auto">
          {endedByMe === true
            ? 'You stepped out. When you&apos;re ready, jump back in and meet someone new.'
            : 'The conversation ended before it took off. Someone else is out there waiting to match your vibe.'}
        </p>

        <div className="mt-8 space-y-2.5">
          <button
            onClick={() => { hapticSuccess(); onFindSomeoneNew(); }}
            disabled={busy}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-infyn-rose via-infyn-rose to-infyn-rose text-white text-[14.5px] font-extrabold shadow-[0_12px_32px_-10px_rgba(32,26,22,0.16)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span>{busy ? 'Finding someone…' : 'Find Someone Else on Radar'}</span>
          </button>
          <button
            onClick={onGoHome}
            className="w-full py-2.5 rounded-2xl text-[13px] font-bold text-infyn-ink/45 hover:text-infyn-ink/70 hover:bg-infyn-surface-soft active:scale-[0.98] transition-all cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
