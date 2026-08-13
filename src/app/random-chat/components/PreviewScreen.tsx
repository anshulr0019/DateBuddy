'use client';

import { GlassCard, PrimaryButton } from '@/app/components/shared';
import { hapticLight, hapticSuccess } from '@/app/lib/haptics';
import type { RandomChatSession } from '../types';

function aliasEmoji(alias: string): string {
  const first = alias.trim().split(' ')[0];
  return first ?? '🎲';
}

function aliasName(alias: string): string {
  const parts = alias.trim().split(' ');
  return parts.slice(1).join(' ') || alias;
}

export function PreviewScreen({
  session,
  onStartChatting,
  onConnect,
  onEnd,
  busy,
  connected,
}: {
  session: RandomChatSession;
  onStartChatting: () => void;
  onConnect: () => void;
  onEnd: () => void;
  busy: boolean;
  connected: boolean;
}) {
  const partner = session.partner;
  const emoji = partner ? aliasEmoji(partner.alias) : '🎲';
  const name = partner ? aliasName(partner.alias) : 'Someone';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-6 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] flex flex-col items-center text-center">
      <div className="animate-bubble-enter w-full max-w-[320px]">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#1E293B]/40 mb-2">Anonymous match</p>

        <div className="relative mx-auto h-24 w-24 mb-5">
          <div className="rc-pulse absolute inset-0 rounded-full bg-[#7B68EE]/30" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#7B68EE] to-[#FF6B9D] text-white shadow-[0_12px_40px_-10px_rgba(123,104,238,0.6)] text-4xl">
            {emoji}
          </div>
        </div>

        <h1 className="text-[24px] font-extrabold text-[#1E293B]">{name}</h1>
        <p className="mt-1 text-[13px] text-[#1E293B]/55 font-medium">
          {partner?.age ? `${partner.age} · ` : ''}here to talk right now
        </p>

        {partner && partner.interests.length > 0 && (
          <div className="mt-6 text-left">
            <p className="text-[12.5px] font-bold uppercase tracking-wider text-[#1E293B]/45 mb-2">A little about them</p>
            <div className="flex flex-wrap gap-2">
              {partner.interests.map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-full bg-white border border-gray-200/80 text-[12px] font-bold text-[#1E293B]/70">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {partner && partner.sharedInterests.length > 0 && (
          <div className="mt-5 rounded-2xl bg-[#FFF0F4] border border-[#F9C0D0]/60 p-3.5">
            <p className="text-[12px] font-bold text-[#F43F5E] mb-1.5">
              You both vibe on
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {partner.sharedInterests.map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-white/90 border border-[#F9C0D0]/50 text-[11.5px] font-bold text-[#F43F5E]">
                  ✨ {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 space-y-2.5">
          <PrimaryButton onClick={() => { hapticSuccess(); onStartChatting(); }}>
            Start chatting
          </PrimaryButton>
          <button
            onClick={() => { hapticLight(); onConnect(); }}
            disabled={busy || connected}
            className="w-full py-3.5 rounded-2xl bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[14.5px] font-extrabold text-[#F43F5E] hover:bg-[#FDE3EA] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
          >
            {connected ? 'Connection requested ✓' : 'Maybe we connect? 💫'}
          </button>
          <button
            onClick={() => { hapticLight(); onEnd(); }}
            disabled={busy}
            className="w-full py-2.5 rounded-2xl text-[13px] font-bold text-[#1E293B]/45 hover:text-[#1E293B]/70 hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
          >
            Not feeling it — find someone else
          </button>
        </div>
      </div>
    </div>
  );
}
