'use client';

import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh w-full bg-[#FAFAF7] flex justify-center font-sans">
      <div className="w-full max-w-[440px] sm:max-w-lg md:max-w-2xl px-5 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#1A1A2E]/10 bg-white text-[#1A1A2E] shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-[20px] font-extrabold text-[#1A1A2E] tracking-tight">Privacy Policy</h1>
        </div>

        <div className="prose prose-sm max-w-none text-[#1A1A2E]/80 space-y-6">
          <p className="text-[13px] text-[#1A1A2E]/50">Last updated: August 2026</p>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">1. Information We Collect</h2>
            <p className="text-[14px] leading-relaxed mb-2">We collect the following categories of information:</p>
            <ul className="list-disc pl-5 space-y-1 text-[14px]">
              <li><strong>Account info:</strong> Phone number, name, date of birth, gender, and email (if linked via Google)</li>
              <li><strong>Profile info:</strong> Photos, bio, interests, location city</li>
              <li><strong>Usage data:</strong> Swipes, matches, messages, and app activity</li>
              <li><strong>Device info:</strong> Device type, OS version, and IP address</li>
              <li><strong>Location:</strong> City-level location you provide during onboarding (we do not track GPS continuously)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-[14px]">
              <li>To operate the dating and matching service</li>
              <li>To show your profile to other users based on their preferences</li>
              <li>To send notifications about matches and messages</li>
              <li>To detect and prevent fraud and abuse</li>
              <li>To improve and personalise your experience</li>
              <li>To process payments for subscriptions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">3. How We Share Your Information</h2>
            <p className="text-[14px] leading-relaxed mb-2">We do not sell your personal data. We share information only with:</p>
            <ul className="list-disc pl-5 space-y-1 text-[14px]">
              <li><strong>Other users:</strong> Your profile information (name, age, photos, bio, interests) is shown to other users</li>
              <li><strong>Service providers:</strong> Hosting (Vercel), database (Neon), media storage (Cloudinary), SMS (Twilio), payments (Razorpay)</li>
              <li><strong>Law enforcement:</strong> When required by law or to protect safety</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">4. Your Profile Visibility</h2>
            <p className="text-[14px] leading-relaxed">
              Your profile is visible to other registered users by default. You can enable Incognito Mode in Settings
              to hide your profile from the discovery feed. You can also block specific users, which removes them from
              your feed and prevents them from seeing your profile.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">5. Data Retention</h2>
            <p className="text-[14px] leading-relaxed">
              We retain your data as long as your account is active. When you delete your account, we delete your
              profile, photos, matches, and messages. Some data may be retained for legal compliance for up to 90 days.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">6. Security</h2>
            <p className="text-[14px] leading-relaxed">
              We use industry-standard measures to protect your data, including encrypted connections (HTTPS),
              secure session tokens, and access controls. No system is 100% secure — please use a unique phone
              number for your account and report suspicious activity to us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">7. Your Rights</h2>
            <p className="text-[14px] leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 text-[14px]">
              <li>Access and download your personal data</li>
              <li>Correct inaccurate data via the Profile and Settings pages</li>
              <li>Delete your account and all associated data from Settings</li>
              <li>Withdraw consent for optional data uses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">8. Cookies & Tracking</h2>
            <p className="text-[14px] leading-relaxed">
              We use a single secure HTTP-only cookie for session authentication. We do not use third-party
              advertising trackers or sell data to ad networks.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">9. Children's Privacy</h2>
            <p className="text-[14px] leading-relaxed">
              DateBuddy is not intended for users under 18. We do not knowingly collect information from minors.
              If we discover a minor has created an account, we will immediately delete it.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">10. Changes to This Policy</h2>
            <p className="text-[14px] leading-relaxed">
              We may update this Privacy Policy. We will notify you of significant changes through the App.
              Your continued use of the App constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">11. Contact Us</h2>
            <p className="text-[14px] leading-relaxed">
              For privacy-related questions or data requests, contact us at{' '}
              <a href="mailto:privacy@datebuddy.app" className="text-[#F43F5E] underline">
                privacy@datebuddy.app
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
