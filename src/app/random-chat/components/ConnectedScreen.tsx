'use client';

import { GlassCard } from '@/app/components/shared';
import { SafeImage } from '@/app/components/shared';
import { hapticSuccess } from '@/app/lib/haptics';
import type { RandomChatSession } from '../types';

export function ConnectedScreen({
  session,
  onGoToChat,
  onFindSomeoneNew,
  onGoHome,
  busy,
}: {
  session: RandomChatSession;
  onGoToChat: () => void;
  onFindSomeoneNew: () => void;
  onGoHome: () => void;
  busy?: boolean;
}) {
  const match = session.match;
  const partner = session.partner;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] flex flex-col items-center text-center">
      <div className="animate-bubble-enter w-full max-w-[320px]">
        <div className="mb-3 text-[#F43F5E] text-xs font-extrabold tracking-wider uppercase">ANONYMOUS CONNECTION</div>

        <div className="relative mx-auto h-28 w-28 mb-5">
          <div className="rc-pulse absolute inset-0 rounded-full bg-[#FF6B9D]/35" />
          <div className="rc-pulse absolute inset-0 rounded-full bg-[#7B68EE]/25" style={{ animationDelay: '0.4s' }} />
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-lg">
            {match?.partnerPhoto ? (
              <SafeImage src={match.partnerPhoto} name={match.partnerName} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7B68EE] to-[#FF6B9D] text-white text-4xl font-black">
                {partner?.alias.replace(/^User\s+/i, '').replace(/^Partner\s+/i, '').trim()[0]?.toUpperCase() ?? 'A'}
              </div>
            )}
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0F4] border border-[#F9C0D0]/60 px-3 py-1 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#F43F5E" stroke="none">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span className="text-[11px] font-bold text-[#F43F5E]">It&apos;s a Match</span>
        </div>

        <h1 className="text-[23px] font-extrabold text-[#1E293B]">
          You connected with {match?.partnerName ?? 'your match'}
        </h1>
        <p className="mt-1.5 text-[13px] text-[#1E293B]/55 font-medium leading-relaxed">
          {match?.partnerCity ? `${match.partnerName ?? 'They'} is in ${match.partnerCity}.` : 'You can now talk with your real identity.'}{' '}
          Keep the conversation going in your chats, or search for someone new on radar.
        </p>

        <div className="mt-7 space-y-2.5">
          <button
            onClick={() => { hapticSuccess(); onGoToChat(); }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white text-[14.5px] font-extrabold shadow-[0_12px_32px_-10px_rgba(123,104,238,0.55)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Continue in Chat</span>
          </button>

          <button
            onClick={() => { hapticSuccess(); onFindSomeoneNew(); }}
            disabled={busy}
            className="w-full py-3 rounded-2xl bg-white border border-gray-200/80 text-[#1E293B] text-[13.5px] font-bold shadow-xs hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B68EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span>{busy ? 'Starting search…' : 'Find Someone Else on Radar'}</span>
          </button>

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
