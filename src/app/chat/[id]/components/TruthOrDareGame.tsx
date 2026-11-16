'use client';

import React, { useState } from 'react';

const TRUTH_PROMPTS = [
  'What was your honest first impression of my profile? 😏',
  'What is the most embarrassing thing that happened to you on a date?',
  'Have you ever practiced kissing on a pillow or hand? 😂',
  'What is one secret obsession or guilty pleasure you rarely tell anyone?',
  'If you had to rate our initial chat vibe from 1 to 10, what score are you giving?',
  'What is the wildest text you sent that you immediately regretted?',
  'What is your biggest red flag that you secretly know you have? 🚩',
];

const DARE_PROMPTS = [
  'Send a 5-second voice note singing the chorus of your favorite song right now 🎤',
  'Drop your most recent camera roll screenshot without context 👀',
  'Type out your favorite pickup line and send it to me with full confidence 😎',
  'Send the funniest selfie face you can make within 10 seconds 🤪',
  'Text your best friend right now saying "I found the one" and tell me their reaction 😂',
  'Send a voice note doing your best movie villain laugh 😈',
];

interface TruthOrDareGameProps {
  onSendGameMessage: (text: string) => void;
  onClose: () => void;
}

export function TruthOrDareGame({ onSendGameMessage, onClose }: TruthOrDareGameProps) {
  const [selectedType, setSelectedType] = useState<'truth' | 'dare' | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');

  const pickTruth = () => {
    const random = TRUTH_PROMPTS[Math.floor(Math.random() * TRUTH_PROMPTS.length)];
    setSelectedType('truth');
    setCurrentPrompt(random);
  };

  const pickDare = () => {
    const random = DARE_PROMPTS[Math.floor(Math.random() * DARE_PROMPTS.length)];
    setSelectedType('dare');
    setCurrentPrompt(random);
  };

  const handleSendPrompt = () => {
    if (!currentPrompt) return;
    const prefix = selectedType === 'truth' ? '🧠 Truth Challenge:' : '🔥 Dare Challenge:';
    onSendGameMessage(`${prefix} "${currentPrompt}"`);
    onClose();
  };

  return (
    <div className="w-full space-y-4 text-infyn-ink select-none animate-page-entry">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-infyn-border">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to menu"
            className="h-8 w-8 rounded-full bg-infyn-surface-soft hover:bg-infyn-blush flex items-center justify-center text-infyn-secondary hover:text-infyn-ink transition-colors cursor-pointer text-sm"
          >
            &larr;
          </button>
          <div>
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-infyn-muted">
              02 • Game
            </span>
            <h3 className="text-[16px] font-semibold text-infyn-ink leading-tight">Truth or Dare</h3>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-infyn-surface-soft border border-infyn-border text-[10px] text-infyn-secondary">
          Prompts
        </span>
      </div>

      {/* Choose Truth vs Dare — Minimalist Cards */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={pickTruth}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedType === 'truth'
              ? 'bg-infyn-blush border-infyn-rose-line shadow-sm scale-[1.01]'
              : 'bg-infyn-surface border-infyn-border hover:bg-infyn-surface-soft hover:border-infyn-rose-line'
          }`}
        >
          <span className="text-[10px] font-bold tracking-wider text-infyn-muted uppercase">01</span>
          <p className="text-[16px] font-bold text-infyn-ink mt-1">Truth</p>
          <p className="text-[11.5px] text-infyn-secondary mt-0.5">Spill the honest tea</p>
        </button>

        <button
          type="button"
          onClick={pickDare}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedType === 'dare'
              ? 'bg-infyn-blush border-infyn-rose-line shadow-sm scale-[1.01]'
              : 'bg-infyn-surface border-infyn-border hover:bg-infyn-surface-soft hover:border-infyn-rose-line'
          }`}
        >
          <span className="text-[10px] font-bold tracking-wider text-infyn-muted uppercase">02</span>
          <p className="text-[16px] font-bold text-infyn-ink mt-1">Dare</p>
          <p className="text-[11.5px] text-infyn-secondary mt-0.5">Voice & camera task</p>
        </button>
      </div>

      {/* Generated Card */}
      {currentPrompt && (
        <div className="p-4 rounded-2xl bg-infyn-surface border border-infyn-border space-y-3.5 animate-page-entry">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-infyn-muted">
              {selectedType === 'truth' ? 'Selected Truth Prompt' : 'Selected Dare Task'}
            </span>
            <p className="text-[14.5px] font-semibold text-infyn-ink mt-1 leading-snug">
              &ldquo;{currentPrompt}&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={selectedType === 'truth' ? pickTruth : pickDare}
              className="px-3.5 py-2.5 rounded-xl bg-infyn-surface-soft hover:bg-infyn-blush text-[12px] font-medium text-infyn-secondary border border-infyn-border cursor-pointer transition-colors"
            >
              Re-roll
            </button>
            <button
              type="button"
              onClick={handleSendPrompt}
              className="flex-1 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              Send to chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
