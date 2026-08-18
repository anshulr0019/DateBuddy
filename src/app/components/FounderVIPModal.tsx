'use client';

import React from 'react';
import { hapticMedium, hapticSuccess } from '../lib/haptics';

interface FounderVIPModalProps {
  isOpen: boolean;
  founderNumber?: number;
  onClose: () => void;
}

export function FounderVIPModal({ isOpen, founderNumber = 1, onClose }: FounderVIPModalProps) {
  if (!isOpen) return null;

  const handleShare = async () => {
    hapticMedium();
    const shareData = {
      title: 'Infyn VIP Founder Gold',
      text: `I just unlocked Free Lifetime VIP Gold on @app.infyn as Founder Member #${founderNumber}! First 500 members get it free ✨`,
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      navigator.clipboard?.writeText?.(shareData.text);
      alert('Copied to clipboard! Share on your Instagram story ✨');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-5 bg-black/85 backdrop-blur-xl animate-fade-in select-none"
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-gradient-to-r from-[#FF6B9D]/30 to-[#7B68EE]/30 blur-[90px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-amber-400/20 blur-[80px]" />
      </div>

      {/* Main Glass Card */}
      <div className="relative w-full max-w-sm rounded-[36px] bg-[#121217]/95 border border-white/20 p-7 text-center shadow-[0_20px_70px_rgba(0,0,0,0.9)] flex flex-col items-center animate-scale-up overflow-hidden">
        {/* Top Gold Shimmer Vignette */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-400/15 via-rose-500/10 to-transparent pointer-events-none" />

        {/* Floating Crown Icon with Pulsing Halo */}
        <div className="relative mb-3.5 mt-2">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 to-[#FF6B9D] blur-xl opacity-60 animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500/30 via-rose-500/30 to-purple-500/30 border border-amber-300/50 shadow-2xl text-[42px]">
            👑
          </div>
        </div>

        {/* Founder Pill Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-400/40 text-amber-300 text-[11.5px] font-black uppercase tracking-wider mb-2.5 shadow-sm">
          <span>✦ VIP Founder #{founderNumber} of 500 ✦</span>
        </div>

        {/* Title */}
        <h2 className="text-[26px] font-black text-white leading-tight tracking-tight mb-2">
          Lifetime Gold Unlocked! ✨
        </h2>

        {/* Subtitle */}
        <p className="text-[13.5px] text-white/70 leading-relaxed mb-5 max-w-[280px]">
          Because you joined early, you get <strong className="text-white">Free Lifetime Infyn Gold</strong> with zero limits forever.
        </p>

        {/* Perks Grid */}
        <div className="w-full space-y-2 mb-6 text-left">
          {[
            { icon: '♾️', title: 'Unlimited Swipes', desc: 'No daily like limits ever' },
            { icon: '👀', title: 'See Who Liked You', desc: 'Instant match with anyone' },
            { icon: '⭐', title: '5 Daily Super Likes', desc: 'Stand out from the crowd' },
            { icon: '👑', title: 'Founder VIP Badge', desc: 'Permanent gold badge on profile' },
          ].map((perk) => (
            <div
              key={perk.title}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10"
            >
              <span className="text-[20px]">{perk.icon}</span>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-white leading-none">{perk.title}</p>
                <p className="text-[11px] text-white/50 leading-none mt-1">{perk.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <button
            onClick={() => {
              hapticSuccess();
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white font-extrabold text-[15px] shadow-[0_8px_25px_rgba(255,107,157,0.4)] active:scale-95 transition-all cursor-pointer"
          >
            Start Finding Your Vibe ✨
          </button>

          <button
            onClick={handleShare}
            className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/80 font-bold text-[12.5px] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>📲</span>
            <span>Share Founder Status</span>
          </button>
        </div>
      </div>
    </div>
  );
}
