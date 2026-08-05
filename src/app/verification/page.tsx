'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'info' | 'camera' | 'processing' | 'submitted' | 'pending' | 'verified' | 'failed';

export default function VerificationPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('info');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch('/api/users/verification');
        if (res.status === 401) {
          router.replace('/welcome');
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const status = data?.verification?.status;
        if (status === 'pending') setStep('pending');
        else if (status === 'verified') setStep('verified');
      } catch {
        /* offline — the info screen is still usable */
      }
    }
    loadStatus();
  }, [router]);

  const handleStartVerification = () => {
    setStep('camera');
  };

  const handleTakePhoto = async () => {
    setStep('processing');
    setError('');
    try {
      const res = await fetch('/api/users/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        router.replace('/welcome');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.message || 'Could not submit your verification.');
        setStep('failed');
        return;
      }
      setStep(data.status === 'verified' ? 'verified' : 'submitted');
    } catch {
      setError('Network error. Please check your connection and try again.');
      setStep('failed');
    }
  };

  const handleRetry = () => {
    setStep('camera');
  };

  const handleFinish = () => {
    router.push('/profile');
  };

  if (step === 'info') {
    return (
      <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
        <div className="p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]">
          <button onClick={() => router.back()} className="text-2xl" aria-label="Go back">←</button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 pb-32">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✓</div>
            <h1 className="text-3xl font-bold text-[#1A1A2E] mb-4">Get Verified</h1>
          </div>

          <div className="card mb-6">
            <h3 className="font-semibold text-[#1A1A2E] mb-3">Why get verified?</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-xl">🌟</span>
                <div>
                  <p className="font-medium text-[#1A1A2E]">Stand out from the crowd</p>
                  <p className="text-sm text-gray-600">Get a verified badge on your profile</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-xl">💕</span>
                <div>
                  <p className="font-medium text-[#1A1A2E]">Get 50% more matches</p>
                  <p className="text-sm text-gray-600">Verified profiles are more trusted</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <p className="font-medium text-[#1A1A2E]">Show you&apos;re the real deal</p>
                  <p className="text-sm text-gray-600">Build trust with potential matches</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="card mb-6 bg-blue-50">
            <h3 className="font-semibold text-[#1A1A2E] mb-3">How it works</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Take a quick selfie video following our instructions</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Our team reviews your submission</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>You&apos;ll get your badge once it&apos;s approved</span>
              </li>
            </ol>
          </div>

          <p className="text-sm text-gray-500 text-center mb-6">
            This helps keep our community safe and authentic
          </p>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button onClick={handleStartVerification} className="btn-primary w-full">
            Start Verification
          </button>
        </div>
      </div>
    );
  }

  if (step === 'camera') {
    return (
      <div className="mobile-container min-h-screen bg-black flex flex-col">
        <div className="p-4 text-white">
          <button onClick={() => setStep('info')} className="text-2xl">←</button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Camera Preview Placeholder */}
          <div className="relative w-72 h-96 bg-gray-800 rounded-3xl overflow-hidden mb-8">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-sm">Camera preview</p>
              </div>
            </div>
            
            {/* Face Outline Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-64 border-4 border-white/50 rounded-full"></div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mx-6 mb-8">
            <h3 className="text-white font-semibold text-center mb-3">
              Copy this pose 👋
            </h3>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="text-4xl mb-1">👋</div>
                <p className="text-white text-xs">Wave</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-1">😊</div>
                <p className="text-white text-xs">Smile</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-1">👤</div>
                <p className="text-white text-xs">Turn head</p>
              </div>
            </div>
          </div>
        </div>

        {/* Record Button */}
        <div className="p-6">
          <button
            onClick={handleTakePhoto}
            className="w-20 h-20 mx-auto block bg-white rounded-full border-4 border-[#FF6B9D] hover:scale-110 transition-transform"
          >
            <div className="w-full h-full bg-[#FF6B9D] rounded-full m-1"></div>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6">
        <div className="spinner mb-6"></div>
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Submitting…</h2>
        <p className="text-gray-600 text-center">
          This will only take a moment
        </p>
      </div>
    );
  }

  if (step === 'submitted' || step === 'pending') {
    return (
      <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6">
        <div className="text-7xl mb-6">⏳</div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-3 text-center">Verification under review</h1>
        <p className="text-gray-600 text-center mb-8">
          {step === 'submitted'
            ? "Thanks! Our team will review your submission and your badge will appear on your profile once it's approved."
            : "You've already submitted a verification. Our team is reviewing it — your badge will appear once it's approved."}
        </p>
        <button onClick={handleFinish} className="btn-primary w-full">
          Back to Profile
        </button>
      </div>
    );
  }

  if (step === 'verified') {
    return (
      <div className="mobile-container min-h-screen bg-gradient-to-br from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] flex flex-col items-center justify-center px-6">
        <div className="pulse text-8xl mb-6">✓</div>
        <h1 className="text-3xl font-bold text-white mb-4">You&apos;re Verified!</h1>
        <p className="text-white/90 text-center mb-8">
          Your profile has a verified badge
        </p>
        <button onClick={handleFinish} className="btn-primary bg-white text-[#FF6B9D]">
          Done
        </button>
      </div>
    );
  }

  if (step === 'failed') {
    return (
      <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-6">😕</div>
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-4">Couldn&apos;t submit</h2>
        <p className="text-gray-600 text-center mb-8">
          {error || 'Something went wrong while submitting your verification.'}
        </p>
        <div className="space-y-3 w-full">
          <button onClick={handleRetry} className="btn-primary w-full">
            Try Again
          </button>
          <button onClick={() => router.push('/profile')} className="btn-secondary w-full">
            Maybe Later
          </button>
        </div>
      </div>
    );
  }

  return null;
}
