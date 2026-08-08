'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hapticLight, hapticMedium, hapticSuccess } from '../lib/haptics';

/* ─────────────────────────────────────────────────
   Plan definitions (must match /api/premium/create-order)
───────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'monthly',
    label: 'Monthly',
    price: 999,
    priceDisplay: '₹999',
    perDay: '₹33/day',
    save: 'Save 34%',
    popular: true,
    durationDays: 30,
    badge: 'Best Value',
  },
  {
    id: 'weekly',
    label: 'Weekly',
    price: 299,
    priceDisplay: '₹299',
    perDay: '₹43/day',
    save: 'Save 14%',
    popular: false,
    durationDays: 7,
    badge: '',
  },
  {
    id: 'daily',
    label: 'Daily',
    price: 49,
    priceDisplay: '₹49',
    perDay: '₹49/day',
    save: '',
    popular: false,
    durationDays: 1,
    badge: 'Try it out',
  },
] as const;

type PlanId = (typeof PLANS)[number]['id'];

const FEATURES = [
  { icon: '❤️', label: 'Daily Likes',        free: '20/day',  gold: 'Unlimited' },
  { icon: '⭐', label: 'Super Likes',         free: '1/day',   gold: '5/day' },
  { icon: '👀', label: 'See Who Liked You',   free: '—',       gold: 'Unlimited' },
  { icon: '↩️', label: 'Rewinds',            free: '1/day',   gold: 'Unlimited' },
  { icon: '🚀', label: 'Profile Boost',      free: '—',       gold: 'Included' },
  { icon: '🎛️', label: 'Advanced Filters',   free: '—',       gold: 'Included' },
  { icon: '✓',  label: 'Read Receipts',      free: '—',       gold: 'Included' },
  { icon: '🚫', label: 'Ad-Free',            free: '—',       gold: 'Included' },
];

/* ─────────────────────────────────────────────────
   Scoped animations
───────────────────────────────────────────────── */
const STYLES = `
  @keyframes pm-rise {
    0%   { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .pm-rise { opacity: 0; animation: pm-rise 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }

  @keyframes pm-sheen {
    0%,80%  { transform: translateX(-180%) skewX(-18deg); }
    22%     { transform: translateX(280%)  skewX(-18deg); }
  }
  .pm-sheen { animation: pm-sheen 4.5s ease-in-out 1s infinite; }

  @keyframes pm-glow-pulse {
    0%, 100% { opacity: 0.55; }
    50%       { opacity: 0.85; }
  }
  .pm-glow { animation: pm-glow-pulse 3s ease-in-out infinite; }

  @media (prefers-reduced-motion: reduce) {
    .pm-rise, .pm-sheen, .pm-glow { animation: none !important; opacity: 1 !important; transform: none !important; }
  }
`;

type SubStatus = {
  tier: string;
  isActive: boolean;
  expiresAt: string | null;
  daysLeft: number;
};

declare global {
  interface Window {
    // Razorpay is loaded via CDN script tag; typed as a constructor function
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PremiumPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanId>('monthly');
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  /* Fetch current subscription on mount */
  useEffect(() => {
    fetch('/api/premium/status')
      .then(r => r.json())
      .then(data => { if (data.success) setSub(data.subscription); })
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, []);

  const activePlan = PLANS.find(p => p.id === selected)!;

  const handleSubscribe = useCallback(async () => {
    hapticMedium();
    setPaying(true);
    setNotice(null);

    try {
      /* Step 1 — create order on server */
      const orderRes = await fetch('/api/premium/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selected }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        /* Payment gateway not configured yet — show instructional notice */
        if (orderRes.status === 503) {
          setNotice({
            type: 'info',
            text: 'Payments are not configured yet. Add your Razorpay keys to .env.local to go live.',
          });
        } else {
          setNotice({ type: 'error', text: orderData.message || 'Could not start payment.' });
        }
        return;
      }

      /* Step 2 — load Razorpay checkout */
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setNotice({ type: 'error', text: 'Could not load payment gateway. Check your connection.' });
        return;
      }

      /* Step 3 — open checkout */
      const checkout = new window.Razorpay({
        key:         orderData.keyId,
        amount:      orderData.amount,
        currency:    'INR',
        name:        'DateBuddy',
        description: `Gold ${activePlan.label} Plan`,
        order_id:    orderData.orderId,
        prefill:     { name: '', email: '', contact: '' },
        theme:       { color: '#FF6B9D' },
        modal: {
          ondismiss: () => { setPaying(false); },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id:   string;
          razorpay_signature:  string;
        }) => {
          /* Step 4 — verify payment on server */
          try {
            const verifyRes = await fetch('/api/premium/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_signature:  response.razorpay_signature,
                planId:              selected,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              hapticSuccess();
              setSub({ tier: selected, isActive: true, expiresAt: verifyData.expiresAt, daysLeft: activePlan.durationDays });
              setNotice({ type: 'success', text: `🎉 Gold activated! Enjoy ${activePlan.durationDays === 1 ? 'today' : `${activePlan.durationDays} days`} of unlimited access.` });
            } else {
              setNotice({ type: 'error', text: verifyData.message || 'Payment verification failed. Contact support.' });
            }
          } catch {
            setNotice({ type: 'error', text: 'Verification error. If money was deducted, contact support.' });
          } finally {
            setPaying(false);
          }
        },
      });

      checkout.open();
    } catch {
      setNotice({ type: 'error', text: 'Something went wrong. Please try again.' });
      setPaying(false);
    }
  }, [selected, activePlan]);

  const isGold = sub?.isActive === true;

  return (
    <div className="h-dvh w-full bg-[#0d0914] flex justify-center overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="relative h-full w-full max-w-[440px] flex flex-col overflow-hidden">

        {/* Deep background gradients */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden z-0">
          <div className="pm-glow absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#FF6B9D]/25 blur-[80px]" />
          <div className="pm-glow absolute -top-16 -right-16 h-72 w-72 rounded-full bg-[#7B68EE]/22 blur-[80px]" style={{ animationDelay: '1.5s' }} />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-[#FFB4D0]/10 blur-[60px]" />
        </div>

        {/* HEADER */}
        <div className="relative flex-shrink-0 z-10 px-5 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-5">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white/70 active:scale-90 transition-all cursor-pointer backdrop-blur-md"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {isGold && (
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 border border-[#FFD700]/30 px-3 py-1 backdrop-blur-md">
                <span className="text-[#FFD700] text-[11px]">★</span>
                <span className="text-[11px] font-bold text-white/80">Gold Active · {sub.daysLeft}d left</span>
              </div>
            )}
          </div>

          {/* Brand mark */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 mb-4"
              style={{ background: 'linear-gradient(135deg, #FF6B9D 0%, #E86AC7 50%, #7B68EE 100%)' }}>
              <span className="text-[13px] font-black uppercase tracking-[0.1em] text-white">✦ DateBuddy Gold</span>
            </div>
            <h1 className="text-[30px] font-black tracking-tight text-white leading-[1.15] mb-2">
              {isGold ? 'You\'re a Gold Member ✨' : 'Unlock Unlimited\nConnections'}
            </h1>
            <p className="text-[14px] text-white/50">
              {isGold
                ? `Your Gold plan is active until ${sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : '—'}`
                : 'More matches. More conversations. Cancel anytime.'}
            </p>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none px-5 pb-4 space-y-4">

          {/* Active Gold banner */}
          {isGold && !loadingStatus && (
            <div className="pm-rise rounded-[22px] border border-[#FFD700]/30 bg-gradient-to-br from-[#FFD700]/10 to-[#FF6B9D]/10 p-4 flex items-center gap-3.5 backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFD700] to-[#FF6B9D] shadow-[0_4px_16px_-6px_rgba(255,107,157,0.6)] flex-shrink-0 text-xl">
                ✦
              </div>
              <div>
                <p className="text-[14.5px] font-extrabold text-white">Gold Membership Active</p>
                <p className="text-[12.5px] text-white/55 mt-0.5">
                  {sub.daysLeft} {sub.daysLeft === 1 ? 'day' : 'days'} remaining · All features unlocked
                </p>
              </div>
            </div>
          )}

          {/* Plan picker — hidden while already active (can still upgrade) */}
          {!loadingStatus && (
            <div className="pm-rise" style={{ animationDelay: '50ms' }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/35 mb-2.5 px-0.5">
                {isGold ? 'Renew or Upgrade' : 'Choose your plan'}
              </p>
              <div className="flex gap-2.5">
                {PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => { hapticLight(); setSelected(plan.id); }}
                    className={`relative flex-1 rounded-[20px] p-3.5 text-left transition-all duration-200 active:scale-[0.96] cursor-pointer border ${
                      selected === plan.id
                        ? 'bg-gradient-to-br from-[#FF6B9D]/20 to-[#7B68EE]/20 border-[#FF6B9D]/60 shadow-[0_0_24px_-8px_rgba(255,107,157,0.5)]'
                        : 'bg-white/[0.06] border-white/10'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] px-2.5 py-0.5 text-[9px] font-black text-white uppercase tracking-wider shadow-md">
                        Most Popular
                      </span>
                    )}
                    {plan.badge && !plan.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/15 border border-white/20 px-2 py-0.5 text-[9px] font-bold text-white/70 uppercase tracking-wider">
                        {plan.badge}
                      </span>
                    )}
                    <p className="text-[12.5px] font-bold text-white/70">{plan.label}</p>
                    <p className="text-[22px] font-black text-white leading-tight mt-0.5">{plan.priceDisplay}</p>
                    <p className="text-[10.5px] text-white/35 font-medium mt-0.5">{plan.perDay}</p>
                    {plan.save && (
                      <span className="mt-1.5 inline-block rounded-full bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-400">
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
          )}

          {/* Features comparison */}
          <div
            className="pm-rise rounded-[22px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-md overflow-hidden"
            style={{ animationDelay: '100ms' }}
          >
            <div className="grid grid-cols-[1fr_60px_80px] items-center px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.03]">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-white/30">Feature</span>
              <span className="text-center text-[10.5px] font-bold text-white/30">Free</span>
              <span className="text-center text-[10.5px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] bg-clip-text text-transparent">Gold ✦</span>
            </div>
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                className={`grid grid-cols-[1fr_60px_80px] items-center px-4 py-3 ${i < FEATURES.length - 1 ? 'border-b border-white/[0.05]' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[15px] leading-none">{f.icon}</span>
                  <span className="text-[13px] font-medium text-white/65">{f.label}</span>
                </div>
                <span className="text-center text-[12px] font-medium text-white/25">
                  {f.free !== '—' ? f.free : <span className="text-rose-500/70 font-bold text-[10px]">✕</span>}
                </span>
                <span className="text-center text-[12px] font-bold text-[#FF6B9D]">{f.gold}</span>
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div
            className="pm-rise rounded-[22px] border border-white/[0.06] bg-white/[0.03] p-4 flex items-center justify-around"
            style={{ animationDelay: '150ms' }}
          >
            {[
              { icon: '🔒', text: 'Secure\nPayment' },
              { icon: '↩️', text: 'Cancel\nAnytime' },
              { icon: '💳', text: 'UPI &\nCards' },
              { icon: '🔐', text: '256-bit\nEncrypted' },
            ].map(b => (
              <div key={b.text} className="flex flex-col items-center gap-1">
                <span className="text-xl leading-none">{b.icon}</span>
                <span className="text-[10px] font-semibold text-white/35 text-center leading-tight whitespace-pre">{b.text}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-white/20 leading-relaxed px-4">
            Auto-renews until cancelled · Billed in INR · Secure Razorpay checkout
          </p>
        </div>

        {/* CTA FOOTER */}
        <div className="flex-shrink-0 z-10 px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] bg-gradient-to-t from-[#0d0914] via-[#0d0914]/95 to-transparent border-t border-white/[0.06]">
          {notice && (
            <div
              role="status"
              className={`mb-3 rounded-2xl px-4 py-3 text-center text-[13px] font-semibold leading-snug ${
                notice.type === 'success'
                  ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                  : notice.type === 'error'
                  ? 'border border-rose-500/30 bg-rose-500/15 text-rose-300'
                  : 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}
            >
              {notice.text}
            </div>
          )}

          {!isGold || notice?.type === 'success' ? (
            <button
              onClick={handleSubscribe}
              disabled={paying || loadingStatus}
              className="group relative w-full h-[58px] rounded-2xl overflow-hidden text-white text-[15px] font-bold shadow-[0_12px_36px_-10px_rgba(255,107,157,0.6)] active:scale-[0.985] transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #FF6B9D 0%, #E86AC7 50%, #7B68EE 100%)' }}
            >
              <div aria-hidden className="pm-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <span className="relative z-10 flex items-center gap-2">
                {paying ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                    </svg>
                    Opening Checkout…
                  </>
                ) : (
                  <>
                    <span>✦</span>
                    Get Gold · {activePlan.priceDisplay}
                  </>
                )}
              </span>
            </button>
          ) : (
            <div className="w-full h-[58px] rounded-2xl flex items-center justify-center gap-2 border border-[#FFD700]/30 bg-[#FFD700]/10">
              <span className="text-[#FFD700] text-lg">✦</span>
              <span className="text-[15px] font-bold text-[#FFD700]">Gold Active · {sub?.daysLeft}d left</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
