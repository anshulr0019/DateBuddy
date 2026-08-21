'use client';

import React, { useState, useRef, useEffect } from 'react';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  isMine: boolean;
}

export function VoiceMessagePlayer({ audioUrl, isMine }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[200px] select-none">
      {/* Play/Pause Circle Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 cursor-pointer shadow-xs ${
          isMine
            ? 'bg-white text-[#FF6B9D]'
            : 'bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white'
        }`}
      >
        {isPlaying ? (
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
        <div className="flex items-center gap-0.5 h-6">
          {[12, 20, 8, 24, 16, 18, 10, 26, 14, 22, 10, 18, 24, 12, 16, 8, 20, 14].map((barH, i) => {
            const barProgress = (i / 18) * 100;
            const isFilled = progress >= barProgress;
            return (
              <span
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  isMine
                    ? isFilled ? 'bg-white' : 'bg-white/40'
                    : isFilled ? 'bg-[#FF6B9D]' : 'bg-[#1A1A2E]/20'
                }`}
                style={{ height: `${barH}px` }}
              />
            );
          })}
        </div>

        <div className={`flex justify-between text-[10.5px] font-mono leading-none ${isMine ? 'text-white/80' : 'text-[#1A1A2E]/50'}`}>
          <span>{isPlaying ? formatSecs(currentTime) : formatSecs(duration || 0)}</span>
          <span className="text-[10px]">Voice Note 🎙️</span>
        </div>
      </div>
    </div>
  );
}
