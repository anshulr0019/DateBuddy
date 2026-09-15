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
        badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        text: playful,
      },
      {
        tag: interest ? `Hook (${interest})` : 'Curious',
        badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        text: promptHook,
      },
      {
        tag: 'Activity Vibe',
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
    <div className="w-full select-none">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsOpen(prev => !prev);
          }}
          aria-expanded={isOpen}
          className={`inline-flex min-h-8 items-center gap-2 rounded-xl border px-2.5 py-1 text-[11.5px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.97] ${
            isOpen
              ? 'border-infyn-rose-line bg-infyn-blush text-infyn-rose shadow-2xs'
              : 'border-transparent bg-transparent text-infyn-secondary hover:border-infyn-border hover:bg-infyn-surface'
          }`}
        >
          <span className="grid h-5 w-5 place-items-center rounded-lg bg-infyn-blush text-infyn-rose">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3l1.35 4.15L17.5 8.5l-4.15 1.35L12 14l-1.35-4.15L6.5 8.5l4.15-1.35L12 3z" />
              <path d="M18.5 14l.75 2.25L21.5 17l-2.25.75L18.5 20l-.75-2.25L15.5 17l2.25-.75L18.5 14z" />
            </svg>
          </span>
          <span>AI Wingman</span>
          <svg className={`h-3 w-3 text-infyn-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Generate new Wingman suggestions"
            className="flex min-h-8 items-center gap-1.5 rounded-xl px-2 text-[10.5px] font-semibold text-infyn-secondary transition-all hover:bg-infyn-surface hover:text-infyn-rose active:scale-95 cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.5 9a9 9 0 0 1 14.8-3.4L23 10M1 14l4.7 4.4A9 9 0 0 0 20.5 15" />
            </svg>
            <span>New Suggestions</span>
          </button>
        )}
      </div>

      {/* Expanded Suggestions Panel */}
      {isOpen && (
        <div className="mt-1.5 space-y-2 rounded-2xl border border-infyn-border/80 bg-infyn-surface/95 p-2.5 shadow-[0_8px_24px_-12px_rgba(32,26,22,0.14)] backdrop-blur-xl animate-popover-enter">
          <div className="px-1 pt-0.5 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-infyn-muted">
              Suggested for {cleanName}
            </p>
          </div>

          <div className="space-y-1.5">
            {openers.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(item.text)}
                className="group w-full rounded-xl border border-infyn-border/70 bg-infyn-paper/45 p-2.5 text-left transition-all duration-150 hover:border-infyn-rose/30 hover:bg-infyn-blush/25 active:scale-[0.985] cursor-pointer"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[9.5px] font-bold ${item.badgeColor}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                    <span>{item.tag}</span>
                  </span>
                  <span className="ml-auto flex items-center gap-0.5 text-[10px] font-semibold text-infyn-rose opacity-70 transition-opacity group-hover:opacity-100">
                    Use <span aria-hidden>→</span>
                  </span>
                </div>
                <p className="line-clamp-2 text-[12.5px] font-medium leading-snug text-infyn-ink/85">
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
