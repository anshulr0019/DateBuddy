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
  backdropClass = 'bg-slate-950/45 backdrop-blur-md',
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
        className="absolute top-5 right-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 border border-white/20 text-white hover:bg-white/30 cursor-pointer active:scale-90 transition-all backdrop-blur-md shadow-lg z-30"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div className="w-full max-w-[460px] flex items-center justify-center animate-photo-zoom" onClick={e => e.stopPropagation()}>
        <img
          src={url}
          alt="Full size photo"
          onClick={onClose}
          className="max-h-[75vh] max-w-full object-contain rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10"
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
              ? 'bg-[#FFF0F4] border-[#F9C0D0]/80 text-[#2D1B28] rounded-tr-[4px]'
              : 'bg-white border-gray-200 text-[#1E293B] rounded-tl-[4px]'
          }`}
        >
          <p className="text-[15px] leading-relaxed font-normal break-words">{message.content}</p>
        </div>

        <div className="w-full rounded-2xl bg-white/95 backdrop-blur-2xl border border-gray-200/80 shadow-2xl divide-y divide-gray-100 overflow-hidden text-[14px] font-semibold text-[#1E293B]">
          <button
            onClick={handleCopy}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
          >
            <span>{copied ? 'Copied ✓' : 'Copy'}</span>
            <Ic.Copy className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 flex items-center justify-center text-gray-500 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
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

type SafetyView = 'menu' | 'report' | 'report-done' | 'block' | 'encryption';

export function SafetySheet({ partner, onClose }: { partner: Partner; onClose: () => void }) {
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
    <Sheet label={`Safety options for ${partner.name}`} onClose={onClose}>
      <div className="w-full rounded-2xl bg-white/95 backdrop-blur-2xl border border-gray-200/80 shadow-2xl overflow-hidden">
        {view === 'menu' && (
          <div className="divide-y divide-gray-100 text-[14px] font-semibold text-[#1E293B]">
            <div className="px-4 py-3 text-center">
              <p className="text-[15px] font-bold">{partner.name}</p>
              <p className="text-[12px] font-medium text-gray-400 mt-0.5">Privacy &amp; Safety Controls</p>
            </div>
            <button
              onClick={() => setView('encryption')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer text-emerald-700"
            >
              <div className="flex items-center gap-2">
                <span>🔒</span>
                <span>End-to-End Encryption</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Verified</span>
            </button>
            <button
              onClick={() => setView('report')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
            >
              <span>Report {partner.name}</span>
              <Ic.Flag className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setView('block')}
              className="w-full px-4 py-3 flex items-center justify-between text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer"
            >
              <span>Block {partner.name}</span>
              <Ic.Ban className="w-4 h-4 text-red-600" />
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {view === 'encryption' && (
          <div className="p-5 text-center space-y-3.5">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-2xl flex items-center justify-center mx-auto shadow-sm">
              🔒
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#1E293B]">End-to-End Encrypted</h3>
              <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                Messages, voice notes, photos, and live calls between you and {partner.name} are secured with 256-bit encryption.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 text-left space-y-1.5 text-[11.5px] text-gray-600">
              <div className="flex items-center gap-1.5 font-bold text-gray-800">
                <span>🛡️</span>
                <span>Anti-Harassment Shield</span>
              </div>
              <p className="text-[11px] leading-tight">Screenshots and sensitive media are strictly monitored. Your safety is our #1 priority.</p>
            </div>
            <button
              onClick={() => setView('menu')}
              className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#1E293B] font-bold text-[13px] transition-all cursor-pointer"
            >
              Back to Options
            </button>
          </div>
        )}

        {view === 'report' && (
          <div className="divide-y divide-gray-100 text-[14px] font-semibold text-[#1E293B]">
            <div className="px-4 py-3 text-center">
              <p className="text-[15px] font-bold">Report {partner.name}</p>
              <p className="text-[12px] font-medium text-gray-400 mt-0.5">
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
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{r.label}</span>
              </button>
            ))}
            <button
              onClick={() => setView('menu')}
              className="w-full px-4 py-3 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Back
            </button>
          </div>
        )}

        {view === 'report-done' && (
          <div className="px-5 py-6 text-center">
            <p className="text-[28px] mb-2" aria-hidden>🛡️</p>
            <p className="text-[15px] font-bold text-[#1E293B] mb-1">Thanks for letting us know</p>
            <p className="text-[13px] text-gray-500 mb-4">
              Our team will review your report. You can also block {partner.name} so they can&apos;t contact you.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setView('block')}
                className="w-full py-2.5 rounded-xl bg-[#F43F5E] text-white text-[13px] font-bold hover:bg-[#E11D48] active:scale-95 transition-all cursor-pointer"
              >
                Block {partner.name}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-gray-500 text-[13px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {view === 'block' && (
          <div className="px-5 py-6 text-center">
            <p className="text-[28px] mb-2" aria-hidden>🚫</p>
            <p className="text-[15px] font-bold text-[#1E293B] mb-1">Block {partner.name}?</p>
            <p className="text-[13px] text-gray-500 mb-4">
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
                className="w-full py-2.5 rounded-xl text-gray-500 text-[13px] font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
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
