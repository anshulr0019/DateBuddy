'use client';

import React, { useState, useEffect, useCallback } from 'react';

type VibeRating = '🔥' | '😊' | '😐';

interface VibeCheckBannerProps {
  matchId: number | null;
  myMessageCount: number;
  partnerMessageCount: number;
  partnerName: string;
  onSendVibeMessage: (text: string) => void;
}

const VIBE_OPTIONS: { emoji: VibeRating; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { emoji: '🔥', label: 'Fire', color: 'text-orange-400', bgColor: 'bg-orange-500/12', borderColor: 'border-orange-500/25' },
  { emoji: '😊', label: 'Good', color: 'text-emerald-400', bgColor: 'bg-emerald-500/12', borderColor: 'border-emerald-500/25' },
  { emoji: '😐', label: 'Meh', color: 'text-gray-400', bgColor: 'bg-gray-500/12', borderColor: 'border-gray-500/25' },
];

const STORAGE_KEY_PREFIX = 'datebuddy_vibecheck_';

export function VibeCheckBanner({
  matchId,
  myMessageCount,
  partnerMessageCount,
  partnerName,
  onSendVibeMessage,
}: VibeCheckBannerProps) {
  const cleanName = partnerName?.split(' ')[0] || 'your match';
  const storageKey = `${STORAGE_KEY_PREFIX}${matchId}`;

  const [dismissed, setDismissed] = useState(true); // start hidden, check localStorage
  const [myRating, setMyRating] = useState<VibeRating | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Check if we should show the banner
  useEffect(() => {
    if (!matchId) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setDismissed(true); // Already completed for this match
      } else {
        setDismissed(false);
      }
    } catch {
      setDismissed(false);
    }
  }, [matchId, storageKey]);

  // Threshold: at least 5 messages from each side (10 total bidirectional)
  const shouldShow = !dismissed && myMessageCount >= 5 && partnerMessageCount >= 5;

  const handlePick = useCallback((rating: VibeRating) => {
    setMyRating(rating);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!myRating || !matchId) return;

    const label = VIBE_OPTIONS.find((v) => v.emoji === myRating)?.label || '';
    onSendVibeMessage(`✨ Vibe Check: I rated our conversation ${myRating} ${label}!`);

    setIsSubmitted(true);

    // Show confetti for fire rating
    if (myRating === '🔥') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    // Persist to localStorage so it only shows once per match
    try {
      localStorage.setItem(storageKey, JSON.stringify({ rating: myRating, at: Date.now() }));
    } catch { /* ignore */ }

    // Auto-dismiss after a delay
    setTimeout(() => setDismissed(true), 4000);
  }, [myRating, matchId, storageKey, onSendVibeMessage]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ dismissed: true, at: Date.now() }));
    } catch { /* ignore */ }
  }, [storageKey]);

  if (!shouldShow) return null;

  return (
    <div className="relative flex-shrink-0 mx-3 mb-1.5 animate-vibe-slide-in">
      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <span
              key={i}
              className="absolute animate-vibe-confetti rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${-5 - Math.random() * 10}%`,
                width: `${4 + Math.random() * 4}px`,
                height: `${4 + Math.random() * 4}px`,
                backgroundColor: ['var(--infyn-rose)', 'var(--infyn-rose)', '#22C55E', '#F59E0B', '#3B82F6', '#EC4899'][i % 6],
                animationDelay: `${Math.random() * 0.6}s`,
                animationDuration: `${1.5 + Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-0 rounded-2xl bg-gradient-to-r from-infyn-dark-surface to-[#1B1E2E] border border-infyn-border/[0.08] shadow-lg overflow-hidden">
        {/* Subtle shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-vibe-shimmer pointer-events-none" />

        <div className="relative p-3.5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">✨</span>
              <div>
                <p className="text-[13px] font-extrabold text-white leading-tight">Vibe Check</p>
                <p className="text-[10.5px] text-white/45 font-medium">
                  How&apos;s this conversation going?
                </p>
              </div>
            </div>
            {!isSubmitted && (
              <button
                type="button"
                onClick={handleDismiss}
                className="h-6 w-6 rounded-full bg-infyn-surface/[0.06] hover:bg-infyn-surface/[0.12] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors cursor-pointer text-[10px]"
                aria-label="Dismiss vibe check"
              >
                ✕
              </button>
            )}
          </div>

          {!isSubmitted ? (
            <>
              {/* Rating Options */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {VIBE_OPTIONS.map((option) => (
                  <button
                    key={option.emoji}
                    type="button"
                    onClick={() => handlePick(option.emoji)}
                    className={`py-3 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                      myRating === option.emoji
                        ? `${option.bgColor} ${option.borderColor} scale-[1.03] shadow-sm`
                        : 'bg-infyn-surface/[0.03] border-infyn-border/[0.06] hover:bg-infyn-surface/[0.06]'
                    }`}
                  >
                    <span className="text-[24px] block">{option.emoji}</span>
                    <span className={`text-[10px] font-bold mt-0.5 block ${
                      myRating === option.emoji ? option.color : 'text-white/50'
                    }`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!myRating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-infyn-rose to-infyn-rose text-white text-[12.5px] font-bold cursor-pointer active:scale-[0.98] disabled:opacity-30 disabled:scale-100 transition-all shadow-sm"
              >
                Send Vibe Check to {cleanName}
              </button>
            </>
          ) : (
            /* Result display */
            <div className="text-center py-2 animate-popover-enter">
              <span className="text-[36px] block mb-1">{myRating}</span>
              <p className="text-[14px] font-bold text-white">
                {myRating === '🔥' && "You're feeling the fire! 🔥"}
                {myRating === '😊' && 'Good vibes! Keep it going 💫'}
                {myRating === '😐' && 'Keep chatting — the best is yet to come ✨'}
              </p>
              <p className="text-[11px] text-white/40 mt-1">
                {cleanName} will see your vibe check
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
