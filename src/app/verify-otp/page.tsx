'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo, { BRAND_NAME } from '../components/BrandLogo';
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from '../lib/haptics';

const RESEND_SECONDS = 30;

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [shaking, setShaking] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Clear error when user starts typing again
  useEffect(() => {
    if (error && otp.some(d => d)) setError('');
  }, [otp]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    const next = Array.from({ length: 6 }, (_, i) => digits[i] ?? '');
    setOtp(next);
    hapticLight();
    const focusIdx = Math.min(digits.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (digits.length === 6) {
      // Small delay so state flushes before we submit
      setTimeout(() => submitCode(digits), 80);
    }
  };

  const handleChange = (value: string, index: number) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length > 1) {
      // iOS OTP autofill sends all digits to first input
      const next = Array.from({ length: 6 }, (_, i) => clean[i] ?? '');
      setOtp(next);
      hapticLight();
      const focusIdx = Math.min(clean.length, 5);
      inputRefs.current[focusIdx]?.focus();
      if (clean.length === 6) setTimeout(() => submitCode(clean), 80);
      return;
    }
    const digit = clean.slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit) {
      hapticLight();
      if (index < 5) inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const submitCode = useCallback(async (code: string) => {
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.');
      hapticWarning();
      triggerShake();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const phoneNumber = typeof window !== 'undefined' ? localStorage.getItem('phoneNumber') : null;
      if (!phoneNumber) {
        setError('We lost your phone number. Please start again.');
        hapticWarning();
        triggerShake();
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
        if (typeof window !== 'undefined') localStorage.setItem('userId', String(data.user.id));
        hapticSuccess();
        router.push(data.onboardingComplete ? '/discover' : '/onboarding/basic-info');
      } else {
        hapticWarning();
        setError(data.message || 'Invalid verification code. Please try again.');
        // Shake + clear so user can re-enter cleanly
        triggerShake();
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch {
      hapticWarning();
      triggerShake();
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    hapticMedium();
    submitCode(otp.join(''));
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    hapticLight();
    try {
      const phoneNumber = typeof window !== 'undefined' ? localStorage.getItem('phoneNumber') : null;
      if (!phoneNumber) { router.replace('/welcome'); return; }
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (data.success) {
        setCooldown(RESEND_SECONDS);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else {
        setError(data.message || 'Could not resend the code. Please try again.');
        hapticWarning();
      }
    } catch {
      setError('Network error. Please try again.');
      hapticWarning();
    } finally {
      setResending(false);
    }
  };

  const allFilled = otp.every(d => d !== '');

  return (
    <main
      className="h-dvh max-h-dvh relative flex flex-col items-center justify-between overflow-hidden bg-[#FAFAF7] text-[#1A1A2E] font-sans mx-auto max-w-[440px]"
      style={{
        paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))',
        paddingBottom: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-bottom, 0px)))',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
      }}
    >
      {/* Aurora background */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-12 -left-12 w-72 h-72 rounded-full bg-[#FF6B9D]/15 blur-[60px]" />
        <div className="absolute top-1/3 -right-16 w-80 h-80 rounded-full bg-[#B76CFF]/12 blur-[60px]" />
        <div className="absolute -bottom-10 left-1/4 w-72 h-72 rounded-full bg-[#7B68EE]/10 blur-[60px]" />
      </div>

      {/* Top bar */}
      <div className="w-full flex items-center justify-between z-10">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-[#1A1A2E]/70 shadow-[0_4px_16px_-8px_rgba(26,26,46,0.12)] backdrop-blur-xl active:scale-[0.92] transition-all cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5 rounded-full border border-white/60 bg-white/70 px-3 py-1.5 backdrop-blur-xl shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#1A1A2E]/60">Secure Verification</span>
        </div>
      </div>

      {/* Center content */}
      <div className="w-full z-10 flex flex-col items-center my-auto py-4">
        <BrandLogo size={72} className="mb-5" />

        <h1 className="text-[30px] sm:text-[36px] font-semibold tracking-[-0.03em] leading-[1.05] text-center mb-2 text-[#1A1A2E]">
          Enter Code
        </h1>
        <p className="text-[14.5px] leading-relaxed text-[#1A1A2E]/55 text-center mb-7 max-w-[280px]">
          We sent a 6-digit code to your registered mobile number.
        </p>

        {/* Glass card */}
        <div className="w-full rounded-[28px] border border-white/60 bg-white/75 p-5 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(26,26,46,0.2)] flex flex-col items-center">
          <form onSubmit={handleVerify} className="w-full flex flex-col items-center">
            {/* OTP inputs — shake on wrong code */}
            <div
              className={`flex justify-center gap-2 sm:gap-3 mb-5 w-full ${shaking ? 'animate-shake' : ''}`}
              role="group"
              aria-label="6-digit verification code"
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el; }}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  aria-label={`Digit ${index + 1} of 6`}
                  className={`h-14 w-full min-w-0 max-w-[48px] text-center text-[22px] font-bold rounded-2xl border-2 text-[#1A1A2E] transition-all duration-200 outline-none select-none ${
                    digit
                      ? 'border-[#FF6B9D] bg-gradient-to-br from-[#FF6B9D]/[0.06] to-[#7B68EE]/[0.06] shadow-[0_0_0_3px_rgba(255,107,157,0.12)]'
                      : 'border-[#1A1A2E]/10 bg-white/90 focus:border-[#FF6B9D] focus:shadow-[0_0_0_3px_rgba(255,107,157,0.12)]'
                  }`}
                />
              ))}
            </div>

            {error && (
              <div
                role="alert"
                className="w-full mb-4 flex items-start gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-rose-600 text-[13px] font-semibold leading-snug"
              >
                <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !allFilled}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white font-bold text-[15px] shadow-[0_12px_32px_-10px_rgba(123,104,238,0.6)] active:scale-[0.985] transition-all duration-200 disabled:opacity-40 disabled:active:scale-100 cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.2-8.56" />
                  </svg>
                  Verifying…
                </>
              ) : 'Verify Code'}
            </button>

            <div className="mt-5 flex items-center justify-center gap-2 text-[14px] text-[#1A1A2E]/55">
              <span>Didn&apos;t receive it?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="font-bold transition-all disabled:opacity-40 cursor-pointer min-h-[44px] inline-flex items-center"
                style={{ color: cooldown > 0 ? undefined : '#FF6B9D' }}
              >
                {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full text-center z-10">
        <p className="text-[11.5px] uppercase tracking-wide font-medium text-[#1A1A2E]/35">
          {BRAND_NAME} · Secure Verification
        </p>
      </div>
    </main>
  );
}
