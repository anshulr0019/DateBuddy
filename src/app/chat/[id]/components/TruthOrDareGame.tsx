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
    <div className="w-full space-y-4 text-white select-none animate-page-entry">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to menu"
            className="h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer text-sm"
          >
            &larr;
          </button>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-[0.16em] uppercase text-white/40">
              02 • Game
            </span>
            <h3 className="text-[16px] font-extrabold text-white leading-tight">Truth or Dare</h3>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[10px] font-mono text-white/60">
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
              ? 'bg-white/[0.1] border-white/40 shadow-sm scale-[1.01]'
              : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20'
          }`}
        >
          <span className="text-[10px] font-mono font-bold tracking-wider text-white/40 uppercase">01</span>
          <p className="text-[16px] font-bold text-white mt-1">Truth</p>
          <p className="text-[11.5px] text-white/50 mt-0.5">Spill the honest tea</p>
        </button>

        <button
          type="button"
          onClick={pickDare}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedType === 'dare'
              ? 'bg-white/[0.1] border-white/40 shadow-sm scale-[1.01]'
              : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20'
          }`}
        >
          <span className="text-[10px] font-mono font-bold tracking-wider text-white/40 uppercase">02</span>
          <p className="text-[16px] font-bold text-white mt-1">Dare</p>
          <p className="text-[11.5px] text-white/50 mt-0.5">Voice & camera task</p>
        </button>
      </div>

      {/* Generated Card */}
      {currentPrompt && (
        <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3.5 animate-page-entry">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40">
              {selectedType === 'truth' ? 'Selected Truth Prompt' : 'Selected Dare Task'}
            </span>
            <p className="text-[14.5px] font-semibold text-white mt-1 leading-snug">
              &ldquo;{currentPrompt}&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={selectedType === 'truth' ? pickTruth : pickDare}
              className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[12px] font-medium text-white/70 border border-white/5 cursor-pointer transition-colors"
            >
              Re-roll
            </button>
            <button
              type="button"
              onClick={handleSendPrompt}
              className="flex-1 py-2.5 rounded-xl bg-white text-black text-[13px] font-bold shadow-sm cursor-pointer active:scale-95 transition-all"
            >
              Send to Chat &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
