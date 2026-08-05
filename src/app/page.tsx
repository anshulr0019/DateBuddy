'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo, { BRAND_NAME } from './components/BrandLogo';

const HOLD_MS = 2400;
const HOLD_REDUCED_MS = 900;
const EXIT_MS = 450;

/**
 * Ember field — deterministic (no Math.random, so SSR and client
 * markup always match). Each dot drifts upward on the compositor.
 */
const PARTICLES: Array<{
  left: string;
  top: string;
  size: number;
  color: string;
  delay: number; // s
  dur: number; // s
  drift: string; // horizontal drift over lifetime
  peak: number; // max opacity
}> = [
  { left: '14%', top: '78%', size: 3, color: 'rgba(255,107,157,0.9)', delay: 0.3, dur: 4.4, drift: '22px', peak: 0.6 },
  { left: '26%', top: '88%', size: 2, color: 'rgba(255,255,255,0.85)', delay: 1.1, dur: 3.8, drift: '-14px', peak: 0.5 },
  { left: '38%', top: '72%', size: 2, color: 'rgba(123,104,238,0.9)', delay: 0.6, dur: 4.8, drift: '10px', peak: 0.55 },
  { left: '49%', top: '90%', size: 3, color: 'rgba(255,107,157,0.85)', delay: 1.5, dur: 4.1, drift: '-20px', peak: 0.6 },
  { left: '60%', top: '76%', size: 2, color: 'rgba(255,255,255,0.8)', delay: 0.1, dur: 4.6, drift: '16px', peak: 0.45 },
  { left: '71%', top: '86%', size: 3, color: 'rgba(183,108,255,0.9)', delay: 0.9, dur: 4.3, drift: '-12px', peak: 0.55 },
  { left: '83%', top: '74%', size: 2, color: 'rgba(255,107,157,0.85)', delay: 1.3, dur: 3.9, drift: '18px', peak: 0.5 },
  { left: '9%', top: '58%', size: 2, color: 'rgba(123,104,238,0.85)', delay: 0.5, dur: 5.0, drift: '14px', peak: 0.4 },
  { left: '90%', top: '56%', size: 2, color: 'rgba(255,255,255,0.75)', delay: 1.7, dur: 4.5, drift: '-16px', peak: 0.4 },
  { left: '20%', top: '40%', size: 2, color: 'rgba(255,107,157,0.8)', delay: 0.8, dur: 5.2, drift: '-10px', peak: 0.35 },
  { left: '78%', top: '38%', size: 2, color: 'rgba(183,108,255,0.8)', delay: 1.9, dur: 4.7, drift: '12px', peak: 0.35 },
  { left: '55%', top: '60%', size: 1.5, color: 'rgba(255,255,255,0.9)', delay: 0.2, dur: 4.0, drift: '8px', peak: 0.45 },
];

export default function SplashScreen() {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Logged-in users continue to /discover; the middleware bounces everyone
    // else to /welcome. Account-switching goes straight to /welcome with its
    // params intact so the middleware lets it through.
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const switching = params.has('switch') || params.has('logout');
    const destination = switching ? `/welcome${search}` : '/discover';

    router.prefetch('/welcome');
    router.prefetch('/discover');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hold = reduced ? HOLD_REDUCED_MS : HOLD_MS;
    const exit = reduced ? 0 : EXIT_MS;
    const exitTimer = setTimeout(() => setExiting(true), hold);
    const navTimer = setTimeout(() => router.replace(destination), hold + exit);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(navTimer);
    };
  }, [router]);

  return (
    <div
      role="status"
      aria-label={`${BRAND_NAME} is starting`}
      className={`splash-root fixed inset-0 z-50 flex items-center justify-center overflow-hidden ${
        exiting ? 'splash-exit' : ''
      }`}
    >
      {/* Atmosphere: drifting corner orbs + rotating conic aurora */}
      <div aria-hidden className="splash-atmosphere pointer-events-none absolute inset-0 overflow-hidden">
        <div className="splash-orb splash-orb-1" />
        <div className="splash-orb splash-orb-2" />
        <div className="splash-aurora splash-aurora-a" />
        <div className="splash-aurora splash-aurora-b" />

        {/* Ember field */}
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="splash-particle"
            style={
              {
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                background: p.color,
                '--pd': `${p.dur}s`,
                '--pdelay': `${p.delay}s`,
                '--px': p.drift,
                '--po': p.peak,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Vignette: center lift, edge falloff */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 55% at 50% 44%, rgba(255,255,255,0.045) 0%, transparent 55%), radial-gradient(ellipse 130% 100% at 50% 115%, rgba(4,3,10,0.85) 0%, transparent 55%), radial-gradient(ellipse 130% 100% at 50% -15%, rgba(4,3,10,0.7) 0%, transparent 50%)',
        }}
      />

      {/* Film grain — makes the gradients read as light, not banding */}
      <div aria-hidden className="splash-grain pointer-events-none" />

      {/* The mark */}
      <div className="relative flex items-center justify-center">
        <div
          aria-hidden
          className="splash-glow pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        />
        <div aria-hidden className="splash-ring splash-ring-1" />
        <div aria-hidden className="splash-ring splash-ring-2" />

        <div className="splash-mark relative">
          <div className="splash-beat relative flex">
            <BrandLogo size={132} priority />
            <div aria-hidden className="splash-sheen" />
          </div>
        </div>
      </div>
    </div>
  );
}
