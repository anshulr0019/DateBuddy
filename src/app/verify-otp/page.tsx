'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      alert('Please enter complete OTP');
      return;
    }

    setIsLoading(true);
    
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      router.push('/onboarding/basic-info');
    }, 1500);
  };

  const handleResend = () => {
    alert('OTP resent successfully!');
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    inputRefs.current[0]?.focus();
    if (typeof window !== 'undefined') {
      setPhoneNumber(localStorage.getItem('phoneNumber') || '');
    }
  }, []);

  return (
    <div className="mobile-container min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Back Button */}
      <div className="p-4">
        <button
          onClick={() => router.back()}
          className="text-2xl"
        >
          ←
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-32">
        <div className="text-center mb-12">
          <div className="text-5xl mb-4">📱</div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Enter OTP</h1>
          <p className="text-gray-600">
            We sent a code to {phoneNumber || 'your phone'}
          </p>
        </div>

        {/* OTP Input */}
        <div className="flex gap-3 justify-center mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="tel"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-[#FF6B9D] focus:outline-none"
            />
          ))}
        </div>

        {/* Resend Link */}
        <div className="text-center mb-8">
          <button
            onClick={handleResend}
            className="text-[#FF6B9D] text-sm font-medium"
          >
            Didn't receive code? Resend
          </button>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isLoading || otp.join('').length !== 6}
          className="btn-primary w-full"
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    </div>
  );
}
