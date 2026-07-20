'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PremiumPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState('daily');

  const plans = [
    { id: 'daily', name: 'Daily', price: 50, perDay: 50, save: '' },
    { id: 'weekly', name: 'Weekly', price: 300, perDay: 43, save: 'Save 14%' },
    { id: 'monthly', name: 'Monthly', price: 1000, perDay: 33, save: 'Save 34%' },
  ];

  const features = [
    { free: '20', premium: 'Unlimited', label: 'Daily Likes' },
    { free: '2/day', premium: 'Unlimited', label: 'See Who Liked You' },
    { free: '1/day', premium: 'Unlimited', label: 'Rewinds' },
    { free: '1/day', premium: '5/day', label: 'Super Likes' },
    { free: '❌', premium: '✓', label: 'Profile Boost (24h)' },
    { free: '❌', premium: '✓', label: 'Advanced Filters' },
    { free: '❌', premium: '✓', label: 'Read Receipts' },
    { free: '❌', premium: '✓', label: 'Ad-Free Experience' },
  ];

  const handleSubscribe = async () => {
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    alert(`Subscribing to ${selectedPlanData?.name} plan for ₹${selectedPlanData?.price}`);
    // In real app, integrate with payment gateway
    router.push('/discover');
  };

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <div className="psychedelic-bg text-white p-6 pb-12">
        <button onClick={() => router.back()} className="text-2xl mb-4">
          ✕
        </button>
        <h1 className="text-3xl font-bold mb-2">Upgrade Your Experience ✨</h1>
        <p className="text-white/90">Get more matches and stand out from the crowd</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto -mt-8">
        {/* Comparison Table */}
        <div className="card mx-4 mb-4">
          <h3 className="font-semibold text-[#1A1A2E] mb-4 text-center">
            Free vs Premium
          </h3>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-700 flex-1">{feature.label}</span>
                <div className="flex gap-8">
                  <span className="text-sm text-gray-500 w-16 text-center">{feature.free}</span>
                  <span className="text-sm font-semibold text-[#FF6B9D] w-16 text-center">{feature.premium}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="px-4 mb-4">
          <h3 className="font-semibold text-[#1A1A2E] mb-3">Choose Your Plan</h3>
          <div className="space-y-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedPlan === plan.id
                    ? 'border-[#FF6B9D] bg-pink-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h4 className="font-semibold text-[#1A1A2E]">{plan.name}</h4>
                    <p className="text-sm text-gray-600">₹{plan.perDay}/day</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#FF6B9D] text-xl">₹{plan.price}</div>
                    {plan.save && (
                      <div className="text-xs text-green-600 font-medium">{plan.save}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Special Offer */}
        <div className="card mx-4 mb-4 bg-yellow-50 border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎁</span>
            <h3 className="font-semibold text-[#1A1A2E]">First-time offer!</h3>
          </div>
          <p className="text-sm text-gray-700">Get 50% off your first day of premium</p>
        </div>

        {/* Fine Print */}
        <div className="px-4 mb-4">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Auto-renews until canceled</p>
            <p>• Cancel anytime from settings</p>
            <p>• Payment charged to your account</p>
          </div>
        </div>
      </div>

      {/* Subscribe Button */}
      <div className="p-6 border-t border-gray-200 bg-white">
        <button onClick={handleSubscribe} className="btn-primary w-full mb-3">
          Get Premium - ₹{plans.find(p => p.id === selectedPlan)?.price}
        </button>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <span>💳 UPI</span>
          <span>•</span>
          <span>💳 Cards</span>
          <span>•</span>
          <span>📱 Wallets</span>
        </div>
      </div>
    </div>
  );
}
