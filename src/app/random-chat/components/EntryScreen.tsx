'use client';

import { useState } from 'react';
import { GlassCard, PrimaryButton } from '@/app/components/shared';
import { hapticLight } from '@/app/lib/haptics';
import { RANDOM_CHAT_VIBES, VIBE_EMOJI, GENDER_PREFS } from '@/lib/random-chat-config';
import type { RandomChatOverview, RandomChatPrefs } from '../types';

const SAFETY_POINTS = [
  'Your identity stays hidden until you both agree to connect.',
  'You can end the chat, report, or block anyone at any time.',
  'Never share personal contact details until you feel safe.',
];

export function EntryScreen({
  overview,
  onStart,
  busy,
}: {
  overview: RandomChatOverview | null;
  onStart: (prefs: RandomChatPrefs) => void;
  busy: boolean;
}) {
  const prefill = overview?.prefill;
  const [vibe, setVibe] = useState('chill');
  const [ageMin, setAgeMin] = useState(prefill?.ageMin ?? 18);
  const [ageMax, setAgeMax] = useState(prefill?.ageMax ?? 30);
  const [genderPref, setGenderPref] = useState<RandomChatPrefs['genderPref']>(
    (prefill?.lookingFor as RandomChatPrefs['genderPref']) ?? 'everyone'
  );
  const [acknowledged, setAcknowledged] = useState(false);

  const interests = prefill?.interests ?? [];

  const start = () => {
    onStart({
      vibe,
      ageMin,
      ageMax,
      genderPref,
      interests,
    });
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] space-y-5">
      {/* Live stats */}
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4 border border-gray-200/70">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#1E293B]/45">Online now</p>
          <p className="mt-1 text-[20px] font-extrabold text-[#1E293B]">
            {overview ? Math.max(0, overview.onlineCount) : '—'}
          </p>
        </GlassCard>
        <GlassCard className="p-4 border border-gray-200/70">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#1E293B]/45">Chatting right now</p>
          <p className="mt-1 text-[20px] font-extrabold text-[#1E293B]">
            {overview ? Math.max(0, overview.chattingNow) : '—'}
          </p>
        </GlassCard>
      </div>

      {/* Vibe */}
      <div>
        <h2 className="mb-2 text-[12.5px] font-bold uppercase tracking-wider text-[#1E293B]/45">Your mood tonight</h2>
        <div className="flex flex-wrap gap-2">
          {RANDOM_CHAT_VIBES.map((v) => (
            <button
              key={v}
              onClick={() => { hapticLight(); setVibe(v); }}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all duration-200 cursor-pointer ${
                vibe === v
                  ? 'bg-[#F43F5E] text-white shadow-2xs scale-105'
                  : 'bg-white border border-gray-200/80 text-[#1E293B]/60 hover:bg-gray-50'
              }`}
            >
              {VIBE_EMOJI[v] ?? ''} {v}
            </button>
          ))}
        </div>
      </div>

      {/* Age range */}
      <div>
        <h2 className="mb-2 text-[12.5px] font-bold uppercase tracking-wider text-[#1E293B]/45">
          Age range · {ageMin}–{ageMax}
        </h2>
        <div className="flex items-center gap-3">
          {(['Min', 'Max'] as const).map((label) => {
            const value = label === 'Min' ? ageMin : ageMax;
            const setter = label === 'Min' ? setAgeMin : setAgeMax;
            return (
              <GlassCard key={label} className="flex-1 p-3 border border-gray-200/70">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E293B]/40">{label}</p>
                <div className="mt-1 flex items-center justify-between">
                  <button
                    onClick={() => {
                      const next = Math.max(18, value - 1);
                      if (label === 'Min' && next <= ageMax) setter(next);
                      else if (label === 'Max' && next >= ageMin) setter(next);
                    }}
                    className="h-7 w-7 rounded-full bg-gray-100 text-[#1E293B] text-[15px] font-bold hover:bg-gray-200 active:scale-90 transition-all cursor-pointer"
                    aria-label={`Lower ${label.toLowerCase()} age`}
                  >
                    −
                  </button>
                  <span className="text-[16px] font-extrabold text-[#1E293B]">{value}</span>
                  <button
                    onClick={() => {
                      const next = Math.min(70, value + 1);
                      if (label === 'Min' && next <= ageMax) setter(next);
                      else if (label === 'Max' && next >= ageMin) setter(next);
                    }}
                    className="h-7 w-7 rounded-full bg-gray-100 text-[#1E293B] text-[15px] font-bold hover:bg-gray-200 active:scale-90 transition-all cursor-pointer"
                    aria-label={`Raise ${label.toLowerCase()} age`}
                  >
                    +
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Gender preference */}
      <div>
        <h2 className="mb-2 text-[12.5px] font-bold uppercase tracking-wider text-[#1E293B]/45">Show me</h2>
        <div className="flex gap-2">
          {GENDER_PREFS.map((g) => (
            <button
              key={g}
              onClick={() => { hapticLight(); setGenderPref(g); }}
              className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                genderPref === g
                  ? 'bg-[#F43F5E] text-white shadow-2xs'
                  : 'bg-white border border-gray-200/80 text-[#1E293B]/60 hover:bg-gray-50'
              }`}
            >
              {g === 'men' ? 'Men' : g === 'women' ? 'Women' : 'Everyone'}
            </button>
          ))}
        </div>
      </div>

      {/* Interests preview */}
      {interests.length > 0 && (
        <div>
          <h2 className="mb-2 text-[12.5px] font-bold uppercase tracking-wider text-[#1E293B]/45">Shared on your profile</h2>
          <div className="flex flex-wrap gap-2">
            {interests.map((tag) => (
              <span key={tag} className="px-3 py-1.5 rounded-full bg-[#FFF0F4] border border-[#F9C0D0]/60 text-[12px] font-bold text-[#F43F5E]">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Safety */}
      <div>
        <h2 className="mb-2 text-[12.5px] font-bold uppercase tracking-wider text-[#1E293B]/45">Stay safe, chat free</h2>
        <GlassCard className="p-4 border border-gray-200/70">
          <ul className="space-y-2">
            {SAFETY_POINTS.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-[#1E293B]/70 font-medium">
                <span className="mt-0.5 text-[#22C55E] font-bold">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setAcknowledged((prev) => !prev)}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-[12.5px] font-semibold text-[#1E293B]/70 active:scale-[0.98] transition-all cursor-pointer"
            role="checkbox"
            aria-checked={acknowledged}
          >
            <span className={`h-4.5 w-4.5 flex items-center justify-center rounded-md border text-white text-[11px] font-bold transition-all ${
              acknowledged ? 'bg-[#F43F5E] border-[#F43F5E]' : 'border-gray-300 bg-white'
            }`}>
              {acknowledged ? '✓' : ''}
            </span>
            I understand &amp; agree to keep it respectful
          </button>
        </GlassCard>
      </div>

      <PrimaryButton onClick={start} className="mt-1">
        {busy ? 'Finding your match…' : 'Start anonymous chat 🎲'}
      </PrimaryButton>
    </div>
  );
}
