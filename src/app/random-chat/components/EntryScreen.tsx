'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Ic } from '@/app/components/icons';
import { BottomSheet } from '@/app/components/BottomSheet';
import { hapticLight } from '@/app/lib/haptics';
import { RANDOM_CHAT_VIBES, GENDER_PREFS } from '@/lib/random-chat-config';
import type { RandomChatOverview, RandomChatPrefs } from '../types';

const AGE_FLOOR = 18;
const AGE_CEIL = 50;
const AGE_PRESETS = [
  { label: '18–24', min: 18, max: 24 },
  { label: '21–28', min: 21, max: 28 },
  { label: '25–35', min: 25, max: 35 },
  { label: 'Any age', min: 18, max: 50 },
];

const genderLabel = (g: RandomChatPrefs['genderPref']) => (g === 'men' ? 'Men' : g === 'women' ? 'Women' : 'Everyone');

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
  const [touched, setTouched] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // The overview (with profile defaults) can land after first render.
  useEffect(() => {
    if (!prefill || touched) return;
    setAgeMin(prefill.ageMin ?? 18);
    setAgeMax(prefill.ageMax ?? 30);
    if (prefill.lookingFor) setGenderPref(prefill.lookingFor as RandomChatPrefs['genderPref']);
  }, [prefill, touched]);

  const interests = prefill?.interests ?? [];
  const edit = (fn: () => void) => { setTouched(true); hapticLight(); fn(); };

  const start = () => {
    if (busy) return;
    hapticLight();
    onStart({ vibe, ageMin, ageMax, genderPref, interests });
  };

  const online = overview ? Math.max(0, overview.onlineCount) : null;
  const chatting = overview ? Math.max(0, overview.chattingNow) : null;

  return (
    <div className="w-full max-w-[400px] flex flex-col px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
      <h2 className="rc-title font-display text-[30px] leading-[1.15] tracking-tight text-infyn-ink text-center">
        Talk to someone new
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-infyn-secondary text-center">
        No names, no photos — just a conversation. You both decide whether to reveal profiles.
      </p>

      <p className="mt-3 flex items-center justify-center gap-2 text-[13px] text-infyn-secondary min-h-[20px]" aria-live="polite">
        {online === null ? (
          <span className="text-infyn-muted">Checking who’s around…</span>
        ) : online > 0 ? (
          <>
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span><strong className="font-semibold text-infyn-ink">{online}</strong> online · <strong className="font-semibold text-infyn-ink">{chatting}</strong> chatting now</span>
          </>
        ) : (
          <span>It’s quiet right now — start and you’ll be first in line.</span>
        )}
      </p>

      <button
        type="button"
        onClick={() => { hapticLight(); setSheetOpen(true); }}
        className="rc-summary mt-6 w-full min-h-[60px] px-4 py-3 rounded-2xl bg-infyn-surface border border-infyn-border flex items-center gap-3 text-left active:bg-infyn-surface-soft transition-colors cursor-pointer"
        aria-label={`Chat preferences: ${vibe} mood, ages ${ageMin} to ${ageMax}, ${genderLabel(genderPref)}. Edit`}
      >
        <span className="flex-1 min-w-0">
          <span className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-infyn-muted">Matching</span>
          <span className="block mt-0.5 text-[15px] text-infyn-ink truncate">
            <span className="capitalize">{vibe}</span> · Ages {ageMin}–{ageMax} · {genderLabel(genderPref)}
          </span>
        </span>
        <span className="flex items-center gap-1 text-[14px] font-semibold text-infyn-rose shrink-0">
          Edit <span className="-rotate-90"><Ic.ChevDown /></span>
        </span>
      </button>

      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="mt-3 w-full min-h-[56px] rounded-full bg-infyn-rose text-[#fff8f0] text-[16px] font-semibold flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(158,27,65,0.15),0_10px_22px_-10px_rgba(158,27,65,0.6)] active:scale-[0.985] transition-transform disabled:opacity-60 cursor-pointer"
      >
        {busy ? 'Connecting…' : 'Start chatting'}
      </button>

      <div className="mt-5 flex gap-2.5 text-[13px] leading-relaxed text-infyn-secondary">
        <Ic.Shield className="w-4 h-4 mt-0.5 shrink-0 text-infyn-rose" />
        <p>
          You stay anonymous until you both choose to connect, and you can end, report or block anytime.
          By starting, you agree to our{' '}
          <Link href="/terms" className="text-infyn-ink underline underline-offset-2">community guidelines</Link>.
        </p>
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Chat preferences"
        footer={
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="w-full min-h-[52px] rounded-full bg-infyn-ink text-infyn-paper text-[15px] font-semibold active:scale-[0.985] transition-transform cursor-pointer"
          >
            Done
          </button>
        }
      >
        <section>
          <h3 className="text-[13px] font-semibold text-infyn-secondary mb-3">Your mood</h3>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Your mood">
            {RANDOM_CHAT_VIBES.map((v) => {
              const selected = vibe === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => edit(() => setVibe(v))}
                  className={`min-h-[44px] px-4 rounded-full text-[14px] capitalize transition-colors cursor-pointer ${
                    selected
                      ? 'bg-infyn-rose text-[#fff8f0] font-semibold'
                      : 'bg-infyn-surface border border-infyn-border text-infyn-ink active:bg-infyn-surface-soft'
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-infyn-secondary">Age range</h3>
            <span className="font-display text-[22px] text-infyn-ink tabular-nums" aria-live="polite">{ageMin}–{ageMax}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AgeStepper label="Youngest" value={ageMin}
              onDecrease={() => edit(() => setAgeMin((v) => Math.max(AGE_FLOOR, v - 1)))}
              onIncrease={() => edit(() => setAgeMin((v) => Math.min(ageMax, v + 1)))}
              canDecrease={ageMin > AGE_FLOOR} canIncrease={ageMin < ageMax} />
            <AgeStepper label="Oldest" value={ageMax}
              onDecrease={() => edit(() => setAgeMax((v) => Math.max(ageMin, v - 1)))}
              onIncrease={() => edit(() => setAgeMax((v) => Math.min(AGE_CEIL, v + 1)))}
              canDecrease={ageMax > ageMin} canIncrease={ageMax < AGE_CEIL} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {AGE_PRESETS.map((p) => {
              const selected = ageMin === p.min && ageMax === p.max;
              return (
                <button
                  key={p.label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => edit(() => { setAgeMin(p.min); setAgeMax(p.max); })}
                  className={`min-h-[40px] px-3.5 rounded-full text-[13px] transition-colors cursor-pointer ${
                    selected ? 'bg-infyn-ink text-infyn-paper font-semibold' : 'bg-infyn-surface-soft text-infyn-secondary'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-7">
          <h3 className="text-[13px] font-semibold text-infyn-secondary mb-3">Show me</h3>
          <div className="flex p-1 rounded-2xl bg-infyn-surface-soft" role="radiogroup" aria-label="Show me">
            {GENDER_PREFS.map((g) => {
              const selected = genderPref === g;
              return (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => edit(() => setGenderPref(g))}
                  className={`flex-1 min-h-[44px] rounded-xl text-[14px] transition-colors cursor-pointer ${
                    selected ? 'bg-infyn-surface text-infyn-ink font-semibold shadow-[0_1px_3px_rgba(32,26,22,0.1)]' : 'text-infyn-secondary'
                  }`}
                >
                  {genderLabel(g)}
                </button>
              );
            })}
          </div>
        </section>

        {interests.length > 0 && (
          <p className="mt-7 text-[13px] leading-relaxed text-infyn-secondary">
            We’ll also look for people who share your interests: {interests.join(', ')}.
          </p>
        )}
      </BottomSheet>
    </div>
  );
}

function AgeStepper({ label, value, onDecrease, onIncrease, canDecrease, canIncrease }: {
  label: string; value: number;
  onDecrease: () => void; onIncrease: () => void;
  canDecrease: boolean; canIncrease: boolean;
}) {
  return (
    <div className="rounded-2xl bg-infyn-surface border border-infyn-border px-1.5 pt-2 pb-1.5">
      <p className="px-2 text-[12px] text-infyn-secondary">{label}</p>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onDecrease} disabled={!canDecrease} aria-label={`${label} age, decrease`}
          className="h-11 w-11 grid place-items-center rounded-full text-infyn-ink active:bg-infyn-surface-soft disabled:opacity-30 cursor-pointer">
          <Ic.Minus />
        </button>
        <span className="text-[18px] font-semibold text-infyn-ink tabular-nums">{value}</span>
        <button type="button" onClick={onIncrease} disabled={!canIncrease} aria-label={`${label} age, increase`}
          className="h-11 w-11 grid place-items-center rounded-full text-infyn-ink active:bg-infyn-surface-soft disabled:opacity-30 cursor-pointer">
          <Ic.Plus />
        </button>
      </div>
    </div>
  );
}
