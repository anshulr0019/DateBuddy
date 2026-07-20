'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SplashScreen() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Auto-advance after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
      router.push('/welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  if (!showSplash) {
    return null;
  }

  return (
    <div className="mobile-container">
      <div className="psychedelic-bg flex flex-col items-center justify-center h-screen">
        <div className="pulse">
          <div className="text-white text-6xl font-bold mb-4">💕</div>
          <h1 className="text-white text-4xl font-bold mb-2">Dil Se</h1>
        </div>
        <p className="text-white text-lg mt-4 opacity-90">Find your vibe</p>
      </div>
    </div>
  );
}
