'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ic } from '../../../components/icons';
import type { ChatMessage, Partner } from '../chatTypes';

const FOCUSABLE = 'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

/* Accessible modal shell: backdrop dismiss, Escape, focus trap, focus restore. */
function Sheet({
  label,
  onClose,
  children,
  backdropClass = 'bg-infyn-ink/50',
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
  backdropClass?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab' && panel) {
        const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        aria-hidden
        className={`absolute inset-0 ${backdropClass} animate-popover-enter`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative z-50 w-full max-w-[340px] animate-popover-enter"
      >
        {children}
      </div>
    </div>
  );
}

/* ── Fullscreen photo lightbox ── */
export function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-black/92 backdrop-blur-2xl animate-photo-backdrop p-4 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <button
        onClick={onClose}
        aria-label="Close photo viewer"
        className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-infyn-surface/15 border border-infyn-border/20 text-white hover:bg-infyn-surface/30 cursor-pointer active:scale-90 transition-all backdrop-blur-md shadow-lg z-30"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div className="w-full max-w-[460px] flex items-center justify-center animate-photo-zoom" onClick={e => e.stopPropagation()}>
        <img
          src={url}
          alt="Full size photo"
          onClick={onClose}
          className="max-h-[75vh] max-w-full object-contain rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-infyn-border/10"
        />
      </div>
    </div>
  );
}

/* ── Long-press message actions ── */
export function MessageActionSheet({
  message,
  isMine,
  onClose,
}: {
  message: ChatMessage;
  isMine: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(onClose, 700);
    } catch {
      onClose();
    }
  };

  return (
    <Sheet label="Message options" onClose={onClose}>
      <div className="flex flex-col items-center gap-3 w-full">
        <div
          className={`max-w-[90%] px-4 py-3 rounded-[22px] shadow-2xl border ${
            isMine
              ? 'bg-infyn-blush border-infyn-rose-line/80 text-infyn-ink rounded-tr-[4px]'
              : 'bg-infyn-surface border-infyn-border text-infyn-ink rounded-tl-[4px]'
          }`}
        >
          <p className="text-[15px] leading-relaxed font-normal break-words">{message.content}</p>
        </div>

        <div className="w-full rounded-2xl bg-infyn-surface/95 backdrop-blur-2xl border border-infyn-border/80 shadow-2xl divide-y divide-gray-100 overflow-hidden text-[14px] font-semibold text-infyn-ink">
          <button
            onClick={handleCopy}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-infyn-surface-soft active:bg-infyn-surface-soft transition-colors cursor-pointer"
          >
            <span>{copied ? 'Copied ✓' : 'Copy'}</span>
            <Ic.Copy className="w-4 h-4 text-infyn-secondary" />
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 flex items-center justify-center text-infyn-secondary hover:bg-infyn-surface-soft active:bg-infyn-surface-soft transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </Sheet>
  );
}

/* ── Safety: report & block ── */

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'fake', label: 'Fake profile' },
  { value: 'photos', label: 'Inappropriate photos' },
  { value: 'other', label: 'Something else' },
];

type SafetyView = 'menu' | 'report' | 'report-done' | 'block';

export type ConversationAction = { label: string; icon: React.ReactNode; onSelect: () => void };

export function SafetySheet({ partner, onClose, actions = [] }: { partner: Partner; onClose: () => void; actions?: ConversationAction[] }) {
  const router = useRouter();
  const [view, setView] = useState<SafetyView>('menu');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReport = useCallback(
    async (reason: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportedUserId: partner.partnerId, reason }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) throw new Error(data?.message || 'Could not submit report');
        setView('report-done');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not submit report');
      } finally {
        setBusy(false);
      }
    },
    [partner.partnerId]
  );

  const submitBlock = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: partner.partnerId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Could not block user');
      // Blocking deactivates the match server-side — leave the dead conversation.
      router.replace('/messages');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not block user');
      setBusy(false);
    }
  }, [partner.partnerId, router]);

  return (
    <Sheet label={`Options for conversation with ${partner.name}`} onClose={onClose}>
      <div className="w-full rounded-2xl bg-infyn-surface/95 backdrop-blur-2xl border border-infyn-border/80 shadow-2xl overflow-hidden">
        {view === 'menu' && (
          <div className="divide-y divide-infyn-border text-[15px] text-infyn-ink">
            <div className="px-4 py-3.5 text-center">
              <p className="font-display text-[19px]">{partner.name}</p>
            </div>
            {actions.map((action) => (
              <button
                key={action.label}
                onClick={() => { onClose(); action.onSelect(); }}
                className="w-full min-h-[52px] px-4 flex items-center gap-3 active:bg-infyn-surface-soft transition-colors cursor-pointer"
              >
                <span className="text-infyn-secondary [&_svg]:w-[18px] [&_svg]:h-[18px]" aria-hidden>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
            <button
              onClick={() => setView('report')}
              className="w-full min-h-[52px] px-4 flex items-center gap-3 active:bg-infyn-surface-soft transition-colors cursor-pointer"
            >
              <Ic.Flag className="w-[18px] h-[18px] text-infyn-secondary" />
              <span>Report {partner.name}</span>
            </button>
            <button
              onClick={() => setView('block')}
              className="w-full min-h-[52px] px-4 flex items-center gap-3 text-infyn-rose font-semibold active:bg-infyn-blush transition-colors cursor-pointer"
            >
              <Ic.Ban className="w-[18px] h-[18px]" />
              <span>Block {partner.name}</span>
            </button>
            <button
              onClick={onClose}
              className="w-full min-h-[52px] px-4 flex items-center justify-center text-infyn-secondary font-semibold active:bg-infyn-surface-soft transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {view === 'report' && (
          <div className="divide-y divide-gray-100 text-[14px] font-semibold text-infyn-ink">
            <div className="px-4 py-3 text-center">
              <p className="text-[15px] font-bold">Report {partner.name}</p>
              <p className="text-[12px] font-medium text-infyn-muted mt-0.5">
                Why are you reporting them? This stays anonymous.
              </p>
              {error && (
                <p role="alert" className="mt-1.5 text-[12px] font-semibold text-[#E11D48]">{error}</p>
              )}
            </div>
            {REPORT_REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => submitReport(r.value)}
                disabled={busy}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-infyn-surface-soft active:bg-infyn-surface-soft transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{r.label}</span>
              </button>
            ))}
            <button
              onClick={() => setView('menu')}
              className="w-full px-4 py-3 flex items-center justify-center text-infyn-secondary hover:bg-infyn-surface-soft transition-colors cursor-pointer"
            >
              Back
            </button>
          </div>
        )}

        {view === 'report-done' && (
          <div className="px-5 py-6 text-center">
            <span className="mx-auto mb-3 h-12 w-12 grid place-items-center rounded-full bg-infyn-blush text-infyn-rose" aria-hidden>
              <Ic.Shield className="w-5 h-5" />
            </span>
            <p className="font-display text-[20px] text-infyn-ink mb-1">Thanks for letting us know</p>
            <p className="text-[13px] text-infyn-secondary mb-4">
              Our team will review your report. You can also block {partner.name} so they can&apos;t contact you.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setView('block')}
                className="w-full py-2.5 rounded-xl bg-infyn-rose text-white text-[13px] font-bold hover:bg-[#E11D48] active:scale-95 transition-all cursor-pointer"
              >
                Block {partner.name}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-infyn-secondary text-[13px] font-semibold hover:bg-infyn-surface-soft transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {view === 'block' && (
          <div className="px-5 py-6 text-center">
            <p className="text-[28px] mb-2" aria-hidden>🚫</p>
            <p className="text-[15px] font-bold text-infyn-ink mb-1">Block {partner.name}?</p>
            <p className="text-[13px] text-infyn-secondary mb-4">
              They won&apos;t be able to message you, and this conversation will be closed. They won&apos;t be notified.
            </p>
            {error && (
              <p role="alert" className="mb-2 text-[12px] font-semibold text-[#E11D48]">{error}</p>
            )}
            <div className="flex flex-col gap-2">
              <button
                onClick={submitBlock}
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-bold hover:bg-red-700 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
              >
                {busy ? 'Blocking…' : `Block ${partner.name}`}
              </button>
              <button
                onClick={() => setView('menu')}
                disabled={busy}
                className="w-full py-2.5 rounded-xl text-infyn-secondary text-[13px] font-semibold hover:bg-infyn-surface-soft transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
