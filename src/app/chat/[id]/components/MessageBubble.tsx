'use client';

import React, { memo, useRef, useState } from 'react';
import { Ic, WhatsAppTicks } from '../../../components/icons';
import { formatClock } from '../../../lib/time';
import type { ChatMessage } from '../chatTypes';
import chatStyles from '../chat.module.css';

const LONG_PRESS_MS = 450;

function formatCallDuration(secs: number): string {
  if (secs <= 0) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

interface CallEventData {
  callType: 'audio' | 'video';
  status: 'completed' | 'missed' | 'declined' | 'cancelled';
  duration?: number;
}

function parseCallEvent(content: string): CallEventData | null {
  if (!content.startsWith('CALL_EVENT:')) return null;
  try {
    return JSON.parse(content.replace('CALL_EVENT:', ''));
  } catch {
    return null;
  }
}

/* Honest status indicator: clock while sending/queued, single tick once the
   server accepted it, rose double tick only when the recipient has read it. */
function StatusIndicator({ status }: { status: ChatMessage['status'] }) {
  if (!status || status === 'failed') return null;
  if (status === 'sending' || status === 'queued') {
    return (
      <>
        <Ic.Clock className="w-3 h-3 text-gray-400" />
        <span className="sr-only">{status === 'queued' ? 'Waiting to send' : 'Sending'}</span>
      </>
    );
  }
  return (
    <>
      <WhatsAppTicks status={status} />
      <span className="sr-only">{status === 'seen' ? 'Seen' : 'Sent'}</span>
    </>
  );
}

function MetaRow({ message }: { message: ChatMessage }) {
  return (
    <div className={`${chatStyles.messageMeta} flex items-center justify-end gap-1 mt-1 -mr-0.5 font-medium select-none`}>
      <span>{formatClock(message.createdAt)}</span>
      <StatusIndicator status={message.status} />
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  partnerName: string;
  onOpenActions: (message: ChatMessage) => void;
  onOpenPhoto: (url: string) => void;
  onRetry: (id: string) => void;
  onStartCall?: (callType: 'audio' | 'video') => void;
}

function MessageBubbleInner({
  message,
  isMine,
  partnerName,
  onOpenActions,
  onOpenPhoto,
  onRetry,
  onStartCall,
}: MessageBubbleProps) {
  const [imageBroken, setImageBroken] = useState(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  const callEvent = parseCallEvent(message.content);
  const canHaveActions = !callEvent;

  const startPress = () => {
    if (!canHaveActions) return;
    longPressFiredRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      onOpenActions(message);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  // ── Render Minimalist Call Log Bubble ──
  if (callEvent) {
    const isVideo = callEvent.callType === 'video';
    const isMissed =
      callEvent.status === 'missed' ||
      callEvent.status === 'declined' ||
      callEvent.status === 'cancelled';
    const hasDuration = (callEvent.duration ?? 0) > 0;

    let title = '';
    if (isMine) {
      if (isMissed) title = isVideo ? 'Outgoing Video (No answer)' : 'Outgoing Audio (No answer)';
      else title = isVideo ? 'Outgoing Video Call' : 'Outgoing Audio Call';
    } else {
      if (isMissed) title = isVideo ? 'Missed Video Call' : 'Missed Audio Call';
      else title = isVideo ? 'Incoming Video Call' : 'Incoming Audio Call';
    }

    let subtitle = '';
    if (hasDuration) {
      subtitle = formatCallDuration(callEvent.duration!);
    } else if (!isMine && isMissed) {
      subtitle = 'Tap to call back';
    } else {
      subtitle = isMine ? 'No answer' : 'Missed';
    }

    return (
      <div className={`${chatStyles.messageRow} flex flex-col my-1 ${isMine ? 'items-end' : 'items-start'}`}>
        <div
          onClick={() => onStartCall?.(callEvent.callType)}
          className={`${chatStyles.bubble} ${isMine ? chatStyles.bubbleMine : chatStyles.bubbleTheirs} flex items-center gap-3 border transition-all select-none cursor-pointer active:scale-[0.98] ${
            isMine
              ? 'bg-[#FFF2F5] border-[#F9C0D0]/70 text-[#2D1B28] rounded-tr-[4px]'
              : 'bg-white border-gray-200/80 text-[#1E293B] rounded-tl-[4px]'
          } shadow-2xs hover:shadow-xs min-w-[210px] max-w-[84%] sm:max-w-[78%]`}
        >
          {/* Call Type Icon */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              isMissed
                ? 'bg-rose-500/10 text-rose-500'
                : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {isVideo ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                {isMissed && <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2.5" stroke="#EF4444" />}
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
              </svg>
            )}
          </div>

          {/* Call Description */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-[13px] font-bold leading-tight truncate ${isMissed && !isMine ? 'text-rose-600' : 'text-[#1E293B]'}`}>
              {title}
            </h4>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
              {subtitle}
            </p>
          </div>

          {/* Call Back Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartCall?.(callEvent.callType);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[#1E293B] text-[11px] font-semibold transition-colors flex-shrink-0 cursor-pointer active:scale-95"
          >
            <span>Call</span>
          </button>
        </div>

        {/* Time Stamp */}
        <div className={`${chatStyles.messageMeta} px-1 mt-0.5`}>
          {formatClock(message.createdAt)}
        </div>
      </div>
    );
  }

  return (
    <div id={`msg-${message.id}`} className={`${chatStyles.messageRow} flex flex-col ${isMine ? 'items-end animate-msg-mine' : 'items-start animate-msg-theirs'} ${message.metadata?.reactions && Object.keys(message.metadata.reactions).length > 0 ? 'mb-2' : ''}`}>
      <div
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
        onContextMenu={(e) => {
          if (!canHaveActions) return;
          e.preventDefault();
          onOpenActions(message);
        }}
        onKeyDown={(e) => {
          if (canHaveActions && e.key === 'Enter') {
            e.preventDefault();
            onOpenActions(message);
          }
        }}
        tabIndex={canHaveActions ? 0 : undefined}
        role={canHaveActions ? 'button' : undefined}
        aria-label={
          canHaveActions
            ? `Message from ${isMine ? 'you' : partnerName}: ${message.content}. Press Enter for options.`
            : undefined
        }
        className={`${chatStyles.bubble} ${isMine ? chatStyles.bubbleMine : chatStyles.bubbleTheirs} relative max-w-[84%] sm:max-w-[78%] transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7D1D3F]/35 ${
          isMine
            ? 'bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#2D1B28] rounded-tr-[4px]'
            : 'bg-white border border-gray-200/70 text-[#1E293B] rounded-tl-[4px]'
        }`}
      >
        {/* WhatsApp Quoted Reply Preview */}
        {message.metadata?.replyTo && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              const el = document.getElementById(`msg-${message.metadata?.replyTo?.id}`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("ring-2", "ring-[#F43F5E]", "transition-all");
                setTimeout(() => el.classList.remove("ring-2", "ring-[#F43F5E]"), 1500);
              }
            }}
            className={`mb-2 flex items-stretch gap-2.5 rounded-xl px-2.5 py-1.5 text-left cursor-pointer transition-all hover:opacity-90 ${
              isMine
                ? "bg-black/[0.06] border-l-[3.5px] border-[#F43F5E]"
                : "bg-black/[0.04] border-l-[3.5px] border-[#7B68EE]"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className={`text-[11px] font-bold truncate ${isMine ? "text-[#F43F5E]" : "text-[#7B68EE]"}`}>
                {message.metadata.replyTo.senderName || "Message"}
              </p>
              <p className="text-[11.5px] text-gray-500 truncate font-normal mt-0.5">
                {message.metadata.replyTo.type === "photo"
                  ? "📷 Photo"
                  : message.metadata.replyTo.type === "gif"
                  ? "🎞️ GIF"
                  : message.metadata.replyTo.type === "voice"
                  ? "🎤 Voice note"
                  : message.metadata.replyTo.type === "location"
                  ? "📍 Location"
                  : message.metadata.replyTo.content}
              </p>
            </div>
          </div>
        )}
        {/* Text */}
        {message.type === 'text' && (
          <div className="flex flex-col">
            <p className={`${chatStyles.messageText} leading-relaxed font-normal select-text whitespace-pre-wrap break-words`}>
              {message.content}
            </p>
            <MetaRow message={message} />
          </div>
        )}

        {/* Photo */}
        {message.type === 'photo' && (
          <div className="flex flex-col gap-1.5">
            {imageBroken ? (
              <div className="flex w-[210px] aspect-[4/3] items-center justify-center gap-2 rounded-2xl border border-gray-200/60 bg-gray-50 text-gray-400">
                <Ic.Camera className="w-5 h-5" />
                <span className="text-[12px] font-medium">Photo unavailable</span>
              </div>
            ) : (
              <button
                onClick={() => onOpenPhoto(message.content)}
                aria-label={`View photo from ${isMine ? 'you' : partnerName} full screen`}
                className="relative w-[210px] aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200/60 bg-gray-100 shadow-2xs cursor-pointer group block"
              >
                <img
                  src={message.content}
                  alt={`Photo from ${isMine ? 'you' : partnerName}`}
                  loading="lazy"
                  decoding="async"
                  onError={() => setImageBroken(true)}
                  className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <span className="text-[11px] font-bold bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md">View Photo</span>
                </div>
              </button>
            )}
            <MetaRow message={message} />
          </div>
        )}

        {/* GIF / Sticker */}
        {message.type === 'gif' && (
          <div className="flex flex-col gap-1.5">
            {imageBroken ? (
              <div className="flex w-[200px] aspect-square items-center justify-center gap-2 rounded-2xl border border-gray-200/60 bg-gray-50 text-gray-400">
                <span className="text-[12px] font-medium">GIF unavailable</span>
              </div>
            ) : (
              <div className="relative w-[200px] overflow-hidden rounded-2xl border border-gray-200/40 bg-gray-100 shadow-2xs">
                <img
                  src={message.content}
                  alt={`GIF from ${isMine ? 'you' : partnerName}`}
                  loading="lazy"
                  decoding="async"
                  onError={() => setImageBroken(true)}
                  className="w-full object-cover"
                />
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-black text-white tracking-wider">GIF</span>
              </div>
            )}
            <MetaRow message={message} />
          </div>
        )}

        {/* Location */}
        {message.type === 'location' && (
          <div className="flex flex-col gap-2 min-w-[210px]">
            <div className="flex items-start gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#F43F5E]/10 text-[#F43F5E] flex items-center justify-center flex-shrink-0">
                <Ic.MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[#1E293B] break-words">{message.content || 'Shared location'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10.5px] font-medium text-gray-400">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(message.content)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F43F5E] font-bold hover:underline"
              >
                Open in Maps →
              </a>
              <div className="flex items-center gap-1">
                <span>{formatClock(message.createdAt)}</span>
                <StatusIndicator status={message.status} />
              </div>
            </div>
          </div>
        )}

        {/* Voice */}
        {message.type === 'voice' && (
          <div className="flex flex-col gap-1.5 min-w-[190px]">
            <div className="flex items-center gap-2.5 py-1">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Ic.Mic className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1E293B]">Voice note</p>
                <p className="text-[11px] text-gray-400">Playback isn&apos;t supported here yet</p>
              </div>
            </div>
            <MetaRow message={message} />
          </div>
        )}
        {/* Reaction Pill Badge */}
        {message.metadata?.reactions && Object.keys(message.metadata.reactions).length > 0 && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenActions(message);
            }}
            className={`absolute -bottom-2.5 ${
              isMine ? 'right-2' : 'left-2'
            } flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md border border-gray-200 shadow-sm text-[12px] select-none z-10 cursor-pointer hover:scale-110 active:scale-95 transition-transform`}
          >
            {Array.from(new Set(Object.values(message.metadata.reactions as Record<string, string>))).slice(0, 3).map((emoji, idx) => (
              <span key={idx} className="leading-none">{emoji}</span>
            ))}
            {Object.keys(message.metadata.reactions).length > 1 && (
              <span className="text-[10px] font-bold text-gray-500 font-mono ml-0.5">
                {Object.keys(message.metadata.reactions).length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Failed send */}
      {message.status === 'failed' && (
        <button
          onClick={() => onRetry(message.id)}
          className={`${chatStyles.stateButton} mt-1 flex items-center gap-1.5 px-3 py-1 text-[11px] hover:bg-[#631430] active:scale-95 transition-all cursor-pointer`}
        >
          <Ic.Alert className="w-3.5 h-3.5" />
          Failed to send — tap to retry
        </button>
      )}
      {message.status === 'queued' && (
        <span className="mt-1 px-1 text-[10.5px] font-medium text-gray-400">
          Waiting for connection…
        </span>
      )}
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleInner);
