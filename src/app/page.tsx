'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo, { BRAND_NAME } from './components/BrandLogo';

// Timeline (ms). The iris uses the same cream as the app background, so the
// final frame of the splash is the first frame of the next screen.
const IRIS_AT = 1150;
const NAVIGATE_AT = 1600;
const REDUCED_IRIS_AT = 700;
const REDUCED_NAVIGATE_AT = 900;
const SEEN_KEY = 'infyn_splash_seen';

type Phase = 'intro' | 'iris' | 'skip';

export default function SplashScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');

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

    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch { /* storage unavailable: play the intro */ }

    if (seen) {
      setPhase('skip');
      router.replace(destination);
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const irisTimer = setTimeout(() => setPhase('iris'), reduced ? REDUCED_IRIS_AT : IRIS_AT);
    const navTimer = setTimeout(() => router.replace(destination), reduced ? REDUCED_NAVIGATE_AT : NAVIGATE_AT);
    return () => {
      clearTimeout(irisTimer);
      clearTimeout(navTimer);
    };
  }, [router]);

  return (
    <div
      role="status"
      aria-label={`${BRAND_NAME} is starting`}
      className={`splash-root fixed inset-0 z-50 overflow-hidden ${phase === 'skip' ? 'splash-skip' : ''}`}
    >
      <div aria-hidden className="splash-glow" />
      <div aria-hidden className={`splash-iris ${phase === 'iris' ? 'splash-iris-open' : ''}`} />

      <div className={`splash-stack ${phase === 'iris' ? 'splash-stack-out' : ''}`}>
        <div className="splash-mark">
          <div className="splash-beat">
            <BrandLogo size={120} priority />
          </div>
        </div>
        <p className="splash-wordmark" aria-hidden>{BRAND_NAME}</p>
      </div>
    </div>
  );
}
