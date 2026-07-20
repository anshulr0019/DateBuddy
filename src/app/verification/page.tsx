'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerificationPage() {
  const router = useRouter();
  const [step, setStep] = useState<'info' | 'camera' | 'processing' | 'success' | 'failed'>('info');

  const handleStartVerification = () => {
    setStep('camera');
  };

  const handleTakePhoto = () => {
    setStep('processing');
    
    // Simulate AI verification
    setTimeout(() => {
      // Random success/failure for demo
      const isSuccess = Math.random() > 0.3;
      setStep(isSuccess ? 'success' : 'failed');
    }, 2000);
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
        <div className="p-4">
          <button onClick={() => router.back()} className="text-2xl">←</button>
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
                  <p className="font-medium text-[#1A1A2E]">Show you're the real deal</p>
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
                <span>Our AI verifies it's really you (takes less than 30 seconds)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>Get your verified badge instantly!</span>
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
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">Verifying...</h2>
        <p className="text-gray-600 text-center">
          This will only take a moment
        </p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="mobile-container min-h-screen psychedelic-bg flex flex-col items-center justify-center px-6">
        <div className="pulse text-8xl mb-6">✓</div>
        <h1 className="text-3xl font-bold text-white mb-4">You're Verified!</h1>
        <p className="text-white/90 text-center mb-8">
          Your profile now has a verified badge
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
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-4">Couldn't verify</h2>
        <p className="text-gray-600 text-center mb-8">
          We couldn't verify your identity. Please make sure:
        </p>
        <ul className="text-left text-gray-700 mb-8 space-y-2">
          <li>• Your face is clearly visible</li>
          <li>• You're in a well-lit area</li>
          <li>• You follow the pose instructions</li>
        </ul>
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
