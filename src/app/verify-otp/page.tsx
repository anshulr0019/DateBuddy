'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo, { BRAND_NAME } from '../components/BrandLogo';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    setOtp(newOtp);

    // Focus last populated input or next empty input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs[nextIndex].current?.focus();
  };

  const handleChange = (value: string, index: number) => {
    // Sanitize non-numeric input
    const cleanValue = value.replace(/\D/g, '');
    
    // Handle multi-character entry (iOS OTP autofill)
    if (cleanValue.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = cleanValue[i] || '';
      }
      setOtp(newOtp);
      const nextIdx = Math.min(cleanValue.length, 5);
      inputRefs[nextIdx].current?.focus();
      return;
    }

    const digit = cleanValue.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const phoneNumber = typeof window !== 'undefined' ? localStorage.getItem('phoneNumber') : null;
      if (!phoneNumber) {
        setError('We lost your phone number. Please start again.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp: code }),
      });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('userId', String(data.user.id));
        }
        router.push(data.onboardingComplete ? '/discover' : '/onboarding/basic-info');
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-dvh max-h-dvh relative flex flex-col items-center justify-between p-6 sm:p-8 overflow-hidden bg-[#FAFAF7] text-[#1A1A2E] font-sans mx-auto max-w-[440px] pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]">
      {/* Aurora Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-[#FF6B9D]/20 blur-[60px]" />
        <div className="absolute top-[30%] right-[-15%] w-[320px] h-[320px] rounded-full bg-[#B76CFF]/20 blur-[60px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[350px] h-[350px] rounded-full bg-[#E86AC7]/15 blur-[60px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-[#7B68EE]/15 blur-[60px]" />
      </div>

      {/* Top bar with Back button & Badge */}
      <div className="w-full flex items-center justify-between z-10 pt-2">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="h-12 w-12 rounded-2xl bg-white border border-[#1A1A2E]/10 flex items-center justify-center text-[#1A1A2E] shadow-sm hover:bg-white/90 active:scale-95 transition-all cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="px-3.5 py-1.5 rounded-full bg-white/70 border border-white/60 backdrop-blur-xl text-[11px] uppercase tracking-wide font-medium text-[#1A1A2E]/60 shadow-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
          Secure Verification
        </div>
      </div>

      {/* Center content container */}
      <div className="w-full z-10 flex flex-col items-center my-auto py-6">
        {/* Logo/Icon container */}
        <BrandLogo size={76} className="mb-6" />

        <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-[1.05] text-center mb-3 text-[#1A1A2E]">
          Enter Code
        </h1>
        <p className="text-[15px] leading-relaxed text-[#1A1A2E]/60 text-center mb-8 max-w-[300px]">
          We’ve sent a security code to your registered mobile number.
        </p>

        {/* Glass Morphism Card */}
        <div className="w-full p-5 sm:p-6 rounded-[28px] bg-white/70 border border-white/60 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(26,26,46,0.25)] flex flex-col items-center">
          <form onSubmit={handleVerify} className="w-full flex flex-col items-center">
            <div className="flex justify-center gap-1.5 sm:gap-2.5 mb-6 w-full">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  id={`otp-${index}`}
                  name={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  aria-label={`Digit ${index + 1} of 6`}
                  className="w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-semibold rounded-xl bg-white/90 border border-[#1A1A2E]/10 text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/50 focus:border-[#FF6B9D] transition-all shadow-sm select-none"
                />
              ))}
            </div>

            {error && (
              <div className="w-full p-3 mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white font-medium text-[16px] shadow-[0_16px_40px_-16px_rgba(123,104,238,0.7)] hover:opacity-95 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center min-h-[44px]"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-[14px] text-[#1A1A2E]/60">
              <span>Didn&apos;t receive code?</span>
              <button
                type="button"
                onClick={() => setResendCooldown(30)}
                className="text-[#FF6B9D] font-medium hover:underline cursor-pointer min-h-[44px] inline-flex items-center"
              >
                Resend
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer / Caption */}
      <div className="w-full text-center z-10 py-4">
        <p className="text-[12px] uppercase tracking-wide font-medium text-[#1A1A2E]/40">
          {BRAND_NAME} • Secure Verification
        </p>
      </div>
    </main>
  );
}