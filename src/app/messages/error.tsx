'use client';

import { useEffect } from 'react';
import { AuroraBackground, GlassCard, PrimaryButton } from '../components/shared';

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Messages page error:', error);
  }, [error]);

  return (
    <div className="h-dvh w-full bg-[#FAFBF9] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col bg-[#FAFBF9] shadow-2xl sm:border-x sm:border-[#1A1A2E]/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-1 items-center justify-center px-6 pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
            <GlassCard className="w-full p-8 text-center">
              <p className="text-[40px] mb-3" aria-hidden>
                💬
              </p>
              <h1 className="text-[18px] font-semibold text-[#1A1A2E] mb-1.5">
                Something went wrong
              </h1>
              <p className="text-[13px] text-[#1A1A2E]/60 mb-6">
                We couldn&apos;t load your chats. Please try again.
              </p>
              <PrimaryButton onClick={reset}>Try again</PrimaryButton>
            </GlassCard>
          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}
