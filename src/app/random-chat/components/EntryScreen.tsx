'use client';

import { useState } from 'react';
import { PrimaryButton } from '@/app/components/shared';
import { hapticLight } from '@/app/lib/haptics';
import { RANDOM_CHAT_VIBES, GENDER_PREFS } from '@/lib/random-chat-config';
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
  const [acknowledged, setAcknowledged] = useState(true);

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

  const handlePreset = (min: number, max: number) => {
    hapticLight();
    setAgeMin(min);
    setAgeMax(max);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-4 pt-3 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] space-y-4">
      {/* 1. Live Stats — Unified Minimal Bar (Swiggy / Apple style) */}
      <div className="flex items-center justify-between p-3 bg-infyn-surface/90 backdrop-blur-xl rounded-2xl border border-infyn-border shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {/* Online Now */}
        <div className="flex items-center gap-2.5 flex-1 pl-1">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div className="leading-tight">
            <p className="text-[14px] font-extrabold text-infyn-ink tracking-tight">
              {overview ? Math.max(0, overview.onlineCount) : '—'}{' '}
              <span className="text-[12px] font-semibold text-infyn-ink/70">online</span>
            </p>
            <p className="text-[10.5px] font-medium text-infyn-ink/40">Active seekers nearby</p>
          </div>
        </div>

        {/* Hairline Divider */}
        <div className="h-7 w-[1px] bg-infyn-surface-soft/60 mx-2" />

        {/* Chatting Now */}
        <div className="flex items-center gap-2.5 flex-1 pr-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--infyn-rose)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <div className="leading-tight">
            <p className="text-[14px] font-extrabold text-infyn-ink tracking-tight">
              {overview ? Math.max(0, overview.chattingNow) : '—'}{' '}
              <span className="text-[12px] font-semibold text-infyn-ink/70">chatting</span>
            </p>
            <p className="text-[10.5px] font-medium text-infyn-ink/40">In live conversations</p>
          </div>
        </div>
      </div>

      {/* 2. Mood / Vibe Selection — Clean typographic chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-infyn-ink/50">
            Your mood tonight
          </h2>
          <span className="text-[11px] font-semibold text-infyn-rose bg-infyn-blush px-2.5 py-0.5 rounded-full capitalize">
            {vibe}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {RANDOM_CHAT_VIBES.map((v) => {
            const isSelected = vibe === v;
            return (
              <button
                key={v}
                onClick={() => {
                  hapticLight();
                  setVibe(v);
                }}
                className={`font-system inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all duration-200 cursor-pointer active:scale-95 capitalize ${
                  isSelected
                    ? 'bg-gradient-to-r from-infyn-rose to-infyn-rose text-white shadow-[0_4px_12px_rgba(32,26,22,0.16)] ring-2 ring-infyn-rose/20 font-bold scale-[1.02]'
                    : 'bg-infyn-surface/80 border border-infyn-border/70 text-infyn-ink/70 hover:bg-infyn-surface hover:border-infyn-border'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-infyn-surface' : 'bg-infyn-rose/60'}`} />
                <span>{v}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Age Range — Unified Minimal Card */}
      <div className="bg-infyn-surface/90 backdrop-blur-xl rounded-2xl p-3.5 border border-infyn-border shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="leading-tight">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-infyn-ink/50">
              Age range
            </h2>
            <p className="text-[11px] text-infyn-ink/40 font-medium">Filter who you connect with</p>
          </div>
          <span className="text-[13px] font-extrabold text-infyn-rose bg-infyn-blush px-3 py-1 rounded-full border border-infyn-blush/70 tabular-nums">
            {ageMin} – {ageMax} yrs
          </span>
        </div>

        {/* Visual Range Bar */}
        <div className="relative py-1">
          <div className="h-2 w-full bg-infyn-surface-soft rounded-full overflow-hidden relative">
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-infyn-rose to-infyn-rose rounded-full transition-all duration-150"
              style={{
                left: `${Math.max(0, ((ageMin - 18) / (50 - 18)) * 100)}%`,
                right: `${Math.max(0, 100 - ((ageMax - 18) / (50 - 18)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Dual Stepper Control */}
        <div className="font-system grid grid-cols-2 gap-2.5 pt-0.5">
          <div className="flex items-center justify-between bg-infyn-surface-soft/80 rounded-xl px-2.5 py-1.5 border border-infyn-border">
            <span className="text-[11px] font-bold uppercase text-infyn-ink/40">Min</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  hapticLight();
                  setAgeMin((prev) => Math.max(18, prev - 1));
                }}
                disabled={ageMin <= 18}
                className="font-system h-6 w-6 rounded-lg bg-infyn-surface border border-infyn-border/80 text-infyn-ink text-[13px] font-bold hover:bg-infyn-surface-soft active:scale-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
                aria-label="Decrease minimum age"
              >
                −
              </button>
              <span className="text-[14px] font-extrabold text-infyn-ink w-6 text-center tabular-nums">
                {ageMin}
              </span>
              <button
                onClick={() => {
                  hapticLight();
                  setAgeMin((prev) => Math.min(ageMax, prev + 1));
                }}
                disabled={ageMin >= ageMax}
                className="font-system h-6 w-6 rounded-lg bg-infyn-surface border border-infyn-border/80 text-infyn-ink text-[13px] font-bold hover:bg-infyn-surface-soft active:scale-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
                aria-label="Increase minimum age"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-infyn-surface-soft/80 rounded-xl px-2.5 py-1.5 border border-infyn-border">
            <span className="text-[11px] font-bold uppercase text-infyn-ink/40">Max</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  hapticLight();
                  setAgeMax((prev) => Math.max(ageMin, prev - 1));
                }}
                disabled={ageMax <= ageMin}
                className="font-system h-6 w-6 rounded-lg bg-infyn-surface border border-infyn-border/80 text-infyn-ink text-[13px] font-bold hover:bg-infyn-surface-soft active:scale-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
                aria-label="Decrease maximum age"
              >
                −
              </button>
              <span className="text-[14px] font-extrabold text-infyn-ink w-6 text-center tabular-nums">
                {ageMax}
              </span>
              <button
                onClick={() => {
                  hapticLight();
                  setAgeMax((prev) => Math.min(50, prev + 1));
                }}
                disabled={ageMax >= 50}
                className="font-system h-6 w-6 rounded-lg bg-infyn-surface border border-infyn-border/80 text-infyn-ink text-[13px] font-bold hover:bg-infyn-surface-soft active:scale-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
                aria-label="Increase maximum age"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Quick Age Presets */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-[10.5px] font-medium text-infyn-ink/40 mr-1">Quick:</span>
          {[
            { label: '18–24', min: 18, max: 24 },
            { label: '21–28', min: 21, max: 28 },
            { label: '25–35', min: 25, max: 35 },
            { label: 'All (18–50)', min: 18, max: 50 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset.min, preset.max)}
              className={`font-system text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                ageMin === preset.min && ageMax === preset.max
                  ? 'bg-infyn-ink text-white'
                  : 'bg-infyn-surface-soft/90 text-infyn-ink/60 hover:bg-infyn-surface-soft/80'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Gender Preference — Minimal Segmented Control */}
      <div className="space-y-1.5">
        <h2 className="text-[12px] font-bold uppercase tracking-wider text-infyn-ink/50 px-0.5">
          Show me
        </h2>
        <div className="flex p-1 bg-infyn-surface-soft/90 rounded-2xl border border-infyn-border/50">
          {GENDER_PREFS.map((g) => {
            const isSelected = genderPref === g;
            const label = g === 'men' ? 'Men' : g === 'women' ? 'Women' : 'Everyone';
            return (
              <button
                key={g}
                onClick={() => {
                  hapticLight();
                  setGenderPref(g);
                }}
                className={`font-system flex-1 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? 'bg-infyn-surface text-infyn-ink shadow-[0_2px_8px_rgba(0,0,0,0.06)] scale-[1.01]'
                    : 'text-infyn-ink/60 hover:text-infyn-ink'
                }`}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Shared On Profile (Interests) */}
      {interests.length > 0 && (
        <div className="space-y-1.5">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-infyn-ink/50 px-0.5">
            Shared on your profile
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {interests.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-infyn-surface/80 border border-infyn-border/60 text-[12px] font-semibold text-infyn-ink/75 shadow-2xs"
              >
                <span className="text-infyn-rose text-[11px]">#</span>
                <span>{tag}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 6. Safety Card — Minimal & Discreet with SVG icon */}
      <div className="bg-infyn-surface/80 backdrop-blur-md rounded-2xl p-3.5 border border-infyn-border shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <h2 className="text-[12px] font-bold text-infyn-ink/70 tracking-tight">
            Safe &amp; Anonymous Matching
          </h2>
        </div>

        <ul className="space-y-1.5 pl-1">
          {SAFETY_POINTS.map((point, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[12px] text-infyn-ink/65 font-medium leading-tight"
            >
              <span className="text-emerald-500 font-bold text-[11px] mt-0.5">✓</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            hapticLight();
            setAcknowledged((prev) => !prev);
          }}
          className="font-system w-full flex items-center justify-center gap-2 pt-1 text-[11.5px] font-semibold text-infyn-ink/60 hover:text-infyn-ink cursor-pointer"
          role="checkbox"
          aria-checked={acknowledged}
        >
          <span
            className={`h-4 w-4 flex items-center justify-center rounded-md border text-white text-[10px] font-bold transition-all ${
              acknowledged ? 'bg-emerald-500 border-emerald-500' : 'border-infyn-border bg-infyn-surface'
            }`}
          >
            {acknowledged ? '✓' : ''}
          </span>
          <span>I agree to respectful dating community guidelines</span>
        </button>
      </div>

      {/* 7. Start Anonymous Chat CTA */}
      <PrimaryButton onClick={start} className="mt-1 shadow-[0_8px_24px_-6px_rgba(32,26,22,0.16)] flex items-center justify-center gap-2">
        <span>{busy ? 'Connecting to vibe radar…' : 'Start Anonymous Chat'}</span>
        {!busy && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        )}
      </PrimaryButton>
    </div>
  );
}
