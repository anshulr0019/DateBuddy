'use client';

import React from 'react';
import { hapticMedium, hapticSuccess } from '../lib/haptics';

interface EarlyVIPModalProps {
  isOpen: boolean;
  memberNumber?: number;
  founderNumber?: number;
  onClose: () => void;
}

export function FounderVIPModal({ isOpen, memberNumber, founderNumber, onClose }: EarlyVIPModalProps) {
  const num = memberNumber ?? founderNumber ?? 1;
  if (!isOpen) return null;

  const handleShare = async () => {
    hapticMedium();
    const shareData = {
      title: 'Infyn VIP Member',
      text: `I just unlocked Free Lifetime VIP on @app.infyn as Early Member #${num}. First 500 only.`,
      url: window.location.origin,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      navigator.clipboard?.writeText?.(shareData.text);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-6"
      style={{
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(24px)',
        animation: 'vipIn 0.3s ease forwards',
      }}
    >
      <style>{`
        @keyframes vipIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes vipCardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 28,
          padding: '36px 28px 28px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'vipCardIn 0.4s cubic-bezier(0.16,1,0.3,1) 0.05s both',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle top glow — single, barely visible */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 120,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} aria-hidden />

        {/* Crown mark */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 18,
            fontSize: 26,
          }}>
            ◆
          </div>
        </div>

        {/* Member number — understated */}
        <p style={{
          textAlign: 'center',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.14em',
          color: 'rgba(255,255,255,0.35)',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}>
          Member #{num} · Early Access
        </p>

        {/* Title */}
        <h2 style={{
          textAlign: 'center',
          fontSize: 24,
          fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          marginBottom: 10,
        }}>
          Lifetime VIP Unlocked
        </h2>

        {/* Subtitle */}
        <p style={{
          textAlign: 'center',
          fontSize: 13,
          color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.6,
          marginBottom: 28,
          maxWidth: 260,
          margin: '0 auto 28px',
        }}>
          You joined early. As a thank you, you have free Infyn Gold for life — no limits, no expiry.
        </p>

        {/* Thin divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24 }} />

        {/* Perks — minimal list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 28 }}>
          {[
            ['Unlimited connections', 'No daily cap, ever'],
            ['See who liked you', 'Full visibility, no paywall'],
            ['5 Super Likes daily', 'Be seen first'],
            ['VIP badge on profile', 'Permanent early access status'],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1,
              }}>
                <svg width="9" height="9" viewBox="0 0 10 8" fill="none">
                  <polyline points="1,4 3.5,6.5 9,1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.3 }}>{title}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0', lineHeight: 1.3 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => { hapticSuccess(); onClose(); }}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 14,
              background: '#ffffff',
              color: '#0a0a0a',
              fontSize: 14,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.92')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Start Exploring
          </button>

          <button
            onClick={handleShare}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 14,
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 13,
              fontWeight: 500,
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              transition: 'border-color 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
            }}
          >
            Share with friends
          </button>
        </div>
      </div>
    </div>
  );
}
