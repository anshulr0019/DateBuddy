'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      router.push('/welcome');
    }, 2600);

    return () => clearTimeout(timer);
  }, [router]);

  if (!showSplash) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen w-full max-w-[420px] mx-auto flex-col items-center justify-center overflow-hidden bg-[#0D0B18]">
      {/* Aurora on dark */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-blob aurora-blob-1" style={{ opacity: 0.7 }} />
        <div className="aurora-blob aurora-blob-2" style={{ opacity: 0.6 }} />
        <div className="aurora-blob aurora-blob-3" style={{ opacity: 0.5 }} />
        <div className="aurora-blob aurora-blob-4" style={{ opacity: 0.4 }} />
      </div>

      {/* Logo */}
      <div className="animate-logo-bloom flex flex-col items-center gap-5">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] shadow-[0_20px_60px_-10px_rgba(255,107,157,0.6)]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-[42px] font-semibold tracking-[-0.04em] text-white">Dil Se</h1>
        </div>
      </div>

      <p className="animate-tagline-rise absolute bottom-20 text-center text-[14px] font-medium tracking-[0.08em] text-white/50 uppercase">
        Meaningful Connections Begin Here
      </p>
    </div>
  );
}
