'use client';

import { useRouter } from 'next/navigation';
import { AuroraBackground, GlassCard, PrimaryButton } from './components/shared';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-1 items-center justify-center px-6">
            <GlassCard className="w-full p-8 text-center">
              <p className="text-[40px] mb-3" aria-hidden>
                🧭
              </p>
              <h1 className="text-[18px] font-semibold text-[#1A1A2E] mb-1.5">Page not found</h1>
              <p className="text-[13px] text-[#1A1A2E]/60 mb-6">
                That page doesn&apos;t exist or has moved.
              </p>
              <PrimaryButton onClick={() => router.push('/discover')}>Go to Discover</PrimaryButton>
            </GlassCard>
          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}
