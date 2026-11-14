'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GoogleSignInModal from '@/app/components/GoogleSignInModal';
import BrandLogo from '@/app/components/BrandLogo';
import { sendFirebaseOTP } from '@/lib/firebase';


/* ------------------------------------------------------------------ */
/*  All animated-background CSS lives right here — no external file.  */
/* ------------------------------------------------------------------ */
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_auth_failed: 'Google sign-in was cancelled or failed. Please try again.',
  invalid_state: 'Your sign-in session expired. Please try again.',
  missing_google_client_id: 'Google sign-in is not configured (missing client ID). Restart the server after setting NEXT_PUBLIC_GOOGLE_CLIENT_ID.',
  missing_credentials: 'Google sign-in is not configured (missing credentials on the server).',
  token_exchange_failed: 'Could not verify your Google account. Please try again.',
  invalid_user_data: 'Google did not return a verified account. Please use a verified Google account.',
  oauth_exception: 'Something went wrong during Google sign-in. Please try again.',
};

export default function WelcomePage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    if (!code) return;
    setAuthError(OAUTH_ERROR_MESSAGES[code] ?? 'Sign-in failed. Please try again.');
    // Strip the param so middleware resumes normal redirects and a reload doesn't re-show the error.
    window.history.replaceState(null, '', '/welcome');
  }, []);

  const isValid = phoneNumber.length === 10;

  const handleSendOTP = async () => {
    if (!isValid) return;
    setIsLoading(true);
    setOtpError("");
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("phoneNumber", phoneNumber);
      }

      // Try Firebase Phone Auth first (10,000 free SMS / month!)
      try {
        await sendFirebaseOTP(phoneNumber);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("authMethod", "firebase");
        }
        setIsLoading(false);
        router.push("/verify-otp");
        return;
      } catch (firebaseErr: any) {
        console.error("Firebase Phone Auth error:", firebaseErr);
        const code = firebaseErr?.code;
        if (code === 'auth/operation-not-allowed') {
          setOtpError("Phone Sign-in is not enabled in Firebase Console yet. Please enable Phone Auth in Firebase Console → Authentication.");
          setIsLoading(false);
          return;
        } else if (code === 'auth/invalid-phone-number') {
          setOtpError("Invalid phone number. Please enter a valid 10-digit number.");
          setIsLoading(false);
          return;
        } else if (code === 'auth/too-many-requests') {
          setOtpError("Too many SMS attempts for this number. Please try again later.");
          setIsLoading(false);
          return;
        } else if (code === 'auth/invalid-app-credential' || code === 'auth/captcha-check-failed') {
          setOtpError("Domain not authorized in Firebase Console. Please add your domain to Firebase → Authentication → Settings.");
          setIsLoading(false);
          return;
        }
      }

      // Fallback to server API send-otp
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();

      if (!data.success) {
        setOtpError(data.message || 'Could not send the code. Please try again.');
        setIsLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("authMethod", "server");
      }
      setIsLoading(false);
      router.push("/verify-otp");
    } catch {
      setIsLoading(false);
      setOtpError('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className={`welcome-root fixed inset-0 h-full w-full overflow-hidden bg-infyn-paper text-infyn-ink ${focused ? 'welcome-typing' : ''}`}>
      <div id="recaptcha-container" />

      <GoogleSignInModal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} />

      <div className="relative mx-auto flex h-full w-full max-w-[440px] flex-col px-6 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <header className="flex flex-shrink-0 items-center justify-between">
          <BrandLogo size={30} withWordmark wordmarkClassName="font-display text-[20px] tracking-tight" />
          <a href="/help" className="min-h-[44px] flex items-center px-1 text-[14px] font-medium text-infyn-secondary">
            Help
          </a>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none flex flex-col -mx-6 px-6">
          {/* Illustration: a first conversation. Decorative only. */}
          <div className="welcome-hero" aria-hidden="true">
            <div className="welcome-hero-inner">
              <div className="welcome-bubble welcome-bubble-theirs" style={{ '--d': '150ms', '--f': '7s' } as React.CSSProperties}>
                Coffee this weekend?
              </div>
              <div className="welcome-bubble welcome-bubble-mine" style={{ '--d': '550ms', '--f': '8s' } as React.CSSProperties}>
                Only if I get to pick the place.
              </div>
              <div className="welcome-bubble welcome-bubble-theirs" style={{ '--d': '950ms', '--f': '6.5s' } as React.CSSProperties}>
                Deal. Somewhere with good music.
              </div>
              <span className="welcome-heart" style={{ '--d': '1300ms' } as React.CSSProperties}>
                <BrandLogo size={26} />
              </span>
            </div>
          </div>

          <section className="flex-shrink-0 mt-auto pt-4">
            <h1 className="font-display text-[40px] leading-[1.05] tracking-[-0.03em] text-infyn-ink">
              Find your <span className="text-infyn-rose">vibe.</span>
            </h1>
            <p className="mt-2 max-w-[320px] text-[16px] leading-relaxed text-infyn-secondary">
              Meet people who share your interests, and take the conversation from there.
            </p>
          </section>

          <section className="flex-shrink-0 mt-6">
            <label htmlFor="phone" className="block text-[13px] font-semibold text-infyn-secondary">
              Phone number
            </label>
            <div
              className={`mt-2 flex items-stretch gap-2 rounded-2xl border bg-infyn-surface p-1.5 transition-[border-color,box-shadow] duration-200 ${
                focused ? 'border-infyn-rose shadow-[0_0_0_3px_rgba(158,27,65,0.12)]' : 'border-infyn-border'
              }`}
            >
              <div className="flex items-center gap-1.5 rounded-xl bg-infyn-surface-soft px-3 text-[16px] font-medium text-infyn-ink">
                <span className="font-system text-base leading-none" aria-hidden>🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                value={phoneNumber}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210"
                aria-invalid={Boolean(otpError)}
                aria-describedby={otpError ? 'phone-error' : undefined}
                className="min-w-0 flex-1 bg-transparent px-2 min-h-[44px] text-[17px] font-medium tracking-wide text-infyn-ink placeholder:text-infyn-muted/60 outline-none"
              />
            </div>

            {otpError && (
              <p id="phone-error" role="alert" className="mt-2 text-[14px] text-infyn-rose">{otpError}</p>
            )}

            <button
              onClick={handleSendOTP}
              disabled={isLoading || !isValid}
              className="mt-3 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-infyn-rose text-[16px] font-semibold text-[#fff8f0] shadow-[0_1px_2px_rgba(158,27,65,0.15),0_10px_22px_-10px_rgba(158,27,65,0.6)] transition-[transform,opacity] duration-150 active:scale-[0.985] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
                  Sending code…
                </>
              ) : (
                'Send verification code'
              )}
            </button>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-infyn-border" />
              <span className="text-[13px] text-infyn-muted">or</span>
              <div className="h-px flex-1 bg-infyn-border" />
            </div>

            {authError && (
              <p role="alert" className="mb-3 text-[14px] text-infyn-rose text-center">{authError}</p>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => { setAuthError(''); setShowGoogleModal(true); }}
                className="flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-infyn-border bg-infyn-surface text-[15px] font-medium text-infyn-ink active:bg-infyn-surface-soft transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.5-4.8 9.5-9.3 0-.6-.1-1.1-.2-1.6H12z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                disabled
                title="Apple sign-in is coming soon"
                className="flex min-h-[50px] items-center justify-center gap-2 rounded-full border border-infyn-border bg-infyn-surface text-[15px] font-medium text-infyn-muted cursor-not-allowed"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.05 20.28c-.98.95-2.05.86-3.08.4-1.09-.47-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Apple · soon
              </button>
            </div>

            <p className="mt-4 text-center text-[13px] leading-relaxed text-infyn-secondary">
              By continuing you agree to our{' '}
              <a href="/terms" className="text-infyn-ink underline underline-offset-2">Terms</a> and{' '}
              <a href="/privacy" className="text-infyn-ink underline underline-offset-2">Privacy Policy</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
