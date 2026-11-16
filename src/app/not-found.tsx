'use client';

import { useRouter } from 'next/navigation';
import { AuroraBackground, GlassCard, PrimaryButton } from './components/shared';
import { Ic } from './components/icons';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="h-dvh w-full bg-infyn-paper flex justify-center overflow-hidden font-sans">
      <div className="relative h-full w-full max-w-[440px] sm:max-w-lg md:max-w-xl flex flex-col bg-infyn-paper shadow-2xl sm:border-x sm:border-infyn-ink/5 overflow-hidden">
        <AuroraBackground subtle>
          <div className="flex flex-1 items-center justify-center px-6">
            <GlassCard className="w-full p-8 text-center">
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-infyn-surface border border-infyn-border text-infyn-rose" aria-hidden><Ic.Compass className="w-7 h-7" /></div>
              <h1 className="text-[18px] font-normal text-infyn-ink mb-1.5 font-display">Page not found</h1>
              <p className="text-[13px] text-infyn-ink/60 mb-6">
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
