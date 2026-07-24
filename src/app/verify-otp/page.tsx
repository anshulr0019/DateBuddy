'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);

  const handleChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 4) {
      setError('Please enter the complete 4-digit code.');
      return;
    }

    setLoading(true);
    setError('');

    // Directly push to discover without calling backend
    router.push('/discover');
  };

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-between p-6 sm:p-8 overflow-hidden bg-[#FAFAF7] text-[#1A1A2E] font-sans mx-auto max-w-[420px]">
      {/* Aurora Background with 4 blurred color blobs & dot grid overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-[#FF6B9D]/20 blur-[80px] animate-pulse" />
        <div className="absolute top-[30%] right-[-15%] w-[320px] h-[320px] rounded-full bg-[#B76CFF]/20 blur-[90px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[350px] h-[350px] rounded-full bg-[#E86AC7]/15 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-[#7B68EE]/15 blur-[80px]" />
        
        {/* Dot grid overlay */}
        <div className="absolute inset-0 opacity-[0.20]" style={{ backgroundImage: 'radial-gradient(#1A1A2E 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      {/* Top bar with Back button & Badge */}
      <div className="w-full flex items-center justify-between z-10 pt-2">
        <button
          onClick={() => router.back()}
          className="h-12 w-12 rounded-2xl bg-white border border-[#1A1A2E]/10 flex items-center justify-center text-[#1A1A2E] shadow-sm hover:bg-white/90 transition-all cursor-pointer"
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
        <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] flex items-center justify-center shadow-xl shadow-[#7B68EE]/20 mb-6 border border-white/40">
          <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-[1.05] text-center mb-3 text-[#1A1A2E]">
          Enter Code
        </h1>
        <p className="text-[15px] leading-relaxed text-[#1A1A2E]/60 text-center mb-8 max-w-[300px]">
          We’ve sent a 4-digit security code to your registered mobile number or email address.
        </p>

        {/* Glass Morphism Card */}
        <div className="w-full p-8 rounded-[28px] bg-white/70 border border-white/60 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(26,26,46,0.25)] flex flex-col items-center">
          <form onSubmit={handleVerify} className="w-full flex flex-col items-center">
            <div className="flex justify-center gap-3 sm:gap-4 mb-6 w-full">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-14 h-16 sm:w-16 sm:h-20 text-center text-3xl font-semibold rounded-2xl bg-white/80 border border-[#1A1A2E]/10 text-[#1A1A2E] focus:outline-none focus:ring-2 focus:ring-[#FF6B9D]/40 focus:border-[#FF6B9D] transition-all shadow-sm"
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
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-white font-medium text-[16px] shadow-[0_16px_40px_-16px_rgba(123,104,238,0.7)] hover:opacity-95 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-[14px] text-[#1A1A2E]/60">
              <span>Didn't receive code?</span>
              <button
                type="button"
                onClick={() => setResendCooldown(30)}
                className="text-[#FF6B9D] font-medium hover:underline cursor-pointer"
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
          Dil Se Design System • Protected
        </p>
      </div>
    </main>
  );
}