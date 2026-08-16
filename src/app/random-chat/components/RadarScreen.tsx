'use client';

import { useState, useEffect } from 'react';
import { hapticLight } from '@/app/lib/haptics';

const FUNNY_FACTS = [
  {
    icon: '🦦',
    tag: 'Cute Fact',
    fact: 'Otters hold hands while sleeping so they don’t float away. Absolute relationship goals.',
  },
  {
    icon: '🍟',
    tag: 'Dating Tip',
    fact: 'Sharing your french fries on a first date increases mutual attraction by 400%.',
  },
  {
    icon: '🐮',
    tag: 'Fun Trivia',
    fact: 'Cows have best friends and get stressed when separated. Time to find yours!',
  },
  {
    icon: '💬',
    tag: 'Pro Tip',
    fact: 'Sending a funny meme in the first 3 minutes increases conversation chemistry by 300%.',
  },
  {
    icon: '🍌',
    tag: 'Random Fact',
    fact: 'Bananas are berries, but strawberries aren’t. Don’t worry, your match is 100% real.',
  },
  {
    icon: '🐧',
    tag: 'Romance Fact',
    fact: 'Gentoo penguins propose to their soulmates with a smooth pebble. Peak romantic efficiency.',
  },
  {
    icon: '🍕',
    tag: 'Life Truth',
    fact: 'Pizza is a pie chart that scientifically proves you should eat more pizza.',
  },
  {
    icon: '🦩',
    tag: 'Weird Fact',
    fact: 'Flamingos only bend their ankles, not their knees. Now you can never unsee it.',
  },
  {
    icon: '🐱',
    tag: 'Cat Logic',
    fact: 'Cats spend 70% of life sleeping and 30% judging your texting game.',
  },
  {
    icon: '🍫',
    tag: 'History Fact',
    fact: 'Ancient Aztecs used chocolate as actual currency. Best currency ever invented.',
  },
  {
    icon: '🎲',
    tag: 'Quick Riddle',
    fact: 'Two truths and a lie: You’re cool, you’re fun, you won’t vibe with anyone here. (3 is the lie 😉).',
  },
];

export function RadarScreen({
  vibe,
  onlineCount,
  onCancel,
  busy,
}: {
  vibe: string | null;
  onlineCount: number;
  onCancel: () => void;
  busy: boolean;
}) {
  const [factIndex, setFactIndex] = useState(0);

  // Rotate funny facts every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUNNY_FACTS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const currentFact = FUNNY_FACTS[factIndex];

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-between px-6 pt-4 pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
      {/* Top Header info */}
      <div className="text-center">
        <h1 className="text-[22px] font-extrabold text-[#1E293B] mb-1">Looking for your vibe…</h1>
        <p className="text-[13px] text-[#1E293B]/55 font-medium max-w-[280px] mx-auto leading-relaxed">
          {vibe
            ? <>Matching you with someone in the <span className="font-bold text-[#F43F5E]">{vibe}</span> mood.</>
            : 'Scanning for someone who wants to chat right now.'}
        </p>
      </div>

      {/* Radar Animation Area */}
      <div className="relative h-48 w-48 my-2" role="status" aria-label="Searching for a conversation partner">
        {/* Radar rings */}
        <div className="rc-ring absolute inset-0 rounded-full border border-[#FF6B9D]/30" style={{ animationDelay: '0s' }} />
        <div className="rc-ring absolute inset-0 rounded-full border border-[#7B68EE]/30" style={{ animationDelay: '0.5s' }} />
        <div className="rc-ring absolute inset-0 rounded-full border border-[#FF6B9D]/20" style={{ animationDelay: '1s' }} />

        {/* Sweep */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="rc-sweep absolute inset-0" />
        </div>

        {/* Blips */}
        <div className="rc-blip absolute left-[38%] top-[30%] h-2.5 w-2.5 rounded-full bg-[#F43F5E] shadow-[0_0_10px_rgba(244,63,94,0.9)]" />
        <div className="rc-blip absolute right-[28%] top-[55%] h-2 w-2 rounded-full bg-[#7B68EE] shadow-[0_0_10px_rgba(123,104,238,0.9)]" style={{ animationDelay: '1.2s' }} />
        <div className="rc-blip absolute left-[26%] bottom-[30%] h-2.5 w-2.5 rounded-full bg-[#FB7185] shadow-[0_0_10px_rgba(251,113,133,0.9)]" style={{ animationDelay: '2.1s' }} />

        {/* Center Dice */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="rc-pulse absolute inset-0 rounded-full bg-[#FF6B9D]/40" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#7B68EE] text-white shadow-[0_12px_40px_-10px_rgba(244,63,94,0.6)]">
              <span className="text-2xl">🎲</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rotating Funny Facts Card */}
      <div className="w-full max-w-[340px] flex flex-col items-center">
        <div className="w-full bg-white/90 backdrop-blur-md border border-[#FF6B9D]/20 rounded-2xl p-3.5 shadow-sm min-h-[96px] flex flex-col justify-center transition-all duration-300">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-base">{currentFact.icon}</span>
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#F43F5E] bg-[#FFF0F4] px-2 py-0.5 rounded-full">
              {currentFact.tag}
            </span>
          </div>
          <p
            key={factIndex}
            className="text-[12.5px] font-medium text-[#1E293B]/80 leading-snug animate-fade-in"
          >
            {currentFact.fact}
          </p>
        </div>

        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-gray-200/80 px-3.5 py-1 text-[11.5px] font-semibold text-[#1E293B]/60 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {onlineCount > 0 ? `${onlineCount} people looking right now` : 'Scanning active members nearby'}
        </p>
      </div>

      {/* Cancel Button */}
      <button
        onClick={() => { hapticLight(); onCancel(); }}
        disabled={busy}
        className="mt-2 rounded-full bg-white border border-gray-200 text-[#1E293B]/70 px-8 py-2.5 text-[13.5px] font-bold hover:bg-gray-50 active:scale-95 transition-all cursor-pointer disabled:opacity-60 shadow-2xs"
      >
        Cancel
      </button>
    </div>
  );
}
