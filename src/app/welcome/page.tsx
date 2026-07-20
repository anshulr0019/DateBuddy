'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WelcomePage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (phoneNumber.length !== 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    localStorage.setItem('phoneNumber', phoneNumber);

    setTimeout(() => {
      setIsLoading(false);
      router.push('/verify-otp');
    }, 1000);
  };

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 pb-32">
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">💕</div>
          <h1 className="text-3xl font-bold text-[#1A1A2E] mb-2">Welcome to Dil Se</h1>
          <p className="text-gray-600">India's coolest dating app for Gen Z</p>
        </div>

        <div className="space-y-4">
          {/* Phone Number Input */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
              Phone Number
            </label>
            <div className="flex gap-2 relative z-10">
              <div className="w-20 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-medium">
                +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="flex-1 relative z-10 pointer-events-auto cursor-text
                  border border-gray-200 rounded-xl px-4 py-3
                  text-[#1A1A2E] bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#FF6B9D] focus:border-transparent
                  transition-all"
              />
            </div>
          </div>

          {/* Send OTP Button */}
          <button
            onClick={handleSendOTP}
            disabled={isLoading || phoneNumber.length !== 10}
            className="w-full py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-[#FF6B9D] to-[#8B5CF6]
              shadow-md shadow-pink-200
              hover:shadow-lg hover:shadow-pink-300 hover:brightness-105
              active:scale-[0.98]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md
              transition-all duration-200"
          >
            {isLoading ? 'Sending...' : 'Send OTP'}
          </button>

          {/* Terms Text */}
          <p className="text-xs text-gray-500 text-center">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-[#FF6B9D] hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-[#FF6B9D] hover:underline">Privacy Policy</a>
          </p>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">or</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Social Sign In */}
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
            border border-gray-200 bg-white font-medium text-[#1A1A2E]
            hover:border-[#FF6B9D] hover:shadow-sm
            active:scale-[0.98]
            transition-all duration-200">
            <span>🔍</span>
            <span>Continue with Google</span>
          </button>

          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
            border border-gray-200 bg-white font-medium text-[#1A1A2E]
            hover:border-[#1A1A2E] hover:shadow-sm
            active:scale-[0.98]
            transition-all duration-200">
            <span>🍎</span>
            <span>Continue with Apple</span>
          </button>
        </div>
      </div>
    </div>
  );
}