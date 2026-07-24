'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PEOPLE, Person } from '../data/mockData';
import { Ic } from '../components/icons';
import { AuroraBackground, SafeImage, PrimaryButton } from '../components/shared';
import FloatingNav from '../components/FloatingNav';

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
      <div className="h-[100dvh] w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
        <div className="relative h-full w-full max-w-[420px] flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
          <AuroraBackground subtle>
            <div className="flex-shrink-0 z-20 px-4 pt-4 mb-3">
              <TopBar />
            </div>
            <div className="flex-1 flex items-center justify-center px-6 z-10 my-auto min-h-[60vh]">
              <div className="rounded-[24px] border border-white/80 bg-white/80 p-8 shadow-lg backdrop-blur-md flex flex-col items-center w-full text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF6B9D]/10 text-2xl mb-4 text-[#FF6B9D]">
                  <Ic.Heart filled />
                </div>
                <h2 className="text-xl font-bold text-[#1A1A2E] mb-2 tracking-tight">You&apos;ve seen everyone!</h2>
                <p className="text-[14px] leading-relaxed text-[#1A1A2E]/60 mb-6">Expand your location or preferences to discover more people nearby.</p>
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
  const overlayOpacity = scrollProgress * 0.65;
  const detailsOpacity = Math.max(0, scrollProgress * 1.5);
  const knowMoreOpacity = Math.max(0, 1 - scrollProgress * 3.5);

  const swipeTransform = isDragging || dragX !== 0
    ? `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`
    : undefined;

  return (
    <div className="h-[100dvh] w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans select-none">
      <div className="relative h-full w-full max-w-[420px] flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        
        {/* Background Aurora */}
        <div aria-hidden className="aurora-stage pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
        </div>

        {/* STATIC TOP HEADER */}
        <div className="flex-shrink-0 z-20 px-4 pt-3 pb-1">
          <TopBar />
        </div>

        {/* SCROLLABLE / SWIPABLE CARD AREA */}
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
          className={`flex-1 min-h-0 z-10 mx-4 my-1 overflow-y-auto overflow-x-hidden rounded-[24px] scrollbar-none touch-pan-y ${
            animatingSwipe === 'right' ? 'animate-card-swipe-right' :
            animatingSwipe === 'left' ? 'animate-card-swipe-left' :
            !isDragging && dragX === 0 ? 'animate-card-depth-enter' : ''
          }`}
        >
          <div className="relative min-h-full rounded-[24px] border border-white/80 shadow-md overflow-hidden bg-white">

            {/* Hero Photo Container */}
            <div className="relative w-full h-[calc(100vh-190px)] min-h-[460px] overflow-hidden">
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
                <div className="absolute top-8 left-8 z-30 rotate-[-12deg] rounded-xl border-2 border-emerald-500 bg-emerald-500/20 px-4 py-1 backdrop-blur-md">
                  <span className="text-xl font-bold uppercase tracking-wider text-emerald-500">LIKE</span>
                </div>
              )}
              {dragX < -30 && (
                <div className="absolute top-8 right-8 z-30 rotate-[12deg] rounded-xl border-2 border-rose-500 bg-rose-500/20 px-4 py-1 backdrop-blur-md">
                  <span className="text-xl font-bold uppercase tracking-wider text-rose-500">PASS</span>
                </div>
              )}

              {/* Dark overlay strengthening on scroll */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-150"
                style={{ background: `rgba(26,26,46,${overlayOpacity})` }}
              />

              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />

              {/* Photo progress bar indicator */}
              <div className="absolute top-3 left-0 right-0 flex gap-1.5 px-4 z-20">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
                      i === currentPhotoIndex ? 'bg-white shadow-sm' : 'bg-white/35'
                    }`}
                  />
                ))}
              </div>

              {/* INITIAL VIEW PHOTO OVERLAY */}
              <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-28 pb-14 px-6 pointer-events-none">
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <h2 className="text-[32px] font-bold leading-none text-white tracking-tight drop-shadow-md">
                    {currentProfile.name}, {currentProfile.age}
                  </h2>
                  {currentProfile.verified && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF6B9D] text-white text-[11px] font-bold shadow-md flex-shrink-0">
                      ✓
                    </span>
                  )}
                </div>
              </div>

              {/* CHEVRON HINT */}
              <div
                className="absolute bottom-3 left-0 right-0 z-20 flex justify-center pointer-events-none transition-opacity duration-300"
                style={{ opacity: knowMoreOpacity }}
              >
                <div className="animate-know-more flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </div>
              </div>
            </div>

            {/* EXPANDED PROFILE SECTION — PHASE 2 RESTRAINED HEADERS */}
            <div
              className="relative z-20 bg-white/95 backdrop-blur-md transition-opacity duration-300 pb-10"
              style={{ opacity: detailsOpacity }}
            >
              <div className="flex justify-center pt-3 pb-3">
                <div className="w-10 h-1 rounded-full bg-[#1A1A2E]/15" />
              </div>

              {/* About */}
              <div className="px-6 pb-5 animate-page-enter">
                <h3 className="text-[13px] font-semibold text-[#1A1A2E]/50 mb-2">About</h3>
                <p className="text-[#1A1A2E] text-[15px] leading-relaxed font-normal">{currentProfile.bio}</p>
              </div>

              {/* Interests */}
              <div className="px-6 pb-5 animate-page-enter">
                <h3 className="text-[13px] font-semibold text-[#1A1A2E]/50 mb-2.5">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {currentProfile.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#1A1A2E]/5 border border-[#1A1A2E]/10 text-[#1A1A2E]/80 text-[13px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Background */}
              <div className="px-6 pb-5 animate-page-enter">
                <h3 className="text-[13px] font-semibold text-[#1A1A2E]/50 mb-2.5">Background</h3>
                <div className="space-y-2.5 text-[14px] text-[#1A1A2E]/80 font-normal">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1A1A2E]/5 text-[#1A1A2E]/60">
                      <Ic.Briefcase />
                    </div>
                    <span>{currentProfile.profession}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1A1A2E]/5 text-[#1A1A2E]/60">
                      <Ic.User />
                    </div>
                    <span>{currentProfile.education}</span>
                  </div>
                </div>
              </div>

              {/* Location & Activity */}
              <div className="px-6 pb-5 animate-page-enter">
                <h3 className="text-[13px] font-semibold text-[#1A1A2E]/50 mb-2.5">Location & Activity</h3>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1A2E]/5 border border-[#1A1A2E]/10 text-[#1A1A2E]/80 text-[12px] font-medium">
                    <Ic.MapPin />
                    {currentProfile.distance}
                  </span>
                  {currentProfile.online && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-glow" />
                      Active Now
                    </span>
                  )}
                </div>
              </div>

              {/* PROMPT-BASED LIKING (Item 14) */}
              {currentProfile.prompts && currentProfile.prompts.length > 0 && (
                <div className="px-6 pb-4 animate-page-enter">
                  <h3 className="text-[13px] font-semibold text-[#1A1A2E]/50 mb-2.5">Vibe Check</h3>
                  <div className="space-y-3">
                    {currentProfile.prompts.map((p, i) => {
                      const key = `${currentProfile.id}-${i}`;
                      const isLiked = likedPrompts[key];
                      return (
                        <div key={i} className="relative p-4 rounded-2xl bg-white border border-[#1A1A2E]/10 shadow-sm flex justify-between items-start">
                          <div>
                            <p className="text-[12px] font-medium text-[#1A1A2E]/50 mb-1">{p.q}</p>
                            <p className="text-[15px] font-semibold text-[#1A1A2E] leading-snug">{p.a}</p>
                          </div>
                          <button
                            onClick={() => togglePromptLike(key)}
                            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
                              isLiked ? 'bg-[#FF6B9D] text-white shadow-sm' : 'bg-[#1A1A2E]/5 text-[#1A1A2E]/40 hover:bg-[#FF6B9D]/15 hover:text-[#FF6B9D]'
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

        {/* FOOTER ACTION BUTTONS REGION */}
        <div className="flex-shrink-0 flex justify-center items-center gap-4 pt-2 pb-24 px-6 z-20">
          <button
            onClick={() => handleAction('boost')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 border border-[#1A1A2E]/10 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Boost"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </button>

          {/* Pass ❌ */}
          <button
            onClick={() => handleAction('pass')}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-[#1A1A2E]/15 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Pass"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Direct Message 💬 */}
          <button
            onClick={() => handleAction('message')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 border border-[#1A1A2E]/10 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>

          {/* Like ❤️ — Gradient retained for primary Like action per Phase 2 rules */}
          <button
            onClick={() => handleAction('like')}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] shadow-[0_8px_25px_-6px_rgba(255,107,157,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Like"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>

        {/* STATIC FOOTER NAVIGATION BAR */}
        <FloatingNav />

        {/* IT'S A MATCH CELEBRATION OVERLAY (Item 10) */}
        {matchedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-page-enter">
            <div className="w-full max-w-[360px] rounded-[24px] bg-white p-6 text-center shadow-2xl flex flex-col items-center">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#FF6B9D]">✨ New Connection</div>
              <h2 className="text-3xl font-extrabold text-[#1A1A2E] mb-1">It&apos;s a Match!</h2>
              <p className="text-[14px] text-[#1A1A2E]/60 mb-6">You and {matchedUser.name.split(' ')[0]} liked each other.</p>

              {/* Photos */}
              <div className="relative mb-8 flex items-center justify-center">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-md z-10 -mr-4">
                  <SafeImage src={myProfile.photo} name={myProfile.name} alt={myProfile.name} className="h-full w-full object-cover" />
                </div>
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-md z-0">
                  <SafeImage src={matchedUser.photo} name={matchedUser.name} alt={matchedUser.name} className="h-full w-full object-cover" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B9D] text-white shadow-md animate-bounce">
                  <Ic.Heart filled />
                </div>
              </div>

              <div className="w-full space-y-2.5">
                <PrimaryButton onClick={() => { setMatchedUser(null); router.push('/messages'); }}>
                  Send a Message
                </PrimaryButton>
                <button
                  onClick={() => setMatchedUser(null)}
                  className="w-full py-3 text-[14px] font-semibold text-[#1A1A2E]/60 hover:text-[#1A1A2E] transition-colors cursor-pointer"
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

function TopBar() {
  return (
    <header className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF6B9D] text-white shadow-sm">
          <Ic.Heart filled />
        </div>
        <span className="text-base font-bold tracking-tight text-[#1A1A2E]">Dil Se</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[#1A1A2E]/10 bg-white text-[#1A1A2E]/70 hover:bg-[#FAFAF7] active:scale-95 shadow-sm cursor-pointer">
          <Ic.Bell />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B9D] text-[9px] font-bold text-white ring-2 ring-white">
            3
          </span>
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1A1A2E]/10 bg-white text-[#1A1A2E]/70 hover:bg-[#FAFAF7] active:scale-95 shadow-sm cursor-pointer">
          <Ic.Settings />
        </button>
      </div>
    </header>
  );
}
