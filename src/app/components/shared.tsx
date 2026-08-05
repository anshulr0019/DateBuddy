'use client';

import React, { useState } from 'react';
import { Ic } from './icons';

/* ─────────────────────────────────────────────────
   Shared UI Components — Phase 2 & 3 Refined
───────────────────────────────────────────────── */

export function SafeImage({
  src,
  alt = '',
  name = '',
  className = '',
  style,
  onClick,
  eager = false,
}: {
  src?: string | null;
  alt?: string;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement | HTMLImageElement>) => void;
  /* Set for above-the-fold/LCP images so they are not lazy-loaded */
  eager?: boolean;
}) {
  const [error, setError] = useState(false);

  const getInitials = (str: string) => {
    if (!str) return 'DS';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  if (error || !src) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center justify-center bg-[#1A1A2E]/10 text-[#1A1A2E]/70 font-bold tracking-tight select-none ${className}`}
        style={style}
      >
        <span className="drop-shadow-sm">{getInitials(name || alt)}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || name}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      onError={() => setError(true)}
      onClick={onClick}
      className={className}
      style={style}
    />
  );
}

export function AuroraBackground({ subtle = false, children, className = '' }: { subtle?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-[#FAFAF7] text-[#1A1A2E] flex flex-col flex-1 min-h-0 ${subtle ? 'aurora-subtle' : ''} ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-blob aurora-blob-4" />
      </div>
      <div className="relative z-10 flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}

export function GlassCard({ children, className = '', style, onClick }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void }) {
  return (
    <div onClick={onClick} className={`rounded-[24px] border border-white/80 bg-white/80 shadow-[0_10px_30px_-15px_rgba(26,26,46,0.08)] backdrop-blur-md ${className}`} style={style}>
      {children}
    </div>
  );
}

export function PrimaryButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={`group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-[#F43F5E] hover:bg-[#E11D48] text-[15px] font-semibold text-white shadow-2xs transition-all duration-200 active:scale-95 cursor-pointer ${className}`}>
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function OnlineDot({ className = '' }: { className?: string }) {
  return <div className={`rounded-full border-2 border-[#FAFAF7] bg-[#22C55E] pulse-glow ${className}`} />;
}

export function VerifiedBadge() {
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F43F5E] text-white shadow-2xs">
      <Ic.Check />
    </div>
  );
}

export function GradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`text-[#1A1A2E] font-bold ${className}`}>
      {children}
    </span>
  );
}

/* Skeleton Loading Component */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-skeleton rounded-2xl ${className}`} />;
}
