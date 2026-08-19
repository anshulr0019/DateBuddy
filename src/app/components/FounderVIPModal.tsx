'use client';

import React, { useEffect, useRef } from 'react';
import { hapticMedium, hapticSuccess } from '../lib/haptics';

interface EarlyVIPModalProps {
  isOpen: boolean;
  memberNumber?: number;
  founderNumber?: number;
  onClose: () => void;
}

// Floating particle canvas for luxury feel
function GoldParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    type Particle = { x: number; y: number; vy: number; vx: number; size: number; opacity: number; hue: number };
    const particles: Particle[] = Array.from({ length: 38 }, () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 80,
      vy: -(0.4 + Math.random() * 0.9),
      vx: (Math.random() - 0.5) * 0.4,
      size: 1.5 + Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.7,
      hue: 38 + Math.random() * 30, // gold to warm orange
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y += p.vy;
        p.x += p.vx;
        p.opacity -= 0.003;
        if (p.y < -10 || p.opacity <= 0) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
          p.opacity = 0.4 + Math.random() * 0.6;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = `hsl(${p.hue}, 90%, 65%)`;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 70%)`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />;
}

export function FounderVIPModal({ isOpen, memberNumber, founderNumber, onClose }: EarlyVIPModalProps) {
  const num = memberNumber ?? founderNumber ?? 1;
  if (!isOpen) return null;

  const handleShare = async () => {
    hapticMedium();
    const shareData = {
      title: 'Infyn VIP Member',
      text: `I just unlocked Free Lifetime VIP Gold on @app.infyn as Early Member #${num}! First 500 members get it free ✨`,
      url: window.location.origin,
    };

    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      navigator.clipboard?.writeText?.(shareData.text);
      alert('Copied to clipboard! Share on your Instagram story ✨');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-5 bg-black/90 backdrop-blur-2xl select-none"
      style={{ animation: 'vipFadeIn 0.35s ease forwards' }}
    >
      <style>{`
        @keyframes vipFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes vipCardIn { from { opacity:0; transform: translateY(32px) scale(0.92) } to { opacity:1; transform: translateY(0) scale(1) } }
        @keyframes goldShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes crownFloat {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes perkSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes ringPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.12); }
        }
        .vip-badge-shimmer {
          background: linear-gradient(105deg, #f59e0b 0%, #fcd34d 30%, #fbbf24 45%, #fff8e1 55%, #f59e0b 70%, #d97706 100%);
          background-size: 200% auto;
          animation: goldShimmer 2.8s linear infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .crown-float { animation: crownFloat 3.2s ease-in-out infinite; }
        .ring-pulse-1 { animation: ringPulse 2.2s ease-in-out infinite; }
        .ring-pulse-2 { animation: ringPulse 2.2s ease-in-out infinite 0.7s; }
        .perk-item-0 { animation: perkSlideIn 0.5s ease 0.35s both; }
        .perk-item-1 { animation: perkSlideIn 0.5s ease 0.45s both; }
        .perk-item-2 { animation: perkSlideIn 0.5s ease 0.55s both; }
        .perk-item-3 { animation: perkSlideIn 0.5s ease 0.65s both; }
      `}</style>

      {/* Deep ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, #FF6B9D 40%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7B68EE 0%, transparent 70%)' }} />
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-[40px] text-center flex flex-col items-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1a1520 0%, #0f0e15 60%, #160f1a 100%)',
          border: '1px solid rgba(245,158,11,0.25)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(245,158,11,0.08)',
          animation: 'vipCardIn 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s both',
          padding: '32px 28px 28px',
        }}
      >
        {/* Gold particle canvas */}
        <GoldParticles />

        {/* Top gold vignette */}
        <div className="absolute top-0 inset-x-0 h-36 pointer-events-none" aria-hidden
          style={{ background: 'linear-gradient(180deg, rgba(245,158,11,0.18) 0%, rgba(251,191,36,0.06) 60%, transparent 100%)' }} />

        {/* Border top accent line */}
        <div className="absolute top-0 left-[15%] right-[15%] h-[2px] rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #fbbf24, #fff8dc, #fbbf24, transparent)' }} aria-hidden />

        {/* Crown with animated rings */}
        <div className="relative mb-4 mt-1 z-10">
          {/* Outer ring */}
          <div className="ring-pulse-1 absolute inset-[-18px] rounded-full border border-amber-400/20" />
          {/* Middle ring */}
          <div className="ring-pulse-2 absolute inset-[-9px] rounded-full border border-amber-400/30" />
          {/* Crown icon box */}
          <div className="crown-float relative flex h-[88px] w-[88px] items-center justify-center rounded-[28px] text-[46px]"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(251,191,36,0.12) 50%, rgba(217,119,6,0.2) 100%)',
              border: '1.5px solid rgba(251,191,36,0.4)',
              boxShadow: '0 0 0 1px rgba(245,158,11,0.12), 0 8px 32px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            👑
          </div>
        </div>

        {/* Member number badge */}
        <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-3"
          style={{
            background: 'linear-gradient(105deg, rgba(245,158,11,0.15) 0%, rgba(251,191,36,0.08) 100%)',
            border: '1px solid rgba(251,191,36,0.35)',
            boxShadow: '0 2px 12px rgba(245,158,11,0.15)',
          }}
        >
          <span className="text-[11px] font-black uppercase tracking-[0.15em] vip-badge-shimmer">
            ✦ Early VIP Member #{num} of 500 ✦
          </span>
        </div>

        {/* Title with shimmer */}
        <h2 className="relative z-10 text-[26px] font-black leading-tight tracking-tight mb-2"
          style={{ color: '#fff', textShadow: '0 2px 20px rgba(245,158,11,0.3)' }}
        >
          Lifetime Gold{' '}
          <span className="vip-badge-shimmer">Unlocked!</span>
        </h2>

        {/* Subtitle */}
        <p className="relative z-10 text-[13px] leading-relaxed mb-5 max-w-[270px]"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          Because you joined early, you get{' '}
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>Free Lifetime Infyn Gold</span>{' '}
          — unlimited connections, forever.
        </p>

        {/* Divider */}
        <div className="relative z-10 w-full h-px mb-4"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.25), transparent)' }} />

        {/* Perks */}
        <div className="relative z-10 w-full space-y-2 mb-6 text-left">
          {[
            { icon: '♾️', title: 'Unlimited Connections', desc: 'No daily limits, ever' },
            { icon: '👁️', title: 'See Who Vibe Checked You', desc: 'Know who\'s into you instantly' },
            { icon: '⭐', title: '5 Daily Super Likes', desc: 'Stand out in a sea of profiles' },
            { icon: '👑', title: 'Gold VIP Badge', desc: 'Premium crown on your profile forever' },
          ].map((perk, i) => (
            <div
              key={perk.title}
              className={`perk-item-${i} flex items-center gap-3 px-3.5 py-2.5 rounded-2xl`}
              style={{
                background: 'linear-gradient(105deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-[14px] flex items-center justify-center text-[18px]"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(251,191,36,0.08) 100%)',
                  border: '1px solid rgba(251,191,36,0.2)',
                }}
              >
                {perk.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white leading-none">{perk.title}</p>
                <p className="text-[11px] mt-0.5 leading-none" style={{ color: 'rgba(255,255,255,0.4)' }}>{perk.desc}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(245,158,11,0.6)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="relative z-10 w-full space-y-2.5">
          <button
            onClick={() => { hapticSuccess(); onClose(); }}
            className="w-full py-4 rounded-2xl text-[15px] font-black text-white active:scale-[0.97] transition-transform cursor-pointer"
            style={{
              background: 'linear-gradient(105deg, #f59e0b 0%, #fbbf24 30%, #FF6B9D 65%, #7B68EE 100%)',
              boxShadow: '0 8px 30px rgba(245,158,11,0.35), 0 2px 0 rgba(255,255,255,0.15) inset',
              letterSpacing: '0.01em',
            }}
          >
            Start Exploring ✨
          </button>

          <button
            onClick={handleShare}
            className="w-full py-2.5 rounded-2xl text-[12.5px] font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            <span>📲</span>
            <span>Share Your VIP Status</span>
          </button>
        </div>
      </div>
    </div>
  );
}
