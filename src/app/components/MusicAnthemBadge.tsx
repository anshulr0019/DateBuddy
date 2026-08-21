'use client';

import React from 'react';

export type MusicPlatform = 'spotify' | 'apple_music';

export interface MusicAnthem {
  platform: MusicPlatform;
  trackName: string;
  artistName: string;
  previewUrl?: string;
  albumArtUrl?: string;
}

interface MusicAnthemBadgeProps {
  anthem: MusicAnthem;
  className?: string;
}

export function MusicAnthemBadge({ anthem, className = '' }: MusicAnthemBadgeProps) {
  const isSpotify = anthem.platform === 'spotify';

  return (
    <div
      className={`relative flex items-center gap-3 p-3 rounded-2xl border shadow-xs select-none backdrop-blur-md overflow-hidden ${
        isSpotify
          ? 'bg-[#121212]/90 border-[#1DB954]/30 text-white'
          : 'bg-[#18141E]/90 border-[#FC3C44]/30 text-white'
      } ${className}`}
    >
      {/* Platform Glow */}
      <div
        className={`absolute -right-6 -bottom-6 h-20 w-20 rounded-full blur-xl opacity-20 pointer-events-none ${
          isSpotify ? 'bg-[#1DB954]' : 'bg-[#FC3C44]'
        }`}
      />

      {/* Music Icon / Badge */}
      <div
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-lg shadow-sm ${
          isSpotify
            ? 'bg-[#1DB954] text-black font-black'
            : 'bg-gradient-to-tr from-[#FC3C44] via-[#F94C57] to-[#FF8C94] text-white'
        }`}
      >
        {isSpotify ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.436-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.51 9.722 1.113.294.18.387.563.207.857zm1.224-2.72c-.226.367-.707.484-1.074.258-2.69-1.653-6.79-2.134-9.97-1.168-.413.125-.852-.107-.978-.52-.125-.413.108-.853.52-.978 3.633-1.102 8.147-.568 11.244 1.334.367.226.484.707.258 1.074zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.494.15-1.018-.13-1.168-.624-.15-.494.13-1.018.624-1.168 3.532-1.072 9.404-.87 13.14 1.348.444.263.59.837.327 1.28-.264.445-.838.59-1.28.328z" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        )}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
              isSpotify
                ? 'bg-[#1DB954]/20 text-[#1DB954]'
                : 'bg-[#FC3C44]/20 text-[#FC3C44]'
            }`}
          >
            {isSpotify ? 'Spotify Anthem' : 'Apple Music'}
          </span>
        </div>
        <p className="text-[13.5px] font-bold text-white leading-tight truncate mt-0.5">
          {anthem.trackName}
        </p>
        <p className="text-[11.5px] text-white/60 leading-tight truncate">
          {anthem.artistName}
        </p>
      </div>

      {/* Animated Sound Equalizer Bars */}
      <div className="flex items-end gap-0.5 h-4 flex-shrink-0 pr-1">
        {[8, 14, 10, 16, 6].map((h, idx) => (
          <span
            key={idx}
            className={`w-0.5 rounded-full animate-pulse ${
              isSpotify ? 'bg-[#1DB954]' : 'bg-[#FC3C44]'
            }`}
            style={{
              height: `${h}px`,
              animationDelay: `${idx * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
