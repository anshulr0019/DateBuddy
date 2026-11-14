'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SafeImage } from './shared';
import { hapticSuccess, hapticMedium } from '../lib/haptics';

export interface MatchedUser {
  id: number;
  name: string;
  photo: string | null;
  verified?: boolean;
}

interface MatchScreenProps {
  isOpen: boolean;
  matchedUser: MatchedUser | null;
  myPhoto: string | null;
  /* Tried in order if `myPhoto` fails to load. */
  myPhotoFallbacks?: string[];
  myName?: string;
  onClose: () => void;
  onSendMessage?: () => void;
}

// When the heart lands between the two photos (see .match-heart in globals.css).
const LOCK_MS = 560;

/*
  Match celebration. The two photos slide in and settle overlapping, a
  heart locks them together with one ripple, and the success haptic fires
  on that beat rather than on open. Static under reduced motion.
*/
export function MatchScreen({
  isOpen,
  matchedUser,
  myPhoto,
  myPhotoFallbacks,
  myName = 'You',
  onClose,
  onSendMessage,
}: MatchScreenProps) {
  const router = useRouter();
  const sendRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const haptic = setTimeout(hapticSuccess, reduced ? 0 : LOCK_MS);
    const focus = requestAnimationFrame(() => sendRef.current?.focus({ preventScroll: true }));
    return () => { clearTimeout(haptic); cancelAnimationFrame(focus); };
  }, [isOpen]);

  if (!isOpen || !matchedUser) return null;

  const partnerFirstName = matchedUser.name ? matchedUser.name.split(' ')[0] : 'your match';

  const handleChat = () => {
    hapticMedium();
    if (onSendMessage) {
      onSendMessage();
    } else {
      onClose();
      router.push('/messages');
    }
  };

  return (
    <div
      className="match-root fixed inset-0 z-[9999] flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      aria-describedby="match-desc"
    >
      <div className="match-backdrop absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="match-card relative w-full max-w-[360px] rounded-[32px] bg-infyn-surface border border-infyn-border px-6 pt-9 pb-6 text-center flex flex-col items-center">
        <div className="relative flex items-center justify-center h-[124px] mb-7" aria-hidden="true">
          <div className="match-photo match-photo-me">
            <SafeImage src={myPhoto} fallbackSrcs={myPhotoFallbacks} name={myName} alt="" eager className="h-full w-full object-cover" />
          </div>
          <div className="match-photo match-photo-them">
            <SafeImage src={matchedUser.photo} name={matchedUser.name} alt="" eager className="h-full w-full object-cover" />
          </div>
          <span className="match-ripple" />
          <span className="match-heart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
        </div>

        <div className="match-copy">
          <h1 id="match-title" className="font-display text-[34px] leading-tight tracking-tight text-infyn-rose">
            It&apos;s a match
          </h1>
          <p id="match-desc" className="mt-1.5 text-[16px] text-infyn-secondary">
            You and {partnerFirstName} liked each other.
          </p>
        </div>

        <div className="match-actions w-full mt-7 space-y-1">
          <button
            ref={sendRef}
            onClick={handleChat}
            className="w-full min-h-[54px] rounded-full bg-infyn-rose text-[#fff8f0] text-[16px] font-semibold shadow-[0_1px_2px_rgba(158,27,65,0.15),0_10px_22px_-10px_rgba(158,27,65,0.6)] active:scale-[0.985] transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-infyn-rose"
          >
            Send {partnerFirstName} a message
          </button>
          <button
            onClick={onClose}
            className="w-full min-h-[48px] text-[15px] font-semibold text-infyn-secondary cursor-pointer"
          >
            Keep swiping
          </button>
        </div>
      </div>
    </div>
  );
}
