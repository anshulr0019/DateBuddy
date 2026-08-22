'use client';

import React from 'react';

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '✨'];

interface MessageReactionsOverlayProps {
  isOpen: boolean;
  messageId: string;
  isMine: boolean;
  messageContent: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onClose: () => void;
}

export function MessageReactionsOverlay({
  isOpen,
  messageId,
  isMine,
  messageContent,
  onReact,
  onReply,
  onDelete,
  onClose,
}: MessageReactionsOverlayProps) {
  if (!isOpen) return null;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(messageContent);
    } catch {
      /* ignore */
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[320px] flex flex-col items-center gap-3 animate-popover-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* WhatsApp-Style Floating Reaction Bar */}
        <div className="flex items-center gap-1.5 p-2 rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.6)] border border-white/[0.08] bg-[#0D0D11]/95 backdrop-blur-2xl">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(messageId, emoji);
                onClose();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[21px] hover:scale-125 active:scale-95 transition-transform cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Action Menu Card */}
        <div className="w-full rounded-[22px] p-1.5 shadow-2xl border border-white/[0.08] bg-[#0D0D11]/95 backdrop-blur-2xl overflow-hidden divide-y divide-white/[0.06]">
          {onReply && (
            <button
              type="button"
              onClick={() => {
                onReply(messageId);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-white/90 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer rounded-xl"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#F43F5E]">
                <polyline points="9 17 4 12 9 7" />
                <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
              </svg>
              <span>Reply to message</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-white/80 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer rounded-xl"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>Copy text</span>
          </button>

          {isMine && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(messageId);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[13.5px] font-medium text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer rounded-xl"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Delete message</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
