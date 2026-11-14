'use client';

import React, { useEffect, useState } from 'react';
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
  // Keep an existing explicit width. Other transformations (such as q_auto)
  // should not prevent small avatars from receiving a small delivery size.
  if (/\/image\/upload\/[^/]*w_\d+/.test(src)) {
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
  fallbackSrcs,
}: {
  src?: string | null;
  /* Tried in order if `src` fails to load, before falling back to initials. */
  fallbackSrcs?: Array<string | null | undefined>;
  alt?: string;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement | HTMLImageElement>) => void;
  /* Set for above-the-fold/LCP images so they are not lazy-loaded */
  eager?: boolean;
  width?: number;
}) {
  const candidates = [src, ...(fallbackSrcs ?? [])].filter((u): u is string => Boolean(u));
  const candidateKey = candidates.join('|');
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setAttempt(0); setLoaded(false); }, [candidateKey]);
  const current = candidates[attempt];
  const error = !current;

  const getInitials = (str: string) => {
    if (!str) return 'IN';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.substring(0, 2).toUpperCase();
  };

  if (error) {
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

  const finalSrc = optimizeImageUrl(current, { width }) || current;

  return (
    <img
      src={finalSrc}
      alt={alt || name}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => { setLoaded(false); setAttempt((a) => a + 1); }}
      onClick={onClick}
      className={`transition-opacity duration-300 ease-out ${loaded || eager ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={style}
    />
  );
}

export function AuroraBackground({ subtle = false, children, className = '' }: { subtle?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative h-full w-full overflow-hidden bg-infyn-paper text-infyn-ink flex flex-col flex-1 min-h-0 ${subtle ? 'aurora-subtle' : ''} ${className}`}>
      <div className="relative z-10 flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}

export function GlassCard({ children, className = '', style, onClick }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void }) {
  return (
    <div
      onClick={onClick}
      // Clickable cards must be reachable and operable from the keyboard.
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      } : undefined}
      className={`rounded-[24px] border border-infyn-border/80 bg-infyn-surface shadow-[0_12px_36px_-18px_rgba(32,26,22,0.12)] ${onClick ? 'infyn-card-press focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-infyn-rose' : ''} ${className}`}
      style={style}
    >
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

/* One empty / error / offline layout for every screen: icon, serif title,
   a short explanation and at most one primary and one secondary action. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  secondary,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  title: string;
  body?: React.ReactNode;
  action?: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
  tone?: 'neutral' | 'error';
}) {
  return (
    <div className="animate-soft-arrive flex flex-col items-center text-center py-14 px-6" role={tone === 'error' ? 'alert' : undefined}>
      <div className={`mb-5 grid h-16 w-16 place-items-center rounded-full [&_svg]:h-7 [&_svg]:w-7 ${tone === 'error' ? 'bg-infyn-blush text-infyn-rose' : 'bg-infyn-surface border border-infyn-border text-infyn-rose'}`} aria-hidden>
        {icon}
      </div>
      <h2 className="font-display text-[26px] leading-tight tracking-tight text-infyn-ink">{title}</h2>
      {body && <p className="mt-2 max-w-[300px] text-[15px] leading-relaxed text-infyn-secondary">{body}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 min-h-[52px] px-8 rounded-full bg-infyn-rose text-[#fff8f0] text-[15px] font-semibold active:scale-[0.985] transition-transform cursor-pointer"
        >
          {action.label}
        </button>
      )}
      {secondary && (
        <button onClick={secondary.onClick} className="mt-1 min-h-[48px] px-6 text-[15px] font-semibold text-infyn-secondary cursor-pointer">
          {secondary.label}
        </button>
      )}
    </div>
  );
}
