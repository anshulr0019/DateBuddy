'use client';

import { useRouter } from 'next/navigation';
import { AuroraBackground } from '../components/shared';

export default function HelpPage() {
  const router = useRouter();

  const faqs = [
    { q: 'How does Dil Se work?', a: 'Dil Se is a dating and connections app designed for Gen Z. You can swipe profiles, host or join sports squads, and connect with people who share your vibe.' },
    { q: 'How do I complete phone verification?', a: 'Enter your 10-digit Indian phone number on the welcome screen, then enter the 6-digit code we text you. The code expires after 5 minutes.' },
    { q: 'Is Dil Se free to use?', a: 'Yes! Dil Se is 100% free with unlimited likes, real database messaging, and profile customization.' },
    { q: 'How do I edit my profile photos?', a: 'Go to your Profile tab, click "Edit Profile" or gear icon to update your bio, interests, and photos.' },
  ];

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col justify-between bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex-1 min-h-0 z-10 overflow-y-auto scrollbar-none px-6 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-8">
            {/* Top Bar */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => router.back()}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-[#1A1A2E]/10 text-[#1A1A2E] shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                ←
              </button>
              <h1 className="text-[22px] font-extrabold text-[#1A1A2E]">Help &amp; Support</h1>
            </div>

            {/* Support Hero Card */}
            <div className="rounded-[24px] bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] p-6 text-white shadow-lg mb-6">
              <div className="text-3xl mb-2">💬</div>
              <h2 className="text-[20px] font-extrabold mb-1">How can we help?</h2>
              <p className="text-[13.5px] text-white/85 leading-relaxed">
                Find answers to common questions below or reach out to our team anytime.
              </p>
            </div>

            {/* FAQs */}
            <div className="space-y-3 mb-6">
              <h3 className="text-[12px] font-bold text-[#1A1A2E]/40 uppercase tracking-wider px-1">Frequently Asked Questions</h3>
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-[20px] bg-white border border-[#1A1A2E]/8 p-4 shadow-2xs">
                  <h4 className="text-[15px] font-bold text-[#1A1A2E] mb-1.5">{faq.q}</h4>
                  <p className="text-[13.5px] text-[#1A1A2E]/65 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>

            {/* Contact Card */}
            <div className="rounded-[20px] bg-white border border-[#1A1A2E]/8 p-5 text-center shadow-2xs">
              <p className="text-[13px] font-medium text-[#1A1A2E]/60 mb-2">Still need assistance?</p>
              <a
                href="mailto:support@dilse.app"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A1A2E]/5 text-[#FF6B9D] font-bold text-[14px] hover:bg-[#FF6B9D]/10 transition-colors"
              >
                📧 Email Support
              </a>
            </div>
          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}
