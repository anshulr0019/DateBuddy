'use client';

import React, { useState, useMemo } from 'react';

interface PromptItem {
  promptText?: string;
  prompt?: string;
  answer: string;
}

interface AIWingmanProps {
  partnerName?: string | null;
  partnerBio?: string | null;
  partnerInterests?: string[];
  partnerPrompts?: PromptItem[];
  onSelectOpener: (text: string) => void;
}

// Safe lightweight haptic fallback helper
const triggerHaptic = (style: 'light' | 'success' = 'light') => {
  try {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(style === 'success' ? [15, 30, 15] : 10);
    }
  } catch {
    /* ignore */
  }
};

export default function AIWingman({
  partnerName,
  partnerBio,
  partnerInterests = [],
  partnerPrompts = [],
  onSelectOpener,
}: AIWingmanProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const cleanName = partnerName?.trim()?.split(' ')[0] || 'there';

  const openers = useMemo(() => {
    const validInterests = Array.isArray(partnerInterests)
      ? partnerInterests.filter(i => typeof i === 'string' && i.trim().length > 0)
      : [];

    const validPrompts = Array.isArray(partnerPrompts)
      ? partnerPrompts.filter(p => p && typeof p.answer === 'string' && p.answer.trim().length > 0)
      : [];

    const interest = validInterests.length > 0
      ? validInterests[refreshKey % validInterests.length]
      : null;

    const promptObj = validPrompts.length > 0
      ? validPrompts[refreshKey % validPrompts.length]
      : null;

    // 1. Playful / Banter openers pool
    const playfulPool = [
      `Hey ${cleanName}, quick vibe check: what's your most controversial food opinion? 🍕`,
      `On a scale of 1 to 10, how chaotic is your weekend going to be, ${cleanName}? ✨`,
      `Rank these in order of priority: iced coffee, late-night drives, or spontaneous road trips? 🚗`,
      `Your profile gave strong main character energy, so I had to say hi 👋`,
      `Serious question ${cleanName}: what's your go-to karaoke anthem when no one's watching? 🎤`,
      `I'm guessing you're either super spontaneous or you have your next 3 weeks planned in Notion. Which one? 😂`,
    ];

    // 2. Contextual / Prompt / Interest openers pool
    const promptPool = [];
    if (promptObj?.answer) {
      const promptTitle = promptObj.promptText || promptObj.prompt || 'your profile';
      promptPool.push(`I had to ask about "${promptObj.answer}" from your prompt — what's the story behind that? 👀`);
      promptPool.push(`Saw your answer "${promptObj.answer}" and honestly respect it 😂 Tell me more!`);
    }
    if (interest) {
      promptPool.push(`I see you're into ${interest} — are you a casual fan or full-blown obsessed? 🔥`);
      promptPool.push(`Always great to match with someone into ${interest}! What got you into it? ✨`);
    }
    if (partnerBio && partnerBio.trim().length > 5) {
      promptPool.push(`Your bio caught my eye — "${partnerBio.trim().slice(0, 35)}..." Tell me the backstory! ✨`);
    }
    // Fallback if no prompt/interest
    if (promptPool.length === 0) {
      promptPool.push(`If you had 24 hours to plan the ultimate day out with zero budget limits, what are we doing? ✈️`);
      promptPool.push(`What's something you're unreasonably passionate about that most people don't know? 💡`);
    }

    // 3. Direct / Casual Activity Vibe pool
    const casualPool = [
      `Skip the small talk: what's your absolute holy grail coffee spot around here? ☕`,
      `Hey ${cleanName}! Are you more of a cozy cafe catchup person or a rooftop sunset vibe? 🌅`,
      `What's the best hidden gem spot you've discovered recently? Need fresh recommendations! 📍`,
      `If we were grabbing food right now, what cuisine are you picking without hesitation? 🌮`,
      `Tell me one place in the city everyone raves about that you think is completely overrated 🤫`,
    ];

    // Pick one from each pool based on refreshKey
    const playful = playfulPool[(refreshKey * 2 + 1) % playfulPool.length];
    const promptHook = promptPool[(refreshKey * 3) % promptPool.length];
    const casual = casualPool[(refreshKey * 2 + 3) % casualPool.length];

    return [
      {
        tag: 'Playful',
        emoji: '😏',
        badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        text: playful,
      },
      {
        tag: interest ? `Hook (${interest})` : 'Curious',
        emoji: '🎯',
        badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        text: promptHook,
      },
      {
        tag: 'Activity Vibe',
        emoji: '☕',
        badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
        text: casual,
      },
    ];
  }, [cleanName, partnerBio, partnerInterests, partnerPrompts, refreshKey]);

  const handleSelect = (text: string) => {
    triggerHaptic('success');
    onSelectOpener(text);
    setIsOpen(false);
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="w-full select-none mb-1">
      {/* Pill Toggle Button */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsOpen(prev => !prev);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
            isOpen
              ? 'bg-infyn-ink text-white shadow-sm'
              : 'bg-gradient-to-r from-infyn-rose/10 via-infyn-rose/10 to-infyn-rose/10 border border-infyn-rose/20 text-infyn-ink/80 hover:bg-infyn-rose/15'
          }`}
        >
          <span className="text-[12px]">✨</span>
          <span>AI Wingman</span>
          <span className="text-[10px] opacity-60">
            {isOpen ? '▲ Hide' : '▼ Icebreakers'}
          </span>
        </button>

        {isOpen && (
          <button
            type="button"
            onClick={handleRefresh}
            className="text-[11px] font-semibold text-infyn-rose hover:text-infyn-rose flex items-center gap-1 cursor-pointer transition-colors active:scale-90"
          >
            <span>🔄</span>
            <span>New Suggestions</span>
          </button>
        )}
      </div>

      {/* Expanded Suggestions Panel */}
      {isOpen && (
        <div className="mt-2 p-2.5 rounded-[22px] bg-infyn-surface/90 backdrop-blur-xl border border-infyn-ink/[0.08] shadow-[0_8px_30px_-6px_rgba(32,26,22,0.1)] space-y-2 animate-page-entry">
          <div className="px-1 pt-0.5 flex items-center justify-between">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-infyn-ink/40">
              Tap to use opener for {cleanName}:
            </p>
          </div>

          <div className="space-y-1.5">
            {openers.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(item.text)}
                className="w-full text-left p-2.5 rounded-xl bg-infyn-surface border border-infyn-ink/[0.06] hover:border-infyn-rose/30 hover:bg-purple-50/30 transition-all duration-150 active:scale-[0.985] cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${item.badgeColor}`}>
                    <span>{item.emoji}</span>
                    <span>{item.tag}</span>
                  </span>
                  <span className="text-[10.5px] text-infyn-rose font-semibold opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                    Tap to insert &rarr;
                  </span>
                </div>
                <p className="text-[12.5px] text-infyn-ink leading-snug font-medium line-clamp-2">
                  &ldquo;{item.text}&rdquo;
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
