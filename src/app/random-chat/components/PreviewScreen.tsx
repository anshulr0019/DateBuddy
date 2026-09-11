'use client';

import { GlassCard, PrimaryButton } from '@/app/components/shared';
import { hapticLight, hapticSuccess } from '@/app/lib/haptics';
import type { RandomChatSession } from '../types';

function getInitialLetter(alias?: string | null): string {
  if (!alias) return '?';
  const clean = alias.replace(/^User\s+/i, '').replace(/^Partner\s+/i, '').trim();
  return (clean[0] || 'A').toUpperCase();
}

function getDisplayName(alias?: string | null): string {
  if (!alias) return 'Anonymous';
  const initial = getInitialLetter(alias);
  return `User ${initial}`;
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
  const initial = getInitialLetter(partner?.alias);
  const name = getDisplayName(partner?.alias);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-6 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] flex flex-col items-center text-center">
      <div className="animate-bubble-enter w-full max-w-[320px]">
        <p className="text-[11px] font-bold uppercase tracking-widest text-infyn-ink/40 mb-2">Anonymous match</p>

        <div className="relative mx-auto h-24 w-24 mb-5">
          <div className="rc-pulse absolute inset-0 rounded-full bg-infyn-rose/30" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-infyn-rose to-infyn-rose text-white shadow-[0_12px_40px_-10px_rgba(32,26,22,0.16)] text-4xl font-black">
            {initial}
          </div>
        </div>

        <h1 className="text-[24px] font-normal text-infyn-ink font-display">{name}</h1>
        <p className="mt-1 text-[13px] text-infyn-ink/55 font-medium">
          {partner?.age ? `${partner.age} · ` : ''}here to talk right now
        </p>


        {partner && partner.interests.length > 0 && (
          <div className="mt-6 text-left">
            <p className="text-[12.5px] font-bold uppercase tracking-wider text-infyn-ink/45 mb-2">A little about them</p>
            <div className="flex flex-wrap gap-2">
              {partner.interests.map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-full bg-infyn-surface border border-infyn-border/80 text-[12px] font-bold text-infyn-ink/70">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {partner && partner.sharedInterests.length > 0 && (
          <div className="mt-5 rounded-2xl bg-infyn-blush border border-infyn-rose-line/60 p-3.5">
            <p className="text-[12px] font-bold text-infyn-rose mb-1.5">
              You both vibe on
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {partner.sharedInterests.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-infyn-surface/90 border border-infyn-rose-line/50 text-[11.5px] font-bold text-infyn-rose">
                  <span className="text-infyn-rose/60 text-[10px]">#</span>
                  <span>{tag}</span>
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
            className="w-full py-3.5 rounded-2xl bg-infyn-blush border border-infyn-rose-line/60 text-[14.5px] font-extrabold text-infyn-rose hover:bg-infyn-blush active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
          >
            {connected ? 'Connection Requested' : 'Request Connection'}
          </button>
          <button
            onClick={() => { hapticLight(); onEnd(); }}
            disabled={busy}
            className="w-full py-2.5 rounded-2xl text-[13px] font-bold text-infyn-ink/45 hover:text-infyn-ink/70 hover:bg-infyn-surface-soft active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
          >
            Not feeling it — find someone else
          </button>
        </div>
      </div>
    </div>
  );
}
