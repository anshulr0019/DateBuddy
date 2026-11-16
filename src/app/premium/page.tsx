'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hapticLight, hapticMedium, hapticSuccess } from '../lib/haptics';
import { Ic } from '../components/icons';

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
    save: 'Save 32%',
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
    save: 'Save 13%',
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

/* Only benefits the server actually gates on Gold (see /api/likes). */
const BENEFITS = [
  { title: 'See who liked you', body: 'Everyone who has already liked your profile, with their photos.' },
  { title: 'Match in one tap', body: 'Like them back from the list and you’ll match straight away.' },
];

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
            text: 'Payments aren’t available yet. You haven’t been charged.',
          });
        } else {
          setNotice({ type: 'error', text: orderData.message || 'Could not start payment.' });
        }
        setPaying(false);
        return;
      }

      /* Step 2 — load Razorpay checkout */
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setNotice({ type: 'error', text: 'Could not load payment gateway. Check your connection.' });
        setPaying(false);
        return;
      }

      /* Step 3 — open checkout */
      const checkout = new window.Razorpay({
        key:         orderData.keyId,
        amount:      orderData.amount,
        currency:    'INR',
        name:        'Infyn',
        description: `Gold ${activePlan.label} Plan`,
        order_id:    orderData.orderId,
        prefill:     { name: '', email: '', contact: '' },
        theme:       { color: '#9E1B41' },
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
              setNotice({ type: 'success', text: `Gold is active for ${activePlan.durationDays === 1 ? 'today' : `the next ${activePlan.durationDays} days`}.` });
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

  const expiry = sub?.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : null;

  return (
    <div className="h-dvh w-full bg-infyn-paper flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] flex flex-col overflow-hidden">
        <div className="flex-shrink-0 px-5 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] flex items-center justify-between">
          <button
            onClick={() => router.back()}
            aria-label="Close"
            className="flex h-11 w-11 items-center justify-center rounded-full text-infyn-ink active:bg-infyn-surface-soft transition-colors cursor-pointer"
          >
            <Ic.X />
          </button>
          {isGold && (
            <span className="rounded-full bg-infyn-blush px-3 py-1 text-[13px] font-semibold text-infyn-rose">
              Active · {sub.daysLeft} {sub.daysLeft === 1 ? 'day' : 'days'} left
            </span>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-5 pb-4">
          <div className="animate-soft-arrive pt-2">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-infyn-blush text-infyn-rose" aria-hidden>
              <Ic.Sparkle className="w-6 h-6" />
            </span>
            <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.12em] text-infyn-rose">Infyn Gold</p>
            <h1 className="mt-1 font-display text-[34px] leading-[1.1] tracking-tight text-infyn-ink">
              {isGold ? 'You’re on Gold' : 'See who already likes you'}
            </h1>
            <p className="mt-2 text-[16px] leading-relaxed text-infyn-secondary">
              {isGold && expiry ? `Your Gold access lasts until ${expiry}.` : 'Skip the guessing and start with people who are already interested.'}
            </p>
          </div>

          <ul className="mt-7 space-y-4">
            {BENEFITS.map(b => (
              <li key={b.title} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-infyn-rose text-[#fff8f0]" aria-hidden><Ic.Check /></span>
                <span>
                  <span className="block text-[16px] font-semibold text-infyn-ink">{b.title}</span>
                  <span className="block text-[14px] leading-relaxed text-infyn-secondary">{b.body}</span>
                </span>
              </li>
            ))}
          </ul>

          {!loadingStatus && (
            <div className="mt-8">
              <p className="mb-3 text-[13px] font-semibold text-infyn-secondary">{isGold ? 'Extend your access' : 'Choose how long'}</p>
              <div className="space-y-2.5" role="radiogroup" aria-label="Plan">
                {PLANS.map(plan => {
                  const on = selected === plan.id;
                  return (
                    <button
                      key={plan.id}
                      role="radio"
                      aria-checked={on}
                      onClick={() => { hapticLight(); setSelected(plan.id); }}
                      className={`w-full min-h-[68px] flex items-center gap-3 rounded-2xl border px-4 text-left transition-colors cursor-pointer ${
                        on ? 'border-infyn-rose bg-infyn-surface shadow-[0_0_0_1px_var(--infyn-rose)]' : 'border-infyn-border bg-infyn-surface'
                      }`}
                    >
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-infyn-rose' : 'border-infyn-border'}`} aria-hidden>
                        {on && <span className="h-2.5 w-2.5 rounded-full bg-infyn-rose" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-[16px] font-semibold text-infyn-ink">{plan.label}</span>
                          {plan.popular && <span className="rounded-full bg-infyn-blush px-2 py-0.5 text-[12px] font-semibold text-infyn-rose">Best value</span>}
                        </span>
                        <span className="block text-[13px] text-infyn-secondary">{plan.perDay}{plan.save ? ` · ${plan.save}` : ''}</span>
                      </span>
                      <span className="text-[20px] font-semibold text-infyn-ink tabular-nums">{plan.priceDisplay}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="mt-6 text-[13px] leading-relaxed text-infyn-secondary">
            One payment for the period you choose. It doesn’t renew automatically. Secure checkout by Razorpay with UPI and cards.
          </p>
        </div>

        <div className="flex-shrink-0 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-infyn-border bg-infyn-paper">
          {notice && (
            <p
              role="status"
              className={`mb-3 text-center text-[14px] leading-snug ${notice.type === 'error' ? 'text-infyn-rose' : 'text-infyn-ink'}`}
            >
              {notice.text}
            </p>
          )}
          <button
            onClick={handleSubscribe}
            disabled={paying || loadingStatus}
            className="w-full min-h-[56px] rounded-full bg-infyn-rose text-[#fff8f0] text-[16px] font-semibold shadow-[0_1px_2px_rgba(158,27,65,0.15),0_10px_22px_-10px_rgba(158,27,65,0.6)] active:scale-[0.985] transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {paying ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
                Opening checkout…
              </>
            ) : (
              <>{isGold ? 'Extend' : 'Get Gold'} · {activePlan.priceDisplay}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
