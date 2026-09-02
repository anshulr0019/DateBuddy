'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { GlassCard } from '@/app/components/shared';
import { formatClock } from '@/app/lib/time';
import { hapticLight, hapticSuccess, hapticWarning } from '@/app/lib/haptics';
import { REPORT_REASONS, SAFETY_CHECK_AFTER_MESSAGES } from '@/lib/random-chat-config';
import type { RandomChatSession } from '../types';
import type { ConnectionState } from '../useRandomChat';

export function AnonymousChat({
  session,
  messages,
  connection,
  myAlias,
  pending,
  onSend,
  onSetConnection,
  onEnd,
  onReport,
  onBlock,
  busy,
  error,
}: {
  session: RandomChatSession;
  messages: Array<{ idKey: string; senderIsMe: boolean; content: string; createdAt: string }>;
  connection: ConnectionState;
  myAlias: string;
  pending: string | null;
  onSend: (content: string) => void;
  onSetConnection: (want: boolean) => void;
  onEnd: () => void;
  onReport: (reason: string, details?: string | null) => void;
  onBlock: () => void;
  busy: boolean;
  error: string | null;
}) {
  const [input, setInput] = useState('');
  const [showSheets, setShowSheets] = useState(false);
  const [sheetKind, setSheetKind] = useState<'menu' | 'report' | 'block' | 'end' | 'safety' | null>(null);
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState('');
  const [safetyDismissed, setSafetyDismissed] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const partner = session.partner;
  const rawAlias = partner?.alias ?? '';
  const initialLetter = rawAlias.replace(/^User\s+/i, '').replace(/^Partner\s+/i, '').trim()[0]?.toUpperCase() || 'A';
  const partnerName = partner ? `User ${initialLetter}` : 'Your partner';

  const feedItems = useMemo(() => {
    let prevSenderIsMe: boolean | null = null;
    return messages.map((m) => {
      const showHeader = prevSenderIsMe !== m.senderIsMe;
      prevSenderIsMe = m.senderIsMe;
      return { ...m, showHeader };
    });
  }, [messages]);

  useEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTo({ top: feed.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    // One-time safety nudge after enough messages exchanged.
    if (!safetyDismissed && session.messages.length >= SAFETY_CHECK_AFTER_MESSAGES) {
      setSheetKind('safety');
    }
  }, [session.messages.length, safetyDismissed]);

  const sendNow = () => {
    const text = input.trim();
    if (!text || pending) return;
    onSend(text);
    setInput('');
    inputRef.current?.focus();
  };

  const closeSheets = () => {
    setShowSheets(false);
    setSheetKind(null);
  };

  const openSheet = (kind: NonNullable<typeof sheetKind>) => {
    hapticLight();
    setSheetKind(kind);
    setShowSheets(true);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-10 w-10 flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7B68EE] to-[#FF6B9D] text-white text-[16px] font-black shadow-2xs">
              {initialLetter}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#22C55E] border-2 border-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-[#1E293B] leading-tight truncate">{partnerName}</h1>
            <p className="text-[11px] text-[#1E293B]/50 font-medium truncate">
              {partner?.age ? `${partner.age} years · ` : ''}anonymous conversation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openSheet('menu')}
            aria-label="Conversation options"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100/90 text-[#1E293B] hover:bg-gray-200 active:scale-90 transition-all cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="1.5" /><circle cx="6" cy="12" r="1.5" /><circle cx="18" cy="12" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Connection banner */}
      {connection.requestedByMe && !connection.isMutual && (
        <div className="flex-shrink-0 px-4 py-2 bg-[#FFF0F4] border-b border-[#F9C0D0]/50 text-center">
          <span className="text-[12px] font-semibold text-[#F43F5E]">
            Connection request sent — waiting for {partnerName} to accept…
          </span>
        </div>
      )}
      {connection.requestedByPartner && !connection.requestedByMe && (
        <div className="flex-shrink-0 px-4 py-2 bg-emerald-50 border-b border-emerald-200/60 flex items-center justify-between gap-2">
          <span className="text-[12px] font-semibold text-emerald-700 flex-1">
            {partnerName} wants to connect with you
          </span>
          <button
            onClick={() => { hapticSuccess(); onSetConnection(true); }}
            disabled={busy}
            className="rounded-full bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
          >
            Accept
          </button>
        </div>
      )}

      {error && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-b border-red-200/60 text-center">
          <span className="text-[12px] font-semibold text-red-600">{error}</span>
        </div>
      )}

      {/* Feed */}
      <div
        ref={feedRef}
        role="log"
        aria-label="Anonymous conversation"
        className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-4 pb-3 space-y-2.5"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#F43F5E] mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-[17px] font-bold text-[#1E293B] mb-1">You matched with {partnerName}</h2>
            <p className="text-[13px] text-[#1E293B]/55 max-w-[250px] leading-relaxed mb-5">
              You&apos;re both anonymous. Break the ice with one of these — or send your own.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-[280px]">
              {session.icebreakers.map((line) => (
                <button
                  key={line}
                  onClick={() => { setInput(line); inputRef.current?.focus(); }}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white/80 border border-[#F9C0D0]/50 text-[13px] font-semibold text-[#2D1B28] hover:bg-[#FFF0F4] active:scale-95 transition-all cursor-pointer shadow-2xs"
                >
                  {line}
                </button>
              ))}
            </div>
          </div>
        )}

        {feedItems.map((m) => (
          <div key={m.idKey} className={`flex ${m.senderIsMe ? 'justify-end' : 'justify-start'} ${m.idKey.startsWith('local-') ? 'opacity-80' : ''}`}>
            <div className={`max-w-[78%] ${m.senderIsMe ? 'items-end' : 'items-start'} flex flex-col`}>
              {m.showHeader && (
                <span className={`mb-1 px-1 text-[10px] font-bold ${m.senderIsMe ? 'text-right text-[#F43F5E]/70' : 'text-[#7B68EE]/70'}`}>
                  {m.senderIsMe ? 'You' : myAlias.split(' ')[0]}
                </span>
              )}
              <div
                className={`px-3.5 py-2.5 rounded-[18px] text-[14px] leading-snug break-words ${
                  m.senderIsMe
                    ? 'bg-gradient-to-br from-[#F43F5E] to-[#FB7185] text-white rounded-br-[6px] shadow-2xs'
                    : 'bg-white border border-gray-200/70 text-[#1E293B] rounded-bl-[6px] shadow-2xs'
                }`}
              >
                {m.content}
              </div>
              <span className="mt-0.5 px-1 text-[9.5px] text-[#1E293B]/35">{formatClock(m.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Connect bar */}
      <div className="flex-shrink-0 px-4 pb-2 pt-1">
        {connection.isMutual ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12.5px] font-bold text-center py-2.5">
            You two are connected!
          </div>
        ) : (
          <button
            onClick={() => { hapticLight(); onSetConnection(!connection.requestedByMe); }}
            disabled={busy}
            className={`w-full py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer disabled:opacity-60 ${
              connection.requestedByMe
                ? 'bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#F43F5E]'
                : 'bg-gradient-to-r from-[#7B68EE] to-[#FF6B9D] text-white shadow-2xs'
            }`}
          >
            {connection.requestedByMe ? 'Connection Requested' : 'Request Connection'}
          </button>
        )}
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-1.5 flex items-center gap-2 bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/95 to-transparent">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNow(); } }}
          placeholder={`Message ${myAlias.split(' ')[0]}…`}
          maxLength={4000}
          className="flex-1 min-w-0 rounded-full bg-white border border-gray-200 px-4 py-2.5 text-[14px] outline-none focus:border-[#F43F5E]"
          aria-label="Type a message"
        />
        <button
          onClick={sendNow}
          disabled={!input.trim() || Boolean(pending)}
          aria-label="Send message"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F43F5E] to-[#FB7185] text-white shadow-2xs active:scale-90 transition-all cursor-pointer disabled:opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
        </button>
      </div>

      {/* Sheets */}
      {showSheets && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center overflow-hidden">
          <div onClick={closeSheets} className="absolute inset-0 bg-black/45 backdrop-blur-md" />
          <div className="relative z-10 w-full max-w-[420px] bg-white rounded-t-[28px] sm:rounded-[24px] max-h-[82dvh] flex flex-col shadow-2xl animate-sheet-up">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 flex-shrink-0" />

            {sheetKind === 'menu' && (
              <>
                <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
                  <h3 className="text-[16px] font-extrabold text-[#1E293B]">Conversation options</h3>
                  <p className="text-[12px] text-[#1E293B]/50">This chat is anonymous.</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-none p-2 space-y-1">
                  <button onClick={() => openSheet('report')} className="w-full flex items-center gap-3 rounded-2xl p-3 hover:bg-gray-50 transition-all cursor-pointer">
                    <span className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </span>
                    <div className="text-left"><p className="text-[14px] font-bold text-[#1E293B]">Report {myAlias.split(' ')[0]}</p><p className="text-[11.5px] text-[#1E293B]/50">Flag inappropriate behaviour</p></div>
                  </button>
                  <button onClick={() => openSheet('block')} className="w-full flex items-center gap-3 rounded-2xl p-3 hover:bg-gray-50 transition-all cursor-pointer">
                    <span className="h-9 w-9 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                    </span>
                    <div className="text-left"><p className="text-[14px] font-bold text-[#1E293B]">Block &amp; end chat</p><p className="text-[11.5px] text-[#1E293B]/50">You won&apos;t match with them again</p></div>
                  </button>
                  <button onClick={() => openSheet('end')} className="w-full flex items-center gap-3 rounded-2xl p-3 hover:bg-gray-50 transition-all cursor-pointer">
                    <span className="h-9 w-9 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                    </span>
                    <div className="text-left"><p className="text-[14px] font-bold text-[#1E293B]">End conversation</p><p className="text-[11.5px] text-[#1E293B]/50">Move on to a new person</p></div>
                  </button>
                </div>
              </>
            )}

            {sheetKind === 'report' && (
              <>
                <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
                  <h3 className="text-[16px] font-extrabold text-[#1E293B]">Report this person</h3>
                  <p className="text-[12px] text-[#1E293B]/50">Reports go to our review team.</p>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-3 space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReportReason(r)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                        reportReason === r ? 'bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#F43F5E]' : 'bg-gray-50 border border-transparent text-[#1E293B]/70'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Add details (optional)"
                    maxLength={1000}
                    className="w-full mt-2 rounded-xl bg-gray-50 border border-gray-200 px-3.5 py-2.5 text-[13px] outline-none focus:border-[#F43F5E] resize-none"
                    rows={3}
                  />
                </div>
                <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100 flex gap-2">
                  <button onClick={closeSheets} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-[13px] font-bold cursor-pointer">Back</button>
                  <button
                    onClick={() => { hapticWarning(); onReport(reportReason, reportDetails.trim() || null); closeSheets(); }}
                    disabled={busy}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-bold cursor-pointer disabled:opacity-60"
                  >
                    Submit report
                  </button>
                </div>
              </>
            )}

            {sheetKind === 'block' && (
              <div className="p-5 space-y-4">
                <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-[17px] font-extrabold text-[#1E293B]">Block {myAlias.split(' ')[0]}?</h3>
                  <p className="text-[12.5px] text-gray-500 mt-1">They won&apos;t be matched with you again, and this chat will end.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={closeSheets} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-[13px] font-bold cursor-pointer">Cancel</button>
                  <button
                    onClick={() => { hapticWarning(); onBlock(); closeSheets(); }}
                    disabled={busy}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-bold cursor-pointer disabled:opacity-60"
                  >
                    Block
                  </button>
                </div>
              </div>
            )}

            {sheetKind === 'end' && (
              <div className="p-5 space-y-4">
                <div className="h-12 w-12 rounded-full bg-gray-100 text-gray-500 mx-auto flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-[17px] font-extrabold text-[#1E293B]">End this conversation?</h3>
                  <p className="text-[12.5px] text-gray-500 mt-1">You&apos;ll be matched with someone new.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={closeSheets} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-[13px] font-bold cursor-pointer">Cancel</button>
                  <button
                    onClick={() => { onEnd(); closeSheets(); }}
                    disabled={busy}
                    className="flex-1 py-2.5 rounded-xl bg-[#F43F5E] text-white text-[13px] font-bold cursor-pointer disabled:opacity-60"
                  >
                    End chat
                  </button>
                </div>
              </div>
            )}

            {sheetKind === 'safety' && (
              <div className="p-5 space-y-4">
                <div className="h-12 w-12 rounded-full bg-[#FFF0F4] text-[#F43F5E] mx-auto flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-[17px] font-extrabold text-[#1E293B]">Quick safety check</h3>
                  <p className="text-[12.5px] text-gray-500 mt-1">
                    Remember: you&apos;re talking to a stranger. Never share your address, bank details, or private photos.
                    You can report or block anytime.
                  </p>
                </div>
                <button
                  onClick={() => { setSafetyDismissed(true); closeSheets(); }}
                  className="w-full py-3 rounded-xl bg-[#F43F5E] text-white text-[13px] font-bold cursor-pointer"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
