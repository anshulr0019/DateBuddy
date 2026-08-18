'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SafeImage } from './shared';
import { Ic } from './icons';
import { hapticSuccess, hapticMedium } from '../lib/haptics';

export interface MatchedUser {
  id: number;
  name: string;
  photo: string | null;
  verified?: boolean;
}

interface MatchScreenProps {
  isOpen: boolean;
  matchedUser: MatchedUser | null;
  myPhoto: string | null;
  myName?: string;
  onClose: () => void;
  onSendMessage?: () => void;
}

const CONFETTI_COLORS = [
  '#FF6B9D',
  '#7B68EE',
  '#FF8C42',
  '#FFD166',
  '#06D6A0',
  '#F43F5E',
  '#EC4899',
  '#A855F7',
];

export function MatchScreen({
  isOpen,
  matchedUser,
  myPhoto,
  myName = 'You',
  onClose,
  onSendMessage,
}: MatchScreenProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      hapticSuccess();
    }
  }, [isOpen]);

  // Generate stable confetti particles
  const particles = useMemo(() => {
    return Array.from({ length: 32 }).map((_, i) => {
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const left = `${(i * 3.1) % 96 + 2}%`;
      const size = (i % 3 === 0 ? 10 : i % 2 === 0 ? 8 : 6) + (i % 4);
      const animDuration = 2.2 + (i % 5) * 0.4;
      const animDelay = (i % 8) * 0.15;
      const isCircle = i % 3 === 0;
      const rotate = `${(i * 45) % 360}deg`;

      return {
        id: i,
        color,
        left,
        size,
        animDuration,
        animDelay,
        isCircle,
        rotate,
      };
    });
  }, []);

  if (!isOpen || !matchedUser) return null;

  const partnerFirstName = matchedUser.name ? matchedUser.name.split(' ')[0] : 'your match';

  const handleChat = () => {
    hapticMedium();
    if (onSendMessage) {
      onSendMessage();
    } else {
      onClose();
      router.push('/messages');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 overflow-hidden animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-label="It's a Match!"
    >
      {/* ── CSS Confetti & Sparkles Overlay ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute -top-6 animate-confetti-fall opacity-90"
            style={{
              left: p.left,
              width: `${p.size}px`,
              height: p.isCircle ? `${p.size}px` : `${p.size * 1.6}px`,
              backgroundColor: p.color,
              borderRadius: p.isCircle ? '50%' : '3px',
              animationDuration: `${p.animDuration}s`,
              animationDelay: `${p.animDelay}s`,
              transform: `rotate(${p.rotate})`,
              boxShadow: `0 0 10px ${p.color}80`,
            }}
          />
        ))}
      </div>

      {/* ── Ambient Radial Glows ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#FF6B9D]/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#7B68EE]/25 blur-[90px]" />
      </div>

      {/* ── Main Modal Card ── */}
      <div className="relative w-full max-w-[380px] rounded-[36px] bg-gradient-to-b from-white/12 to-white/5 border border-white/20 p-6 sm:p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex flex-col items-center animate-scale-up">
        
        {/* Glow Tag */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF6B9D]/25 to-[#7B68EE]/25 border border-white/20 text-white text-[12px] font-extrabold uppercase tracking-widest mb-4 shadow-[0_0_20px_rgba(255,107,157,0.3)]">
          <span className="text-[14px]">✨</span> Mutual Match
        </div>

        {/* Title */}
        <h1 className="text-[36px] sm:text-[40px] font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B9D] via-[#FFA07A] to-[#7B68EE] mb-2 drop-shadow-sm">
          It&apos;s a Match!
        </h1>
        <p className="text-[14px] text-white/80 font-medium mb-7">
          You and <span className="text-white font-bold">{partnerFirstName}</span> liked each other
        </p>

        {/* ── Avatars Container ── */}
        <div className="relative flex items-center justify-center mb-8 py-2">
          {/* Pulsing Ripple Rings Behind Heart */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#FF6B9D]/30 animate-ping" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-[#7B68EE]/20 animate-pulse" />

          {/* User's Photo */}
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-[3.5px] border-white shadow-[0_10px_30px_rgba(255,107,157,0.4)] z-10 -mr-6 ring-4 ring-[#FF6B9D]/30 transform -rotate-3 transition-transform hover:scale-105">
            <SafeImage
              src={myPhoto ?? undefined}
              name={myName}
              alt="Your profile photo"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Partner's Photo */}
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-[3.5px] border-white shadow-[0_10px_30px_rgba(123,104,238,0.4)] z-10 ring-4 ring-[#7B68EE]/30 transform rotate-3 transition-transform hover:scale-105">
            <SafeImage
              src={matchedUser.photo ?? undefined}
              name={matchedUser.name}
              alt={`${matchedUser.name}'s profile photo`}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Glowing Center Heart */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#FF6B9D] via-[#F43F5E] to-[#FF8C42] text-white shadow-[0_0_25px_rgba(244,63,94,0.8)] border-2 border-white transform hover:scale-110 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="w-full space-y-3 z-10">
          <button
            onClick={handleChat}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[15px] font-black tracking-wide shadow-[0_10px_28px_-6px_rgba(255,107,157,0.6)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Send a Message
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 text-[14px] font-bold text-white/60 hover:text-white/90 active:scale-[0.98] transition-all cursor-pointer"
          >
            Keep Swiping
          </button>
        </div>

      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          85% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(105vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall linear infinite;
        }
        @keyframes scale-up {
          0% {
            opacity: 0;
            transform: scale(0.85) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-scale-up {
          animation: scale-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
