'use client';

import React, { useState, useCallback } from 'react';

const ACTIVITIES = [
  { emoji: '☕', label: 'Coffee' },
  { emoji: '🍕', label: 'Dinner' },
  { emoji: '🎬', label: 'Movie' },
  { emoji: '🚶', label: 'Walk' },
  { emoji: '🎳', label: 'Bowling' },
  { emoji: '🎨', label: 'Art' },
  { emoji: '🎵', label: 'Concert' },
  { emoji: '🍦', label: 'Dessert' },
  { emoji: '🧗', label: 'Adventure' },
  { emoji: '💃', label: 'Dancing' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '📚', label: 'Book Café' },
];

const QUICK_DATES = [
  { label: 'Today', getValue: () => { const d = new Date(); return d; } },
  { label: 'Tomorrow', getValue: () => { const d = new Date(); d.setDate(d.getDate() + 1); return d; } },
  { label: 'This Weekend', getValue: () => {
    const d = new Date();
    const day = d.getDay();
    const daysUntilSat = day === 0 ? 6 : 6 - day;
    d.setDate(d.getDate() + daysUntilSat);
    return d;
  }},
  { label: 'Next Week', getValue: () => { const d = new Date(); d.setDate(d.getDate() + 7); return d; } },
];

const TIME_SLOTS = [
  { emoji: '🌅', label: 'Morning', desc: '8–11 AM' },
  { emoji: '☀️', label: 'Afternoon', desc: '12–3 PM' },
  { emoji: '🌆', label: 'Evening', desc: '5–8 PM' },
  { emoji: '🌙', label: 'Late Night', desc: '9 PM+' },
];

interface DatePlannerDrawerProps {
  isOpen: boolean;
  partnerName: string;
  onSendPlan: (text: string) => void;
  onClose: () => void;
}

export function DatePlannerDrawer({
  isOpen,
  partnerName,
  onSendPlan,
  onClose,
}: DatePlannerDrawerProps) {
  const cleanName = partnerName?.split(' ')[0] || 'your date';

  const [step, setStep] = useState(0); // 0: Activity, 1: When, 2: Time, 3: Note
  const [activity, setActivity] = useState<{ emoji: string; label: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedQuickDate, setSelectedQuickDate] = useState<string | null>(null);
  const [timeSlot, setTimeSlot] = useState<{ emoji: string; label: string; desc: string } | null>(null);
  const [note, setNote] = useState('');
  const [stepKey, setStepKey] = useState(0); // force re-animate on step change

  const canProceed = () => {
    if (step === 0) return !!activity;
    if (step === 1) return !!selectedDate;
    if (step === 2) return !!timeSlot;
    return true; // step 3 (note) is optional
  };

  const goNext = useCallback(() => {
    if (step < 3) {
      setStep((s) => s + 1);
      setStepKey((k) => k + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
      setStepKey((k) => k + 1);
    }
  }, [step]);

  const formatDate = (d: Date): string => {
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const handleSubmit = useCallback(() => {
    if (!activity || !selectedDate || !timeSlot) return;

    const lines = [
      `📅 Date Plan`,
      `━━━━━━━━━━━━━`,
      `${activity.emoji} Activity: ${activity.label}`,
      `📆 When: ${formatDate(selectedDate)}`,
      `${timeSlot.emoji} Time: ${timeSlot.label} (${timeSlot.desc})`,
    ];
    if (note.trim()) {
      lines.push(`💬 "${note.trim()}"`);
    }
    lines.push(`━━━━━━━━━━━━━`);
    lines.push(`Let's make it happen! 💕`);

    onSendPlan(lines.join('\n'));
    onClose();

    // Reset state
    setStep(0);
    setActivity(null);
    setSelectedDate(null);
    setSelectedQuickDate(null);
    setTimeSlot(null);
    setNote('');
  }, [activity, selectedDate, timeSlot, note, onSendPlan, onClose]);

  if (!isOpen) return null;

  const STEPS = ['Activity', 'When', 'Time', 'Note'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none"
    >
      {/* Backdrop click to dismiss */}
      <div onClick={onClose} className="absolute inset-0" />

      {/* Main Sheet */}
      <div className="relative z-10 w-full max-w-[420px] rounded-t-[32px] sm:rounded-[28px] p-6 bg-infyn-dark border border-white/[0.08] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] text-white flex flex-col animate-sheet-up">
        {/* Drag Handle */}
        <div className="h-1 w-9 rounded-full bg-infyn-surface/20 mb-4 self-center" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <div className="flex items-center gap-2.5">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="h-8 w-8 rounded-full bg-infyn-surface/[0.06] hover:bg-infyn-surface/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer text-sm"
              >
                &larr;
              </button>
            ) : (
              <span className="text-[20px]">📅</span>
            )}
            <div>
              <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-white/40">
                Plan a Date
              </span>
              <h3 className="text-[16px] font-extrabold text-white leading-tight">
                {STEPS[step]}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-infyn-surface/[0.06] hover:bg-infyn-surface/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-1.5 mb-5 self-center">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step
                  ? 'w-6 bg-gradient-to-r from-infyn-rose to-infyn-rose'
                  : i < step
                  ? 'w-1.5 bg-infyn-rose/60'
                  : 'w-1.5 bg-infyn-surface/15'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div key={stepKey} className="animate-step-slide-in min-h-[200px]">
          {/* Step 0: Activity */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-[12px] text-white/50 font-medium">
                What do you want to do with {cleanName}?
              </p>
              <div className="grid grid-cols-4 gap-2">
                {ACTIVITIES.map((act) => (
                  <button
                    key={act.label}
                    type="button"
                    onClick={() => setActivity(act)}
                    className={`py-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                      activity?.label === act.label
                        ? 'bg-infyn-surface/[0.12] border-white/40 scale-[1.03] shadow-sm'
                        : 'bg-infyn-surface/[0.03] border-white/[0.06] hover:bg-infyn-surface/[0.06] hover:border-white/15'
                    }`}
                  >
                    <span className="text-[22px] block">{act.emoji}</span>
                    <span className="text-[9.5px] font-bold text-white/60 mt-0.5 block">{act.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: When */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-[12px] text-white/50 font-medium">
                When should the {activity?.label?.toLowerCase()} date happen?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_DATES.map((qd) => {
                  const dateValue = qd.getValue();
                  return (
                    <button
                      key={qd.label}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateValue);
                        setSelectedQuickDate(qd.label);
                      }}
                      className={`py-3.5 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                        selectedQuickDate === qd.label
                          ? 'bg-infyn-surface/[0.12] border-white/40 scale-[1.02]'
                          : 'bg-infyn-surface/[0.03] border-white/[0.06] hover:bg-infyn-surface/[0.06]'
                      }`}
                    >
                      <span className="text-[14px] font-bold text-white block">{qd.label}</span>
                      <span className="text-[10px] text-white/40 mt-0.5 block">
                        {formatDate(dateValue)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom date input */}
              <div className="mt-2">
                <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/30 mb-1.5">
                  Or pick a specific date:
                </p>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(new Date(e.target.value + 'T12:00:00'));
                      setSelectedQuickDate(null);
                    }
                  }}
                  className="w-full rounded-xl bg-black/50 border border-white/15 focus:border-white/40 px-3.5 py-2.5 text-[13px] text-white outline-none transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
          )}

          {/* Step 2: Time */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-[12px] text-white/50 font-medium">
                What time works best?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={`py-4 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                      timeSlot?.label === slot.label
                        ? 'bg-infyn-surface/[0.12] border-white/40 scale-[1.02]'
                        : 'bg-infyn-surface/[0.03] border-white/[0.06] hover:bg-infyn-surface/[0.06]'
                    }`}
                  >
                    <span className="text-[24px] block">{slot.emoji}</span>
                    <span className="text-[13px] font-bold text-white mt-1 block">{slot.label}</span>
                    <span className="text-[10px] text-white/40 block">{slot.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Note */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-[12px] text-white/50 font-medium">
                Add a personal note (optional)
              </p>

              {/* Preview Card */}
              <div className="rounded-2xl bg-gradient-to-br from-infyn-rose/15 to-infyn-rose/15 border border-white/[0.08] p-4 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2">Preview</p>
                <div className="space-y-1">
                  <p className="text-[13px] text-white font-medium">
                    {activity?.emoji} {activity?.label}
                  </p>
                  <p className="text-[13px] text-white font-medium">
                    📆 {selectedDate ? formatDate(selectedDate) : ''}
                  </p>
                  <p className="text-[13px] text-white font-medium">
                    {timeSlot?.emoji} {timeSlot?.label} ({timeSlot?.desc})
                  </p>
                </div>
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={`e.g. Can't wait to see you! 🎉`}
                maxLength={200}
                rows={2}
                className="w-full rounded-xl bg-black/50 border border-white/15 focus:border-white/40 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/25 outline-none transition-colors resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/[0.08]">
          {step < 3 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-infyn-rose to-infyn-rose text-white text-[13.5px] font-bold cursor-pointer active:scale-[0.98] disabled:opacity-30 disabled:scale-100 transition-all shadow-lg shadow-infyn-ink/15 flex items-center justify-center gap-2"
            >
              Continue
              <span className="text-[12px]">&rarr;</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!activity || !selectedDate || !timeSlot}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-infyn-rose to-infyn-rose text-white text-[13.5px] font-bold cursor-pointer active:scale-[0.98] disabled:opacity-30 disabled:scale-100 transition-all shadow-lg shadow-infyn-ink/15 flex items-center justify-center gap-2"
            >
              Send Date Plan to {cleanName} 💕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
