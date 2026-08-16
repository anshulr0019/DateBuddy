'use client';

import { GlassCard } from '@/app/components/shared';
import { SafeImage } from '@/app/components/shared';
import { hapticSuccess } from '@/app/lib/haptics';
import type { RandomChatSession } from '../types';

export function ConnectedScreen({
  session,
  onGoToChat,
  onGoHome,
}: {
  session: RandomChatSession;
  onGoToChat: () => void;
  onGoHome: () => void;
}) {
  const match = session.match;
  const partner = session.partner;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-6 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] flex flex-col items-center text-center">
      <div className="animate-bubble-enter w-full max-w-[320px]">
        <div className="mb-3 text-[#F43F5E] text-sm font-bold">ANONYMOUS MATCH</div>

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

        <div className="inline-flex items-center gap-1 rounded-full bg-[#FFF0F4] border border-[#F9C0D0]/60 px-3 py-1 mb-3">
          <span className="text-[11px] font-bold text-[#F43F5E]">It&apos;s a match!</span>
        </div>

        <h1 className="text-[24px] font-extrabold text-[#1E293B]">
          You connected with {match?.partnerName ?? 'someone new'} 🎉
        </h1>
        <p className="mt-1.5 text-[13px] text-[#1E293B]/55 font-medium leading-relaxed">
          {match?.partnerCity ? `${match.partnerName ?? 'They'} is in ${match.partnerCity}.` : 'You can now talk with your real identity.'}{' '}
          Keep the conversation going as yourselves.
        </p>

        <div className="mt-7 space-y-2.5">
          <button
            onClick={() => { hapticSuccess(); onGoToChat(); }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white text-[15px] font-extrabold shadow-[0_12px_32px_-10px_rgba(123,104,238,0.55)] active:scale-[0.98] transition-all cursor-pointer"
          >
            Continue the chat →
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
