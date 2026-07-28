'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PEOPLE, Person } from '../data/mockData';
import { Ic } from '../components/icons';
import { AuroraBackground, SafeImage, PrimaryButton } from '../components/shared';
import FloatingNav from '../components/FloatingNav';

/* ─────────────────────────────────────────────────
   Scoped micro-interaction animations
───────────────────────────────────────────────── */
const DISCOVER_STYLES = `
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 8px 32px -6px rgba(255,107,157,0.45); }
    50% { box-shadow: 0 8px 40px -4px rgba(255,107,157,0.65); }
  }
  @keyframes icon-bounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.12); }
  }
  @keyframes fade-slide-up {
    0% { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes know-more-bounce {
    0%, 100% { transform: translateY(0); opacity: 0.6; }
    50% { transform: translateY(6px); opacity: 1; }
  }
  .animate-know-more {
    animation: know-more-bounce 2s ease-in-out infinite;
  }
  .animate-glow-pulse {
    animation: glow-pulse 2.4s ease-in-out infinite;
  }
  .animate-fade-slide-up {
    animation: fade-slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

export default function DiscoverPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState(PEOPLE);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [animatingSwipe, setAnimatingSwipe] = useState<'right' | 'left' | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cardKey, setCardKey] = useState(0);

  // Match Celebration Modal state
  const [matchedUser, setMatchedUser] = useState<Person | null>(null);

  // Prompt Likes state
  const [likedPrompts, setLikedPrompts] = useState<Record<string, boolean>>({});

  // Swipe gesture state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const scrollRef = useRef<HTMLDivElement>(null);
  const currentProfile = profiles[currentIndex];
  const myProfile = PEOPLE[0];

  const handleAction = useCallback((action: 'like' | 'pass' | 'super_like' | 'boost' | 'message') => {
    if (action === 'boost') return;
    if (action === 'message') {
      router.push('/messages');
      return;
    }

    const dir = action === 'pass' ? 'left' : 'right';
    setAnimatingSwipe(dir);

    // Simulate match on Like action for demo excitement
    if (action === 'like' && currentProfile) {
      setTimeout(() => {
        setMatchedUser(currentProfile);
      }, 200);
    }

    setTimeout(() => {
      setAnimatingSwipe(null);
      setDragX(0);
      setIsDragging(false);
      setCurrentPhotoIndex(0);
      setScrollProgress(0);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      setCardKey(k => k + 1);

      if (currentIndex < profiles.length - 1) {
        setCurrentIndex(c => c + 1);
      } else {
        setProfiles([]);
      }
    }, 380);
  }, [currentIndex, currentProfile, profiles.length, router]);

  const togglePromptLike = (promptKey: string) => {
    setLikedPrompts(prev => {
      const next = { ...prev, [promptKey]: !prev[promptKey] };
      if (next[promptKey] && currentProfile) {
        setMatchedUser(currentProfile);
      }
      return next;
    });
  };

  /* Pointer Gesture Handlers for Physical Card Swiping */
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scrollRef.current && scrollRef.current.scrollTop > 5) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    setDragX(deltaX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Spring-back threshold (30% of standard container width ~110px)
    if (dragX > 110) {
      handleAction('like');
    } else if (dragX < -110) {
      handleAction('pass');
    } else {
      setDragX(0);
    }
  };

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(scrollTop / (maxScroll * 0.45), 1));
    }
  }, []);

  /* ---- Empty state when all profiles are reviewed ---- */
  if (!currentProfile) {
    return (
      <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
        <style>{DISCOVER_STYLES}</style>
        <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
          <AuroraBackground subtle>
            <div className="flex-shrink-0 z-20 px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] mb-3">
              <TopBar />
            </div>
            <div className="flex-1 flex items-center justify-center px-8 z-10 my-auto min-h-[60vh]">
              <div className="rounded-[28px] border border-white/80 bg-white/85 px-8 py-10 shadow-[0_16px_48px_-12px_rgba(26,26,46,0.12)] backdrop-blur-md flex flex-col items-center w-full text-center animate-fade-slide-up">
                <div className="flex h-20 w-20 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#FF6B9D]/15 to-[#7B68EE]/15 text-[28px] mb-6 text-[#FF6B9D] ring-1 ring-[#FF6B9D]/10">
                  <Ic.Heart filled />
                </div>
                <h2 className="text-[26px] font-extrabold text-[#1A1A2E] mb-2 tracking-tight">You&apos;ve seen everyone!</h2>
                <p className="text-[15px] leading-relaxed text-[#1A1A2E]/55 mb-8 max-w-[280px]">Expand your location or preferences to discover more people nearby.</p>
                <PrimaryButton
                  onClick={() => { setProfiles(PEOPLE); setCurrentIndex(0); }}
                >
                  Reset Recommendations
                </PrimaryButton>
              </div>
            </div>
          </AuroraBackground>
          <FloatingNav />
        </div>
      </div>
    );
  }

  // Continuous fluid animation variables driven by scroll progress
  const blurAmount = scrollProgress * 14;
  const overlayOpacity = scrollProgress * 0.6;
  const detailsOpacity = Math.max(0, scrollProgress * 1.5);
  const knowMoreOpacity = Math.max(0, 1 - scrollProgress * 3.5);

  const swipeTransform = isDragging || dragX !== 0
    ? `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`
    : undefined;

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans select-none">
      <style>{DISCOVER_STYLES}</style>
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">

        {/* Background Aurora */}
        <div aria-hidden className="aurora-stage pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
        </div>

        {/* ────────────────────────────────────────────────
            REFINED TOP HEADER
        ──────────────────────────────────────────────── */}
        <div className="flex-shrink-0 z-20 px-6 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] pb-2">
          <TopBar />
        </div>

        {/* ────────────────────────────────────────────────
            PREMIUM PROFILE CARD — THE VISUAL HERO
        ──────────────────────────────────────────────── */}
        <div
          key={cardKey}
          ref={scrollRef}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            transform: swipeTransform,
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
          className={`flex-1 min-h-0 z-10 mx-6 my-1.5 overflow-y-auto overflow-x-hidden rounded-[28px] scrollbar-none touch-pan-y ${
            animatingSwipe === 'right' ? 'animate-card-swipe-right' :
            animatingSwipe === 'left' ? 'animate-card-swipe-left' :
            !isDragging && dragX === 0 ? 'animate-card-depth-enter' : ''
          }`}
        >
          <div className="relative min-h-full rounded-[28px] border border-white/80 shadow-[0_12px_40px_-12px_rgba(26,26,46,0.15)] overflow-hidden bg-white">

            {/* ── Hero Photo Container ── */}
            <div className="relative w-full h-[calc(100dvh-190px)] min-h-[440px] overflow-hidden">
              <SafeImage
                src={currentProfile.photo}
                name={currentProfile.name}
                alt={currentProfile.name}
                className="absolute inset-0 h-full w-full object-cover cursor-pointer select-none transition-[filter,transform] duration-200"
                style={{
                  filter: `blur(${blurAmount}px)`,
                  transform: `scale(${1 + scrollProgress * 0.05})`,
                }}
                onClick={(e) => {
                  if (dragX !== 0) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  if (clickX > rect.width / 2) {
                    setCurrentPhotoIndex(prev => (prev + 1) % 2);
                  } else {
                    setCurrentPhotoIndex(prev => (prev - 1 + 2) % 2);
                  }
                }}
              />

              {/* Swipe Status Overlay Badges */}
              {dragX > 30 && (
                <div className="absolute top-8 left-8 z-30 -rotate-12 rounded-2xl border-2 border-emerald-400 bg-emerald-500/15 px-5 py-1.5 backdrop-blur-xl shadow-lg">
                  <span className="text-[22px] font-black uppercase tracking-[0.15em] text-emerald-400 drop-shadow-sm">LIKE</span>
                </div>
              )}
              {dragX < -30 && (
                <div className="absolute top-8 right-8 z-30 rotate-12 rounded-2xl border-2 border-rose-400 bg-rose-500/15 px-5 py-1.5 backdrop-blur-xl shadow-lg">
                  <span className="text-[22px] font-black uppercase tracking-[0.15em] text-rose-400 drop-shadow-sm">NOPE</span>
                </div>
              )}

              {/* Dark overlay strengthening on scroll */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-150"
                style={{ background: `rgba(26,26,46,${overlayOpacity})` }}
              />

              {/* Top gradient */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/45 to-transparent pointer-events-none z-10" />

              {/* ── Premium Photo Progress Dots ── */}
              <div className="absolute top-4 left-6 right-6 flex gap-1.5 z-20">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-500 ease-out ${
                      i === currentPhotoIndex
                        ? 'h-[4px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)]'
                        : 'h-[4px] bg-white/30'
                    }`}
                  />
                ))}
              </div>

              {/* ── Hero Name & Age Overlay ── */}
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/85 via-black/35 to-transparent pt-28 pb-10 px-6 pointer-events-none">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h2 className="text-[34px] font-extrabold leading-[1.1] text-white tracking-tight drop-shadow-lg">
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  {currentProfile.verified && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6B9D] text-white text-[12px] font-bold shadow-[0_2px_8px_rgba(255,107,157,0.4)] flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </div>
                {/* Location subtitle */}
                <p className="text-white/75 text-[14px] font-medium tracking-tight mt-0.5 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {currentProfile.distance}
                </p>
              </div>

              {/* ── Refined Chevron Hint ── */}
              <div
                className="absolute bottom-4 left-0 right-0 z-20 flex justify-center pointer-events-none transition-opacity duration-300"
                style={{ opacity: knowMoreOpacity }}
              >
                <div className="animate-know-more flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-lg border border-white/25 text-white shadow-[0_4px_16px_rgba(0,0,0,0.15)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {/* ── EXPANDED PROFILE SECTION — 8-PT SPACING ── */}
            <div
              className="relative z-20 bg-white/95 backdrop-blur-md transition-opacity duration-300 pb-8"
              style={{ opacity: detailsOpacity }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-4 pb-3">
                <div className="w-10 h-1 rounded-full bg-[#1A1A2E]/10" />
              </div>

              {/* About */}
              <div className="px-6 pb-6 animate-fade-slide-up">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1A1A2E]/40 mb-3">About</h3>
                <p className="text-[#1A1A2E] text-[15px] leading-relaxed font-normal">{currentProfile.bio}</p>
              </div>

              {/* Interests */}
              <div className="px-6 pb-8 animate-fade-slide-up">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1A1A2E]/40 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-4 py-2 rounded-full bg-[#1A1A2E]/5 border border-[#1A1A2E]/8 text-[#1A1A2E]/75 text-[13px] font-medium transition-all duration-200 hover:bg-[#FF6B9D]/10 hover:border-[#FF6B9D]/20 hover:text-[#FF6B9D] cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Background */}
              <div className="px-6 pb-8 animate-fade-slide-up">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1A1A2E]/40 mb-3">Background</h3>
                <div className="space-y-3 text-[14px] text-[#1A1A2E]/75 font-normal">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1A1A2E]/5 text-[#1A1A2E]/50">
                      <Ic.Briefcase />
                    </div>
                    <span>{currentProfile.profession}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1A1A2E]/5 text-[#1A1A2E]/50">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                    </div>
                    <span>{currentProfile.education}</span>
                  </div>
                </div>
              </div>

              {/* Location & Activity */}
              <div className="px-6 pb-8 animate-fade-slide-up">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1A1A2E]/40 mb-3">Location &amp; Activity</h3>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1A1A2E]/5 border border-[#1A1A2E]/8 text-[#1A1A2E]/75 text-[13px] font-medium">
                    <Ic.MapPin />
                    {currentProfile.distance}
                  </span>
                  {currentProfile.online && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-emerald-700 text-[13px] font-medium">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      Active Now
                    </span>
                  )}
                </div>
              </div>

              {/* PROMPT-BASED LIKING */}
              {currentProfile.prompts && currentProfile.prompts.length > 0 && (
                <div className="px-6 pb-4 animate-fade-slide-up">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1A1A2E]/40 mb-3">Vibe Check</h3>
                  <div className="space-y-3">
                    {currentProfile.prompts.map((p, i) => {
                      const key = `${currentProfile.id}-${i}`;
                      const isLiked = likedPrompts[key];
                      return (
                        <div key={i} className="relative p-5 rounded-2xl bg-white border border-[#1A1A2E]/8 shadow-[0_4px_16px_-6px_rgba(26,26,46,0.06)] flex justify-between items-start gap-4 transition-all duration-200 hover:shadow-[0_8px_24px_-10px_rgba(26,26,46,0.1)]">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#1A1A2E]/40 mb-1.5">{p.q}</p>
                            <p className="text-[15px] font-semibold text-[#1A1A2E] leading-snug">{p.a}</p>
                          </div>
                          <button
                            onClick={() => togglePromptLike(key)}
                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
                              isLiked
                                ? 'bg-gradient-to-br from-[#FF6B9D] to-[#FF6B9D]/80 text-white shadow-[0_4px_12px_-2px_rgba(255,107,157,0.4)]'
                                : 'bg-[#1A1A2E]/5 text-[#1A1A2E]/35 hover:bg-[#FF6B9D]/12 hover:text-[#FF6B9D] border border-[#1A1A2E]/6'
                            }`}
                            aria-label="Like this prompt"
                          >
                            <Ic.Heart filled={isLiked} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ────────────────────────────────────────────────
            PREMIUM ACTION BUTTONS WITH SUBTLE DEPTH
        ──────────────────────────────────────────────── */}
        <div className="flex-shrink-0 flex justify-center items-center gap-6 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] px-8 z-20">
          {/* Boost — refined smaller accent */}
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
            <button
              onClick={() => handleAction('boost')}
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/90 border border-[#1A1A2E]/8 shadow-[0_4px_12px_-4px_rgba(26,26,46,0.06)] transition-all duration-200 hover:shadow-[0_8px_24px_-8px_rgba(245,158,11,0.2)] hover:border-amber-300/40 active:scale-90 cursor-pointer"
              aria-label="Boost"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:opacity-90 transition-opacity duration-200">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </button>
          </div>

          {/* Pass ❌ */}
          <div className="relative group">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-rose-400/20 to-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md" />
            <button
              onClick={() => handleAction('pass')}
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white border-2 border-[#1A1A2E]/10 shadow-[0_8px_28px_-8px_rgba(26,26,46,0.10)] transition-all duration-200 hover:shadow-[0_12px_32px_-10px_rgba(225,29,72,0.15)] hover:border-rose-300/50 active:scale-90 cursor-pointer"
              aria-label="Pass"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:opacity-90 transition-opacity duration-200">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Like ❤️ — primary CTA */}
          <div className="relative group">
            <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-[#FF6B9D]/30 to-[#7B68EE]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            <button
              onClick={() => handleAction('like')}
              className="animate-glow-pulse relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] shadow-[0_8px_32px_-6px_rgba(255,107,157,0.5)] transition-all duration-200 hover:shadow-[0_12px_40px_-8px_rgba(255,107,157,0.6)] hover:scale-105 active:scale-90 cursor-pointer"
              aria-label="Like"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-white drop-shadow-sm">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>

          {/* DM — refined smaller accent */}
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-sky-400/20 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
            <button
              onClick={() => handleAction('message')}
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/90 border border-[#1A1A2E]/8 shadow-[0_4px_12px_-4px_rgba(26,26,46,0.06)] transition-all duration-200 hover:shadow-[0_8px_24px_-8px_rgba(59,130,246,0.2)] hover:border-sky-300/40 active:scale-90 cursor-pointer"
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:opacity-90 transition-opacity duration-200">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>

        {/* STATIC FOOTER NAVIGATION BAR */}
        <FloatingNav />

        {/* ────────────────────────────────────────────────
            REFINED MATCH CELEBRATION OVERLAY
        ──────────────────────────────────────────────── */}
        {matchedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl p-6 animate-page-enter">
            <div className="w-full max-w-[360px] rounded-[28px] bg-white p-8 text-center shadow-[0_32px_80px_-16px_rgba(0,0,0,0.4)] flex flex-col items-center">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FF6B9D] bg-[#FF6B9D]/8 px-4 py-1.5 rounded-full">✨ New Connection</div>
              <h2 className="text-[32px] font-extrabold text-[#1A1A2E] mb-1 tracking-tight">It&apos;s a Match!</h2>
              <p className="text-[14px] text-[#1A1A2E]/55 mb-8">You and {matchedUser.name.split(' ')[0]} liked each other.</p>

              {/* Photos with premium treatment */}
              <div className="relative mb-8 flex items-center justify-center">
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-[3px] border-white shadow-[0_8px_24px_-6px_rgba(26,26,46,0.2)] z-10 -mr-5">
                  <SafeImage src={myProfile.photo} name={myProfile.name} alt={myProfile.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/5 pointer-events-none" />
                </div>
                <div className="relative h-28 w-28 overflow-hidden rounded-full border-[3px] border-white shadow-[0_8px_24px_-6px_rgba(26,26,46,0.2)] z-0">
                  <SafeImage src={matchedUser.photo} name={matchedUser.name} alt={matchedUser.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/5 pointer-events-none" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_4px_16px_-2px_rgba(255,107,157,0.5)] animate-bounce">
                  <Ic.Heart filled />
                </div>
              </div>

              <div className="w-full space-y-3">
                <PrimaryButton onClick={() => { setMatchedUser(null); router.push('/messages'); }}>
                  Send a Message
                </PrimaryButton>
                <button
                  onClick={() => setMatchedUser(null)}
                  className="w-full py-3 text-[14px] font-semibold text-[#1A1A2E]/50 hover:text-[#1A1A2E] transition-colors cursor-pointer"
                >
                  Keep Discovering
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   REFINED TOPBAR
───────────────────────────────────────────────── */
function TopBar() {
  return (
    <header className="flex items-center justify-between rounded-2xl border border-white/75 bg-white/70 px-5 py-2.5 shadow-[0_6px_24px_-8px_rgba(26,26,46,0.08)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_4px_12px_-2px_rgba(255,107,157,0.35)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <div>
          <span className="text-[17px] font-extrabold tracking-tight text-[#1A1A2E] leading-none block">Dil Se</span>
          <span className="text-[10px] font-medium text-[#1A1A2E]/35 tracking-tight leading-none">Discover</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#1A1A2E]/8 bg-white/80 text-[#1A1A2E]/60 hover:bg-[#FAFAF7] hover:text-[#1A1A2E]/80 active:scale-90 shadow-[0_2px_8px_-4px_rgba(26,26,46,0.06)] transition-all duration-200 cursor-pointer">
          <Ic.Bell />
          <span className="absolute -top-0.5 -right-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#FF6B9D]/80 text-[9px] font-bold text-white ring-[2.5px] ring-white shadow-sm px-1">
            3
          </span>
        </button>
        <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1A1A2E]/8 bg-white/80 text-[#1A1A2E]/60 hover:bg-[#FAFAF7] hover:text-[#1A1A2E]/80 active:scale-90 shadow-[0_2px_8px_-4px_rgba(26,26,46,0.06)] transition-all duration-200 cursor-pointer">
          <Ic.Filter />
        </button>
      </div>
    </header>
  );
}
