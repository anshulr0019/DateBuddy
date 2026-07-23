'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/* ------------------------------------------------------------------ */
/*  All animated-background CSS lives right here — no external file.  */
/* ------------------------------------------------------------------ */
const AURORA_CSS = `
.aurora-stage {
  background:
    radial-gradient(circle at 50% 112%, rgba(255,107,157,0.5), transparent 34%),
    radial-gradient(circle at 18% 88%, rgba(255,180,208,0.48), transparent 32%),
    radial-gradient(circle at 86% 82%, rgba(123,104,238,0.38), transparent 34%),
    linear-gradient(180deg,#fffafc 0%,#fafaf7 48%,#fff3f8 100%);
}
.aurora-stage::before,
.aurora-stage::after {
  content:"";position:absolute;inset:-18%;pointer-events:none;
  will-change:transform,opacity,background-position;
}
.aurora-stage::before {
  background:
    radial-gradient(circle at 22% 76%, rgba(255,107,157,0.62), transparent 30%),
    radial-gradient(circle at 72% 70%, rgba(183,108,255,0.52), transparent 28%),
    radial-gradient(circle at 50% 96%, rgba(255,214,232,0.95), transparent 34%),
    radial-gradient(circle at 84% 28%, rgba(123,104,238,0.25), transparent 26%);
  filter:blur(34px) saturate(1.2);opacity:.95;
  animation:aurora-mesh-flow 7s ease-in-out infinite alternate;
}
.aurora-stage::after {
  inset:auto -28% -30% -28%;height:60%;
  background:conic-gradient(from 160deg at 50% 82%,
    rgba(255,107,157,.05),rgba(255,107,157,.75),rgba(183,108,255,.66),
    rgba(123,104,238,.58),rgba(255,180,208,.78),rgba(255,107,157,.05));
  filter:blur(42px) saturate(1.35);opacity:.86;transform-origin:50% 100%;
  animation:aurora-bottom-bloom 5.6s ease-in-out infinite alternate;
}
.aurora-blob{position:absolute;border-radius:9999px;filter:blur(54px) saturate(1.25);will-change:transform,opacity;}
.aurora-blob-1{width:460px;height:460px;left:-120px;top:18%;background:#ff6b9d;opacity:.6;animation:aurora-drift-1 6.8s ease-in-out infinite alternate;}
.aurora-blob-2{width:500px;height:500px;right:-160px;top:12%;background:#7b68ee;opacity:.48;animation:aurora-drift-2 8s ease-in-out infinite alternate;}
.aurora-blob-3{width:520px;height:520px;left:50%;bottom:-180px;background:#ffb4d0;opacity:.78;animation:aurora-drift-3 6.2s ease-in-out infinite alternate;}
.aurora-blob-4{width:360px;height:360px;left:10%;top:-120px;background:#b76cff;opacity:.44;animation:aurora-drift-4 9s ease-in-out infinite alternate;}
.aurora-sheen{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(250,250,247,0) 0%,rgba(250,250,247,.25) 60%,rgba(250,250,247,0) 100%);
  animation:aurora-sheen 4.8s ease-in-out infinite alternate;}
@keyframes aurora-mesh-flow{
  0%{opacity:.72;transform:translate3d(0,72px,0) scale(1.04) rotate(-3deg);}
  45%{opacity:.98;transform:translate3d(-26px,12px,0) scale(1.1) rotate(2deg);}
  100%{opacity:.86;transform:translate3d(24px,-42px,0) scale(1.16) rotate(5deg);}
}
@keyframes aurora-bottom-bloom{
  0%{opacity:.58;transform:translate3d(0,90px,0) scale(.96) rotate(-8deg);}
  100%{opacity:.9;transform:translate3d(0,-26px,0) scale(1.12) rotate(8deg);}
}
@keyframes aurora-drift-1{0%{transform:translate3d(-28px,80px,0) scale(.95);opacity:.36;}100%{transform:translate3d(94px,-72px,0) scale(1.18);opacity:.68;}}
@keyframes aurora-drift-2{0%{transform:translate3d(50px,58px,0) scale(.96);opacity:.3;}100%{transform:translate3d(-118px,18px,0) scale(1.18);opacity:.56;}}
@keyframes aurora-drift-3{0%{transform:translate3d(-50%,118px,0) scale(.9);opacity:.48;}100%{transform:translate3d(-60%,-150px,0) scale(1.28);opacity:.9;}}
@keyframes aurora-drift-4{0%{transform:translate3d(-20px,40px,0) scale(.94);opacity:.22;}100%{transform:translate3d(78px,120px,0) scale(1.18);opacity:.48;}}
@keyframes aurora-sheen{0%{opacity:.18;transform:translateY(32px);}100%{opacity:.46;transform:translateY(-38px);}}
@media (prefers-reduced-motion: reduce){
  .aurora-blob,.aurora-stage::before,.aurora-stage::after,.aurora-sheen{animation:none;}
}
`;

export default function WelcomePage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const isValid = phoneNumber.length === 10;

  const handleSendOTP = () => {
    if (!isValid) return;
    setIsLoading(true);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("phoneNumber", phoneNumber);
      }
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      setIsLoading(false);
      router.push("/verify-otp");
    }, 900);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FAFAF7] text-[#1A1A2E]">
      {/* Inject animated background CSS — self-contained, no external file needed */}
      <style dangerouslySetInnerHTML={{ __html: AURORA_CSS }} />

      {/* Ambient aurora background */}
      <div aria-hidden className="aurora-stage pointer-events-none absolute inset-0 overflow-hidden">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-blob aurora-blob-4" />
        <div className="aurora-sheen" />
        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(26,26,46,0.06) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      {/* Mobile frame */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-[420px] flex-col px-6 pt-14 pb-10">
        {/* Brand row */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] shadow-[0_10px_30px_-10px_rgba(255,107,157,0.6)]">
              <span className="text-white text-lg">💕</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Dil Se</span>
          </div>
          <a
            href="/help"
            className="text-[13px] font-medium text-[#1A1A2E]/60 transition hover:text-[#1A1A2E]"
          >
            Need help?
          </a>
        </header>

        {/* Hero */}
        <section className="mt-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#1A1A2E]/8 bg-white/60 px-3 py-1 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B9D]" />
            <span className="text-[11px] font-medium tracking-wide text-[#1A1A2E]/70 uppercase">
              New · Gen Z Edition
            </span>
          </div>
          <h1 className="mt-5 text-[40px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#1A1A2E]">
            Find your{" "}
            <span className="bg-gradient-to-r from-[#FF6B9D] via-[#B76CFF] to-[#7B68EE] bg-clip-text text-transparent">
              vibe.
            </span>
          </h1>
          <p className="mt-3 max-w-[300px] text-[15px] leading-relaxed text-[#1A1A2E]/60">
            India's most loved dating app for a generation that dates differently.
          </p>
        </section>

        {/* Card */}
        <section className="mt-10">
          <div className="rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[0_20px_60px_-30px_rgba(26,26,46,0.25)] backdrop-blur-xl">
            <label
              htmlFor="phone"
              className="block text-[12px] font-medium tracking-wide text-[#1A1A2E]/60 uppercase"
            >
              Phone number
            </label>

            <div
              className={`mt-2 flex items-stretch gap-2 rounded-2xl border bg-white/80 p-1.5 transition-all duration-200 ${
                focused
                  ? "border-transparent ring-2 ring-[#FF6B9D]/40 shadow-[0_8px_24px_-12px_rgba(255,107,157,0.5)]"
                  : "border-[#1A1A2E]/10"
              }`}
            >
              <div className="flex items-center gap-1.5 rounded-xl bg-[#1A1A2E]/[0.04] px-3 text-[15px] font-medium text-[#1A1A2E]">
                <span className="text-base leading-none">🇮🇳</span>
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
                onChange={(e) =>
                  setPhoneNumber(e.target.value.replace(/\D/g, ""))
                }
                placeholder="98765 43210"
                className="min-w-0 flex-1 bg-transparent px-2 text-[17px] font-medium tracking-wide text-[#1A1A2E] placeholder-[#1A1A2E]/25 outline-none"
              />
              {isValid && (
                <div className="flex items-center pr-2 text-[#22C55E]">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>

            <button
              onClick={handleSendOTP}
              disabled={isLoading || !isValid}
              className="group relative mt-4 flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF6B9D] via-[#E86AC7] to-[#7B68EE] text-[15px] font-semibold text-white shadow-[0_16px_40px_-16px_rgba(123,104,238,0.7)] transition-all duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <span
                aria-hidden
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.25) 50%, transparent 80%)",
                }}
              />
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Sending code…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Send verification code
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#1A1A2E]/10" />
              <span className="text-[11px] font-medium tracking-widest text-[#1A1A2E]/40 uppercase">
                or continue with
              </span>
              <div className="h-px flex-1 bg-[#1A1A2E]/10" />
            </div>

            {/* Social */}
            <div className="grid grid-cols-2 gap-2.5">
              <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#1A1A2E]/10 bg-white text-[14px] font-medium text-[#1A1A2E] transition-all hover:border-[#1A1A2E]/25 hover:shadow-sm active:scale-[0.98]">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.5-4.8 9.5-9.3 0-.6-.1-1.1-.2-1.6H12z"
                  />
                </svg>
                Google
              </button>
              <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#1A1A2E]/10 bg-white text-[14px] font-medium text-[#1A1A2E] transition-all hover:border-[#1A1A2E]/25 hover:shadow-sm active:scale-[0.98]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#1A1A2E">
                  <path d="M17.05 20.28c-.98.95-2.05.86-3.08.4-1.09-.47-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Apple
              </button>
            </div>
          </div>

          {/* Terms */}
          <p className="mt-5 px-2 text-center text-[12px] leading-relaxed text-[#1A1A2E]/50">
            By continuing you agree to our{" "}
            <a
              href="/terms"
              className="font-medium text-[#1A1A2E]/80 underline decoration-[#FF6B9D]/40 underline-offset-2 hover:text-[#FF6B9D]"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="font-medium text-[#1A1A2E]/80 underline decoration-[#FF6B9D]/40 underline-offset-2 hover:text-[#FF6B9D]"
            >
              Privacy Policy
            </a>
            .
          </p>
        </section>

        {/* Footer trust badge */}
        <div className="mt-auto pt-10">
          <div className="mx-auto flex items-center justify-center gap-2 text-[11px] font-medium tracking-wide text-[#1A1A2E]/45 uppercase">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Verified profiles · End-to-end secure
          </div>
        </div>
      </div>
    </div>
  );
}