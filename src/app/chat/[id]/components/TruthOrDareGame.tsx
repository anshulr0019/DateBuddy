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
    <div className="w-full rounded-[24px] bg-[#16141F] border border-rose-500/25 p-4 text-white shadow-2xl space-y-4 animate-scale-pop select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 text-lg">
            🎭
          </span>
          <div>
            <h3 className="text-[15px] font-bold text-white leading-tight">Truth or Dare</h3>
            <p className="text-[11px] text-white/50">Pick a card and challenge your match</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Choose Truth vs Dare */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={pickTruth}
          className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
            selectedType === 'truth'
              ? 'bg-gradient-to-br from-purple-600 to-indigo-700 border-purple-400 shadow-md scale-102'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          <p className="text-2xl mb-1">🧠</p>
          <p className="text-[14px] font-extrabold text-white">Truth</p>
          <p className="text-[10.5px] text-white/60">Spill the tea</p>
        </button>

        <button
          type="button"
          onClick={pickDare}
          className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
            selectedType === 'dare'
              ? 'bg-gradient-to-br from-rose-600 to-pink-700 border-rose-400 shadow-md scale-102'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          <p className="text-2xl mb-1">🔥</p>
          <p className="text-[14px] font-extrabold text-white">Dare</p>
          <p className="text-[10.5px] text-white/60">No backing out</p>
        </button>
      </div>

      {/* Generated Card */}
      {currentPrompt && (
        <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-3 animate-page-entry">
          <div>
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#FF6B9D]">
              {selectedType === 'truth' ? 'Selected Truth Question' : 'Selected Dare Task'}:
            </span>
            <p className="text-[14px] font-semibold text-white mt-1 leading-snug">
              &ldquo;{currentPrompt}&rdquo;
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectedType === 'truth' ? pickTruth : pickDare}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[12px] font-semibold text-white/70 cursor-pointer"
            >
              🔄 Re-roll
            </button>
            <button
              type="button"
              onClick={handleSendPrompt}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[13px] font-bold shadow-md cursor-pointer active:scale-95"
            >
              Send Challenge to Chat →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
