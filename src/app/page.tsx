'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo, { BRAND_NAME } from './components/BrandLogo';

const HOLD_MS = 1400;
const HOLD_REDUCED_MS = 900;
const EXIT_MS = 350;

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
    <main
      role="status"
      aria-label={`${BRAND_NAME} is starting`}
      className={`splash-root relative mx-auto flex h-dvh max-h-dvh w-full max-w-[440px] flex-col items-center justify-center overflow-hidden bg-[#0D0B18] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] sm:max-w-lg md:max-w-xl ${
        exiting ? 'splash-exit' : ''
      }`}
    >
      {/* Restrained aurora — system opacities, slow drift */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
      </div>

      {/* Soft vignette so the center reads brighter than the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 50% 42%, rgba(255,255,255,0.04) 0%, transparent 55%), radial-gradient(ellipse 120% 90% at 50% 110%, rgba(13,11,24,0.9) 0%, transparent 60%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-7">
        {/* Ambient glow breathing behind the mark */}
        <div
          aria-hidden
          className="splash-glow pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,107,157,0.26) 0%, rgba(123,104,238,0.16) 45%, transparent 70%)',
            filter: 'blur(44px)',
          }}
        />

        <div className="splash-mark relative">
          <BrandLogo size={118} priority />
        </div>

        <div className="relative text-center">
          <h1 className="splash-wordmark text-[38px] font-semibold tracking-[-0.035em] text-white">
            {BRAND_NAME}
          </h1>
        </div>
      </div>

      <p className="splash-tagline absolute bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] px-4 text-center text-[13px] font-medium uppercase tracking-[0.14em] text-white/45">
        Meaningful Connections Begin Here
      </p>
    </main>
  );
}
