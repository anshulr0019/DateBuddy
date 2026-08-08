'use client';

import { useRouter } from 'next/navigation';

export default function TermsPage() {
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
          <h1 className="text-[20px] font-extrabold text-[#1A1A2E] tracking-tight">Terms of Service</h1>
        </div>

        <div className="prose prose-sm max-w-none text-[#1A1A2E]/80 space-y-6">
          <p className="text-[13px] text-[#1A1A2E]/50">Last updated: August 2026</p>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">1. Acceptance of Terms</h2>
            <p className="text-[14px] leading-relaxed">
              By downloading, installing, or using DateBuddy ("the App"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the App. These terms constitute a legally binding
              agreement between you and DateBuddy.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">2. Eligibility</h2>
            <p className="text-[14px] leading-relaxed">
              You must be at least 18 years of age to use DateBuddy. By using the App, you represent and warrant that
              you are 18 years of age or older. Accounts found to belong to minors will be immediately terminated.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">3. Account Registration</h2>
            <p className="text-[14px] leading-relaxed">
              You must provide accurate and complete information when creating your account. You are responsible for
              maintaining the security of your account and for all activities that occur under your account.
              DateBuddy reserves the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">4. User Conduct</h2>
            <p className="text-[14px] leading-relaxed mb-2">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 text-[14px]">
              <li>Post false, misleading, or fraudulent information</li>
              <li>Harass, threaten, or intimidate other users</li>
              <li>Share explicit or inappropriate content without consent</li>
              <li>Use the App for commercial solicitation or spam</li>
              <li>Impersonate any person or entity</li>
              <li>Use automated systems to interact with the App</li>
              <li>Attempt to circumvent any safety or security measures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">5. Photos and Content</h2>
            <p className="text-[14px] leading-relaxed">
              You retain ownership of content you upload. By uploading content, you grant DateBuddy a non-exclusive,
              worldwide, royalty-free license to use, store, and display your content to operate the App. You must only
              upload photos of yourself and content you have the right to share.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">6. Subscriptions & Payments</h2>
            <p className="text-[14px] leading-relaxed">
              DateBuddy offers optional paid subscriptions ("DateBuddy Gold"). Subscription fees are billed in advance
              and are non-refundable except as required by law. You may cancel your subscription at any time; your
              subscription benefits will continue until the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">7. Disclaimer of Warranties</h2>
            <p className="text-[14px] leading-relaxed">
              DateBuddy is provided "as is" without warranties of any kind. We do not guarantee that the App will be
              uninterrupted, secure, or error-free. We are not responsible for the conduct of any user, online or offline.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">8. Limitation of Liability</h2>
            <p className="text-[14px] leading-relaxed">
              To the maximum extent permitted by law, DateBuddy shall not be liable for any indirect, incidental,
              special, or consequential damages arising from your use of the App.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">9. Termination</h2>
            <p className="text-[14px] leading-relaxed">
              We reserve the right to suspend or terminate your account at our sole discretion if you violate these terms.
              You may delete your account at any time from the Settings page.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">10. Changes to Terms</h2>
            <p className="text-[14px] leading-relaxed">
              We may update these Terms of Service from time to time. We will notify you of significant changes via
              the App or by email. Continued use of the App after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-2">11. Contact Us</h2>
            <p className="text-[14px] leading-relaxed">
              If you have questions about these Terms, please contact us at{' '}
              <a href="mailto:support@datebuddy.app" className="text-[#F43F5E] underline">
                support@datebuddy.app
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
