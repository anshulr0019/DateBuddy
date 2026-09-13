'use client';

import React, { useState } from 'react';
import { Ic } from './icons';

/* ─────────────────────────────────────────────────
   Shared UI Components — Phase 2 & 3 Refined
───────────────────────────────────────────────── */

export function optimizeImageUrl(
  src?: string | null,
  options: { width?: number; quality?: string } = {}
): string | null {
  if (!src) return null;
  if (!src.includes('res.cloudinary.com') || !src.includes('/image/upload/')) {
    return src;
  }
  // Skip if transformation is already present
  if (src.includes('/image/upload/f_') || src.includes('/image/upload/q_') || src.includes('/image/upload/w_')) {
    return src;
  }
  const width = options.width || 800;
  const quality = options.quality || 'auto';
  const transform = `f_auto,q_${quality},w_${width},c_limit`;
  return src.replace('/image/upload/', `/image/upload/${transform}/`);
}

export function SafeImage({
  src,
  alt = '',
  name = '',
  className = '',
  style,
  onClick,
  eager = false,
  width = 800,
}: {
  src?: string | null;
  alt?: string;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement | HTMLImageElement>) => void;
  /* Set for above-the-fold/LCP images so they are not lazy-loaded */
  eager?: boolean;
  width?: number;
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const getInitials = (str: string) => {
    if (!str) return 'IN';
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
        className={`flex items-center justify-center bg-infyn-ink/10 text-infyn-ink/70 font-bold tracking-tight select-none ${className}`}
        style={style}
      >
        <span className="drop-shadow-sm">{getInitials(name || alt)}</span>
      </div>
    );
  }

  const finalSrc = optimizeImageUrl(src, { width }) || src;

  return (
    <img
      src={finalSrc}
      alt={alt || name}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      onClick={onClick}
      className={`transition-opacity duration-300 ease-out ${loaded || eager ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={style}
    />
  );
}

export function AuroraBackground({ subtle = false, children, className = '' }: { subtle?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-infyn-paper text-infyn-ink flex flex-col flex-1 min-h-0 ${subtle ? 'aurora-subtle' : ''} ${className}`}>
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
    <div onClick={onClick} className={`rounded-[24px] border border-infyn-border/80 bg-infyn-surface/85 shadow-[0_12px_36px_-18px_rgba(32,26,22,0.12)] backdrop-blur-md ${onClick ? 'infyn-card-press' : ''} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function PrimaryButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={`group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-infyn-rose via-infyn-rose to-infyn-rose text-[15px] font-bold text-white shadow-[0_12px_32px_-10px_rgba(32,26,22,0.16)] transition-all duration-200 active:scale-[0.985] cursor-pointer ${className}`}>
      {/* Hover shimmer */}
      <span aria-hidden className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: 'linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%)' }} />
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function OnlineDot({ className = '' }: { className?: string }) {
  return <div className={`active-user-ring rounded-full border-2 border-infyn-paper bg-[#22C55E] ${className}`} />;
}

export function VerifiedBadge() {
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-infyn-rose text-white shadow-2xs">
      <Ic.Check />
    </div>
  );
}

export function GradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-infyn-rose to-infyn-rose bg-clip-text text-transparent font-bold ${className}`}>
      {children}
    </span>
  );
}

/* Skeleton Loading Component */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-skeleton rounded-2xl ${className}`} />;
}
