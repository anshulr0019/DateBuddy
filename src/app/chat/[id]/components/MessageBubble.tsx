'use client';

import React, { memo, useRef, useState } from 'react';
import { Ic, WhatsAppTicks } from '../../../components/icons';
import { formatClock } from '../../../lib/time';
import type { ChatMessage } from '../chatTypes';

const LONG_PRESS_MS = 450;

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
    <div className="flex items-center justify-end gap-1 mt-1 -mr-0.5 text-[10.5px] font-medium text-gray-400 select-none">
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
}

function MessageBubbleInner({
  message,
  isMine,
  partnerName,
  onOpenActions,
  onOpenPhoto,
  onRetry,
}: MessageBubbleProps) {
  const [imageBroken, setImageBroken] = useState(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  const canHaveActions = message.type === 'text';

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

  const isImage = message.type === 'photo' || message.type === 'gif';

  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
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
        className={`relative max-w-[84%] sm:max-w-[78%] px-3.5 py-2.5 rounded-[20px] transition-transform duration-200 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F43F5E]/40 ${
          isMine
            ? 'bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[#2D1B28] rounded-tr-[4px]'
            : 'bg-white border border-gray-200/70 text-[#1E293B] rounded-tl-[4px]'
        }`}
      >
        {/* Text */}
        {message.type === 'text' && (
          <div className="flex flex-col">
            <p className="text-[14.5px] leading-relaxed font-normal select-text whitespace-pre-wrap break-words">
              {message.content}
            </p>
            <MetaRow message={message} />
          </div>
        )}

        {/* Photo / GIF */}
        {isImage && (
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

        {/* Location (legacy rows from the DB) */}
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

        {/* Voice (legacy rows from the DB — playback not yet supported) */}
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
      </div>

      {/* Failed send — explicit, actionable */}
      {message.status === 'failed' && (
        <button
          onClick={() => onRetry(message.id)}
          className="mt-1 flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-[11px] font-bold text-[#E11D48] hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
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
