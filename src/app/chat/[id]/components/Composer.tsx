'use client';

import React, { useRef } from 'react';
import { Ic } from '../../../components/icons';
import type { ReplyTarget } from '../chatTypes';
import chatStyles from '../chat.module.css';

const EMOJI_RECENT = ['❤️', '🥰', '😂', '🤗', '😅', '🔥', '✨', '☕'];
const EMOJI_SMILEYS = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗',
  '😙', '😚', '☺️', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮',
  '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑',
];

export function EmojiDrawer({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className={`${chatStyles.drawer} z-30 px-3.5 py-2.5 max-h-[200px] animate-popover-enter flex flex-col gap-2`}>
      <div className="flex-1 overflow-y-auto scrollbar-none space-y-2 pr-0.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-infyn-muted mb-1">Recent</p>
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_RECENT.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onPick(emoji)}
                aria-label={`Insert ${emoji}`}
                className="h-7 w-7 text-[18px] hover:scale-125 active:scale-95 transition-transform flex items-center justify-center cursor-pointer rounded-lg hover:bg-infyn-surface-soft"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-infyn-muted mb-1">Smileys &amp; People</p>
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_SMILEYS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => onPick(emoji)}
                aria-label={`Insert ${emoji}`}
                className="h-7 w-7 text-[18px] hover:scale-125 active:scale-95 transition-transform flex items-center justify-center cursor-pointer rounded-lg hover:bg-infyn-surface-soft"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onPickFile: (file: File) => void;
  emojiOpen: boolean;
  onToggleEmoji: () => void;
  gifOpen: boolean;
  onToggleGif: () => void;
  onFocusInput: () => void;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  replyingTo?: ReplyTarget | null;
  onCancelReply?: () => void;
}

export function Composer({
  value,
  onChange,
  onSend,
  onPickFile,
  emojiOpen,
  onToggleEmoji,
  gifOpen,
  onToggleGif,
  onFocusInput,
  error,
  inputRef,
  replyingTo,
  onCancelReply,
}: ComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSend = value.trim().length > 0;

  return (
    <div className={chatStyles.composer}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPickFile(file);
          e.target.value = '';
        }}
      />

      {/* WhatsApp-Style Quoted Reply Preview */}
      {replyingTo && (
        <div className={`${chatStyles.replyPreview} mb-2.5 flex items-center justify-between gap-2.5 rounded-2xl px-3.5 py-2 shadow-2xs animate-slide-down`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-infyn-rose to-infyn-rose" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-infyn-rose">
                  <polyline points="9 17 4 12 9 7" />
                  <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                </svg>
                <p className="text-[11.5px] font-bold text-infyn-rose truncate">
                  Replying to {replyingTo.senderName}
                </p>
              </div>
              <p className="text-[12px] text-infyn-secondary truncate font-normal mt-0.5">
                {replyingTo.type === 'photo'
                  ? '📷 Photo'
                  : replyingTo.type === 'gif'
                  ? '🎞️ GIF'
                  : replyingTo.type === 'voice'
                  ? '🎤 Voice note'
                  : replyingTo.type === 'location'
                  ? '📍 Location'
                  : replyingTo.content}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-infyn-surface-soft/80 hover:bg-infyn-surface-soft text-infyn-secondary active:scale-95 transition-all flex-shrink-0 cursor-pointer text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className={`${chatStyles.composerError} mb-2 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold`}>
          <Ic.Alert className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}

      <div className={chatStyles.composerRow}>
        {/* Camera */}
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach a photo"
          className={chatStyles.composerButton}
        >
          <Ic.Camera className="w-5 h-5" />
        </button>

        {/* Text input */}
        <div className={`${chatStyles.composerInputShell} relative flex-1 flex items-center h-10 px-4 transition-all duration-200`}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocusInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) onSend();
            }}
            placeholder={replyingTo ? `Reply to ${replyingTo.senderName}…` : 'Message…'}
            aria-label="Message"
            enterKeyHint="send"
            autoComplete="off"
            className={`${chatStyles.composerInput} w-full bg-transparent placeholder-infyn-muted outline-none pr-7`}
          />
          <button
            onClick={onToggleEmoji}
            aria-label={emojiOpen ? 'Close emoji picker' : 'Open emoji picker'}
            aria-expanded={emojiOpen}
            className={`absolute right-3 p-1 hover:scale-110 active:scale-95 transition-transform duration-150 cursor-pointer ${
              emojiOpen ? 'text-infyn-rose' : 'text-infyn-muted hover:text-infyn-rose'
            }`}
          >
            <Ic.Smiley className="w-5 h-5" />
          </button>
        </div>

        {/* Send */}
        <button
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
            className={`${chatStyles.sendButton} transition-all duration-200 ${
            canSend
              ? 'bg-infyn-rose text-white shadow-2xs hover:bg-[#E11D48] active:scale-90 hover:scale-105 cursor-pointer'
              : 'bg-infyn-surface-soft text-infyn-muted cursor-default'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
