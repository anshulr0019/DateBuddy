'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { hapticLight, hapticMedium } from '../lib/haptics';

const PLANS = [
  { id: 'daily',   label: 'Daily',   price: 50,   perDay: 50,  save: '',        popular: false },
  { id: 'weekly',  label: 'Weekly',  price: 300,  perDay: 43,  save: 'Save 14%', popular: false },
  { id: 'monthly', label: 'Monthly', price: 1000, perDay: 33,  save: 'Save 34%', popular: true  },
];

const FEATURES = [
  { icon: '❤️', label: 'Daily Likes',          free: '20',      gold: 'Unlimited' },
  { icon: '👀', label: 'See Who Liked You',    free: '2/day',   gold: 'Unlimited' },
  { icon: '↩️', label: 'Rewinds',             free: '1/day',   gold: 'Unlimited' },
  { icon: '⭐', label: 'Super Likes',          free: '1/day',   gold: '5/day'     },
  { icon: '🚀', label: 'Profile Boost (24h)',  free: null,      gold: 'Included'  },
  { icon: '🎛️', label: 'Advanced Filters',     free: null,      gold: 'Included'  },
  { icon: '✓',  label: 'Read Receipts',        free: null,      gold: 'Included'  },
  { icon: '🚫', label: 'Ad-Free Experience',   free: null,      gold: 'Included'  },
];

const STYLES = `
  @keyframes pm-rise {
    0%   { opacity: 0; transform: translateY(18px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .pm-rise { opacity: 0; animation: pm-rise 0.55s cubic-bezier(0.16,1,0.3,1) forwards; }

  @keyframes pm-sheen {
    0%   { transform: translateX(-160%) skewX(-18deg); }
    22%  { transform: translateX(260%)  skewX(-18deg); }
    100% { transform: translateX(260%)  skewX(-18deg); }
  }
  .pm-sheen { animation: pm-sheen 4s ease-in-out 0.6s infinite; }

  @media (prefers-reduced-motion: reduce) {
    .pm-rise  { animation: none !important; opacity: 1 !important; transform: none !important; }
    .pm-sheen { display: none !important; }
  }
`;

export default function PremiumPage() {
  const router = useRouter();
  const [selected, setSelected] = useState('monthly');
  const [notice, setNotice] = useState('');

  const activePlan = PLANS.find(p => p.id === selected)!;

  const handleSubscribe = () => {
    hapticMedium();
    setNotice('Payments opening soon — no charge has been made.');
  };

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="relative h-full w-full max-w-[440px] flex flex-col overflow-hidden bg-[#FAFAF7]">

        {/* Ambient background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#FF6B9D]/12 blur-[60px]" />
          <div className="absolute -right-16 top-20 h-80 w-80 rounded-full bg-[#7B68EE]/10 blur-[70px]" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#FFB4D0]/10 blur-[60px]" />
        </div>

        {/* Hero header */}
        <div className="relative flex-shrink-0 z-10 px-5 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-6 bg-gradient-to-b from-[#1A0A2E] via-[#1d0b34] to-transparent">
          <button
            onClick={() => router.back()}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white/70 active:scale-90 transition-all cursor-pointer mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] px-3 py-1 mb-3 shadow-sm">
            <span className="text-[11px] font-black uppercase tracking-wider text-white">✨ DateBuddy Gold</span>
          </div>
          <h1 className="text-[28px] font-black tracking-tight text-white leading-[1.1] mb-1">
            Get more matches.<br />Meet more people.
          </h1>
          <p className="text-[14px] text-white/60">Unlimited access. Cancel anytime.</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none px-5 pb-4 space-y-4">

          {/* Plan picker */}
          <div className="pm-rise" style={{ animationDelay: '60ms' }}>
            <div className="flex gap-2.5">
              {PLANS.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => { hapticLight(); setSelected(plan.id); }}
                  className={`relative flex-1 rounded-[20px] p-3.5 text-left transition-all duration-200 active:scale-[0.97] cursor-pointer ${
                    selected === plan.id
                      ? 'bg-gradient-to-br from-[#FF6B9D]/15 to-[#7B68EE]/15 border-[1.5px] border-[#FF6B9D]/50 shadow-[0_4px_20px_-8px_rgba(255,107,157,0.3)]'
                      : 'bg-white/80 border border-white/80 shadow-[0_2px_8px_-4px_rgba(26,26,46,0.08)]'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-sm whitespace-nowrap">
                      Most Popular
                    </span>
                  )}
                  <p className="text-[13px] font-bold text-[#1A1A2E]">{plan.label}</p>
                  <p className="text-[20px] font-black text-[#1A1A2E] leading-tight mt-0.5">₹{plan.price}</p>
                  <p className="text-[10.5px] text-[#1A1A2E]/45 font-medium">₹{plan.perDay}/day</p>
                  {plan.save && (
                    <span className="mt-1 inline-block rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-600">
                      {plan.save}
                    </span>
                  )}
                  {selected === plan.id && (
                    <div className="absolute top-2.5 right-2.5 h-4 w-4 rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] flex items-center justify-center shadow-sm">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Features comparison */}
          <div className="pm-rise rounded-[22px] border border-white/80 bg-white/80 shadow-[0_4px_20px_-10px_rgba(26,26,46,0.08)] backdrop-blur-md overflow-hidden" style={{ animationDelay: '120ms' }}>
            {/* Header row */}
            <div className="grid grid-cols-[1fr_72px_88px] items-center px-4 py-2.5 border-b border-[#1A1A2E]/[0.06] bg-[#1A1A2E]/[0.02]">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1A1A2E]/45">Feature</span>
              <span className="text-center text-[11px] font-bold text-[#1A1A2E]/45">Free</span>
              <span className="text-center text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] bg-clip-text text-transparent">Gold</span>
            </div>
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                className={`grid grid-cols-[1fr_72px_88px] items-center px-4 py-3 ${i < FEATURES.length - 1 ? 'border-b border-[#1A1A2E]/[0.04]' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{f.icon}</span>
                  <span className="text-[13px] font-medium text-[#1A1A2E]/80">{f.label}</span>
                </div>
                <span className="text-center text-[12px] font-medium text-[#1A1A2E]/35">
                  {f.free ?? <span className="text-rose-400 font-bold">✕</span>}
                </span>
                <span className="text-center text-[12px] font-bold text-[#FF6B9D]">{f.gold}</span>
              </div>
            ))}
          </div>

          {/* First-time offer */}
          <div className="pm-rise rounded-[22px] border border-amber-200/60 bg-amber-50/80 p-4 flex items-center gap-3.5" style={{ animationDelay: '180ms' }}>
            <span className="text-2xl flex-shrink-0">🎁</span>
            <div>
              <p className="text-[14px] font-bold text-[#1A1A2E]">First-time offer — 50% off today</p>
              <p className="text-[12px] text-[#1A1A2E]/55 mt-0.5">Only for new Gold members. Ends at midnight.</p>
            </div>
          </div>

          {/* Fine print */}
          <p className="text-center text-[11.5px] text-[#1A1A2E]/35 leading-relaxed px-2">
            Auto-renews until cancelled · Cancel anytime · Payment charged to your account
          </p>
        </div>

        {/* CTA footer */}
        <div className="flex-shrink-0 z-10 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7]/90 to-transparent border-t border-[#1A1A2E]/[0.05]">
          {notice && (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-[13px] font-semibold text-amber-700" role="status">
              {notice}
            </div>
          )}
          <button
            onClick={handleSubscribe}
            className="group relative w-full h-14 rounded-2xl overflow-hidden bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white text-[15px] font-bold shadow-[0_12px_32px_-10px_rgba(255,107,157,0.55)] active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <div aria-hidden className="pm-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="relative z-10">Get Gold · ₹{activePlan.price}</span>
          </button>
          <div className="mt-2.5 flex items-center justify-center gap-4 text-[11px] text-[#1A1A2E]/40 font-medium">
            <span>💳 UPI</span>
            <span>·</span>
            <span>💳 Cards</span>
            <span>·</span>
            <span>📱 Wallets</span>
          </div>
        </div>
      </div>
    </div>
  );
}
