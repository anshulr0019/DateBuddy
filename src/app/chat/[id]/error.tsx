'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuroraBackground, GlassCard, PrimaryButton } from '../../components/shared';

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Chat page error:', error);
  }, [error]);

  return (
    <div className="h-dvh w-full bg-[#FAFAF7] flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col bg-[#FAFAF7] shadow-2xl sm:border-x sm:border-gray-200/60 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-1 items-center justify-center px-6">
            <GlassCard className="w-full p-8 text-center">
              <p className="text-[40px] mb-3" aria-hidden>
                💔
              </p>
              <h1 className="text-[18px] font-semibold text-[#1A1A2E] mb-1.5">
                Something went wrong
              </h1>
              <p className="text-[13px] text-[#1A1A2E]/60 mb-6">
                We couldn&apos;t load this conversation. Please try again.
              </p>
              <div className="flex flex-col gap-2">
                <PrimaryButton onClick={reset}>Try again</PrimaryButton>
                <button
                  onClick={() => router.replace('/messages')}
                  className="w-full py-2.5 rounded-xl text-[#1A1A2E]/60 text-[13px] font-semibold hover:bg-white/60 transition-colors cursor-pointer"
                >
                  Back to Chats
                </button>
              </div>
            </GlassCard>
          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}
