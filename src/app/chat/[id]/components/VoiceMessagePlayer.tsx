'use client';

import React, { useState, useRef, useEffect } from 'react';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  isMine: boolean;
  durationSec?: number;
}

export function VoiceMessagePlayer({ audioUrl, isMine, durationSec }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const looksPlayable = /^(https?:|blob:|data:audio|\/)/i.test(audioUrl);
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    const knownDuration = typeof durationSec === 'number' && Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 0;
    setDuration(knownDuration);
    setIsLoading(false);
    setIsUnavailable(!looksPlayable);
    if (!looksPlayable) return;

    const audio = new Audio(audioUrl);
    audio.preload = 'metadata';
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    audio.ontimeupdate = () => {
      const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : knownDuration;
      setProgress(total ? Math.min(100, (audio.currentTime / total) * 100) : 0);
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setProgress(0);
      setCurrentTime(0);
    };
    audio.onerror = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setIsUnavailable(true);
    };
    audio.onplaying = () => { setIsLoading(false); setIsPlaying(true); setIsUnavailable(false); };
    audio.onpause = () => { setIsPlaying(false); setIsLoading(false); };
    const pause = () => audio.pause();
    const pauseOther = (event: Event) => { if ((event as CustomEvent).detail !== audio) pause(); };
    window.addEventListener('infyn:voice-play', pauseOther);
    window.addEventListener('infyn:call-interruption', pause);

    return () => {
      window.removeEventListener('infyn:voice-play', pauseOther);
      window.removeEventListener('infyn:call-interruption', pause);
      audio.onloadedmetadata = audio.ontimeupdate = audio.onended = audio.onerror = audio.onplaying = audio.onpause = null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, [audioUrl, durationSec]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      window.dispatchEvent(new CustomEvent('infyn:voice-play', { detail: audio }));
      setIsLoading(true);
      if (isUnavailable) audio.load();
      audio.play().catch(() => {
        if (audioRef.current !== audio) return;
        setIsPlaying(false); setIsLoading(false); setIsUnavailable(true);
      });
    }
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex w-full min-w-0 items-center gap-3 py-0.5 select-none">
      {/* Play/Pause Circle Button */}
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        onClick={togglePlay}
        disabled={isLoading || !/^(https?:|blob:|data:audio|\/)/i.test(audioUrl)}
        aria-label={isLoading ? 'Loading audio note' : isUnavailable ? 'Retry audio note' : isPlaying ? 'Pause audio note' : 'Play audio note'}
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border transition-all active:scale-90 shadow-xs ${
          isUnavailable
            ? 'border-infyn-border bg-infyn-surface-soft text-infyn-muted cursor-pointer'
            :
          isMine
            ? 'border-infyn-rose-line bg-infyn-surface text-infyn-rose cursor-pointer'
            : 'border-infyn-rose bg-infyn-rose text-white cursor-pointer'
        }`}
      >
        {isUnavailable ? (
          <IcUnavailable />
        ) : isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>

      {/* Waveform Scrubber & Duration */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        <div className={`flex h-6 items-center gap-[3px] ${isUnavailable ? 'opacity-40' : ''}`} aria-hidden>
          {[12, 20, 8, 24, 16, 18, 10, 26, 14, 22, 10, 18, 24, 12, 16, 8, 20, 14].map((barH, i) => {
            const barProgress = (i / 18) * 100;
            const isFilled = progress >= barProgress;
            return (
              <span
                key={i}
                className={`min-w-0 flex-1 rounded-full transition-colors ${isFilled ? 'bg-infyn-rose' : 'bg-infyn-rose/20'}`}
                style={{ height: `${barH}px` }}
              />
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] font-medium leading-none text-infyn-muted">
          <span>{isLoading ? 'Loading…' : isUnavailable ? 'Tap to retry' : formatSecs(currentTime)}</span>
          {!isUnavailable && <span>{formatSecs(duration || 0)}</span>}
        </div>
      </div>
    </div>
  );
}

function IcUnavailable() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
  );
}
