'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallBanner() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check if already running in standalone PWA mode
    const isStandaloneMode =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as unknown as { standalone?: boolean })?.standalone === true;

    setIsStandalone(Boolean(isStandaloneMode));
    if (isStandaloneMode) return;

    // 2. Check if iOS Safari
    const ua = window.navigator?.userAgent?.toLowerCase() || '';
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|android/.test(ua);
    setIsIOS(isIosDevice && isSafari);

    // 3. Check snooze storage (snooze for 7 days if dismissed)
    try {
      const dismissedUntil = localStorage.getItem('infyn_pwa_dismissed_until');
      if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
        return;
      }
    } catch {
      /* localStorage unavailable/disabled */
    }

    // 4. Capture native Android / Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show after brief delay on core app pages
    let timer: NodeJS.Timeout | null = null;
    if (isIosDevice && isSafari) {
      timer = setTimeout(() => {
        setIsVisible(true);
      }, 3500);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Safe path check: handle null pathname safely during SSR/hydration
  const currentPath = pathname || '';
  const HIDDEN_PREFIXES = ['/onboarding', '/verification', '/verify-otp', '/welcome'];
  const isHiddenPage =
    !currentPath ||
    currentPath === '/' ||
    HIDDEN_PREFIXES.some(prefix => currentPath.startsWith(prefix));

  if (isStandalone || !isVisible || isHiddenPage) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsVisible(false);
        }
      } catch {
        /* User cancelled or prompt failed */
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      // Snooze for 7 days
      const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;
      localStorage.setItem('infyn_pwa_dismissed_until', String(nextWeek));
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {/* Floating Glass Banner */}
      <div className="fixed bottom-[calc(4.8rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 flex justify-center px-4 pointer-events-none animate-page-enter">
        <div
          className="pointer-events-auto relative w-full max-w-[390px] sm:max-w-[440px] md:max-w-[500px] flex items-center justify-between gap-3 rounded-[22px] p-3.5 shadow-[0_12px_36px_-8px_rgba(0,0,0,0.45)] border border-white/15 backdrop-blur-xl select-none"
          style={{
            background: 'linear-gradient(135deg, rgba(18,18,24,0.92) 0%, rgba(26,20,32,0.95) 100%)',
          }}
        >
          {/* Logo / App Mark */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] text-white text-lg font-black shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #FF6B9D 0%, #7B68EE 100%)',
              }}
            >
              ✦
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[13.5px] font-bold text-white leading-tight">Install Infyn</p>
                <span className="rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] px-1.5 py-0.2 text-[9px] font-extrabold text-white">
                  Fast
                </span>
              </div>
              <p className="text-[11.5px] text-white/55 leading-tight truncate mt-0.5">
                Full-screen app & instant notifications
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="px-2.5 py-2 text-[12px] font-semibold text-white/45 hover:text-white/70 active:scale-95 transition-all cursor-pointer"
            >
              Later
            </button>
            <button
              onClick={handleInstallClick}
              className="rounded-xl px-3.5 py-2 text-[12.5px] font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              style={{
                background: 'linear-gradient(135deg, #FF6B9D 0%, #7B68EE 100%)',
              }}
            >
              <span>Install</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Guided Visual Modal */}
      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none"
        >
          <div
            onClick={() => setShowIOSGuide(false)}
            className="absolute inset-0"
          />

          <div
            className="relative z-10 w-full max-w-[420px] rounded-t-[32px] sm:rounded-[32px] p-6 text-center text-white border border-white/10 shadow-2xl flex flex-col items-center animate-sheet-up"
            style={{
              background: 'linear-gradient(160deg, #181422 0%, #0d0c13 100%)',
            }}
          >
            {/* Drag Handle */}
            <div className="h-1 w-10 rounded-full bg-white/20 mb-4" />

            {/* App Icon */}
            <div
              className="flex h-16 w-16 items-center justify-center rounded-[20px] text-white text-2xl font-black shadow-lg mb-3"
              style={{
                background: 'linear-gradient(135deg, #FF6B9D 0%, #7B68EE 100%)',
              }}
            >
              ✦
            </div>

            <h3 className="text-[20px] font-extrabold tracking-tight text-white mb-1.5">
              Add Infyn to Home Screen
            </h3>
            <p className="text-[13px] text-white/60 leading-relaxed mb-6 max-w-[280px]">
              Enjoy the full-screen native app experience directly on your iPhone.
            </p>

            {/* Steps Visual */}
            <div className="w-full space-y-3 mb-6 text-left">
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-[14px]">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-white">
                    Tap the <span className="text-[#FF6B9D]">Share</span> button
                  </p>
                  <p className="text-[11.5px] text-white/50">At the bottom of your Safari screen</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6B9D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </div>

              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white/[0.06] border border-white/10">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-[14px]">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-white">
                    Select <span className="text-[#7B68EE]">Add to Home Screen</span>
                  </p>
                  <p className="text-[11.5px] text-white/50">Scroll down the share menu options</p>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7B68EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSGuide(false);
                handleDismiss();
              }}
              className="w-full py-3.5 rounded-2xl bg-white text-[#121217] font-bold text-[14.5px] active:scale-95 transition-all cursor-pointer shadow-lg"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
