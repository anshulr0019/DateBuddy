'use client';

import React from 'react';

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '✨'];

interface MessageReactionsOverlayProps {
  isOpen: boolean;
  messageId: string;
  isMine: boolean;
  messageContent: string;
  onReact: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
  onClose: () => void;
}

export function MessageReactionsOverlay({
  isOpen,
  messageId,
  isMine,
  messageContent,
  onReact,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[320px] flex flex-col items-center gap-3 animate-popover-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating WhatsApp-Style Emoji Pill */}
        <div
          className="flex items-center gap-1.5 p-2 rounded-full shadow-[0_12px_32px_-6px_rgba(0,0,0,0.35)] border border-white/20 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(30,24,40,0.92) 0%, rgba(18,16,24,0.95) 100%)',
          }}
        >
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(messageId, emoji);
                onClose();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[22px] hover:scale-125 active:scale-95 transition-transform cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Message Quick Actions Card */}
        <div
          className="w-full rounded-[22px] p-2 shadow-xl border border-white/15 backdrop-blur-xl overflow-hidden divide-y divide-white/10"
          style={{
            background: 'linear-gradient(145deg, rgba(30,24,40,0.92) 0%, rgba(18,16,24,0.95) 100%)',
          }}
        >
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-semibold text-white/90 hover:bg-white/10 transition-colors cursor-pointer rounded-xl"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>Copy Text</span>
          </button>

          {isMine && onDelete && (
            <button
              type="button"
              onClick={() => {
                onDelete(messageId);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[14px] font-semibold text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer rounded-xl"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Delete Message</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
