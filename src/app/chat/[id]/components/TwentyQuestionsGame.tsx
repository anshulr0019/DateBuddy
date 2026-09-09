'use client';

import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'person', emoji: '👤', label: 'Person' },
  { id: 'place', emoji: '📍', label: 'Place' },
  { id: 'thing', emoji: '📦', label: 'Thing' },
  { id: 'abstract', emoji: '💭', label: 'Abstract' },
];

interface TwentyQuestionsGameProps {
  partnerName: string;
  onSendGameMessage: (text: string) => void;
  onSendAndClose: (text: string) => void;
  onClose: () => void;
}

export function TwentyQuestionsGame({
  partnerName,
  onSendGameMessage,
  onSendAndClose,
  onClose,
}: TwentyQuestionsGameProps) {
  const cleanPartnerName = partnerName?.split(' ')[0] || 'Partner';

  // Phase: 'setup' → 'playing' → 'ended'
  const [phase, setPhase] = useState<'setup' | 'playing' | 'ended'>('setup');
  const [secretWord, setSecretWord] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');

  const questionsLeft = 20 - questionsUsed;
  const progressPercent = (questionsUsed / 20) * 100;

  // Ring SVG dimensions
  const ringRadius = 22;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progressPercent / 100) * ringCircumference;

  const handleLockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretWord.trim() || !category) return;
    setPhase('playing');
    const cat = CATEGORIES.find((c) => c.id === category);
    onSendGameMessage(
      `🎯 I'm thinking of something! 20 Questions starts now.\n${cat?.emoji} Category: ${cat?.label}\nAsk me Yes/No questions to figure it out!`
    );
  };

  const handleQuickReply = (reply: string, emoji: string) => {
    setQuestionsUsed((prev) => Math.min(prev + 1, 20));
    onSendAndClose(`${emoji} ${reply} (${questionsLeft - 1} questions left)`);
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    setQuestionsUsed((prev) => Math.min(prev + 1, 20));
    onSendAndClose(`❓ Q${questionsUsed + 1}/20: ${customQuestion.trim()}`);
    setCustomQuestion('');
  };

  const handleMakeGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    onSendAndClose(`🎯 My Final Answer: Is it "${guessInput.trim()}"?`);
    setGuessInput('');
  };

  const handleReveal = () => {
    setIsRevealed(true);
    onSendAndClose(
      `👁 Revealing my secret: ✨ ${secretWord} ✨ — That's what I was thinking of!`
    );
  };

  const handleEndGame = (theyGotIt: boolean) => {
    setPhase('ended');
    if (theyGotIt) {
      onSendAndClose(
        `🏆 ${cleanPartnerName} figured it out! It was "${secretWord}". Amazing detective work! ✨`
      );
    } else {
      onSendAndClose(
        `😅 20 Questions is over! Nobody guessed it — my secret was "${secretWord}". Better luck next time! 🎮`
      );
    }
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
              03 • Game
            </span>
            <h3 className="text-[16px] font-extrabold text-white leading-tight">20 Questions</h3>
          </div>
        </div>

        {phase === 'playing' && (
          <div className="flex items-center gap-2">
            {/* Animated Progress Ring */}
            <div className="relative h-12 w-12 flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" width="48" height="48" viewBox="0 0 48 48">
                <circle
                  cx="24" cy="24" r={ringRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="3"
                />
                <circle
                  cx="24" cy="24" r={ringRadius}
                  fill="none"
                  stroke={questionsLeft <= 5 ? '#F43F5E' : questionsLeft <= 10 ? '#F59E0B' : '#22C55E'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <span className={`text-[14px] font-mono font-black ${
                questionsLeft <= 5 ? 'text-[#F43F5E]' : questionsLeft <= 10 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {questionsLeft}
              </span>
            </div>
          </div>
        )}

        {phase === 'setup' && (
          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[10px] font-mono text-white/60">
            20 Qs
          </span>
        )}
      </div>

      {/* Setup Phase */}
      {phase === 'setup' && (
        <form onSubmit={handleLockIn} className="space-y-4">
          {/* Category Picker */}
          <div className="space-y-2">
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/40">Pick a category:</p>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`py-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                    category === cat.id
                      ? 'bg-white/[0.12] border-white/40 shadow-sm scale-[1.02]'
                      : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20'
                  }`}
                >
                  <span className="text-[20px] block">{cat.emoji}</span>
                  <span className="text-[10px] font-bold text-white/70 mt-1 block">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Secret Word Input */}
          <div className="space-y-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
            <div>
              <p className="text-[13px] font-bold text-white">What are you thinking of?</p>
              <p className="text-[11.5px] text-white/50 mt-0.5">
                Only you can see this. {cleanPartnerName} will ask questions to figure it out.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={secretWord}
                onChange={(e) => setSecretWord(e.target.value)}
                placeholder="e.g. Eiffel Tower"
                maxLength={100}
                className="flex-1 rounded-xl bg-black/50 border border-white/15 focus:border-white/40 px-3.5 py-2.5 text-[15px] text-white placeholder:text-white/25 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!secretWord.trim() || !category}
                className="rounded-xl px-5 py-2.5 bg-white text-black text-[13px] font-bold shadow-sm cursor-pointer active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
              >
                Start
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Playing Phase */}
      {phase === 'playing' && (
        <div className="space-y-3.5">
          {/* Secret Word Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/40">Your Secret</p>
              <p className="text-[18px] font-black text-white mt-0.5">
                {secretWord}{' '}
                <span className="text-[11px] font-normal text-white/40">
                  {isRevealed ? '(Revealed)' : '(Hidden)'}
                </span>
              </p>
            </div>
            {isRevealed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10.5px] font-mono font-bold">
                <span className="text-[12px]">👁</span>
                Revealed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10.5px] font-mono font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            )}
          </div>

          {/* Reveal Button */}
          <button
            type="button"
            onClick={handleReveal}
            disabled={isRevealed}
            className={`w-full py-3 rounded-2xl text-[13.5px] font-bold transition-all cursor-pointer active:scale-[0.98] disabled:cursor-default disabled:active:scale-100 flex items-center justify-center gap-2 ${
              isRevealed
                ? 'bg-white/[0.04] border border-white/[0.08] text-white/40'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30'
            }`}
          >
            {isRevealed ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Secret Revealed to {cleanPartnerName}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                Reveal My Secret to {cleanPartnerName}
              </>
            )}
          </button>

          {/* Quick Replies — for answering the guesser's questions */}
          <div className="space-y-2">
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/40">
              Reply to their question:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickReply('Yes!', '✅')}
                className="py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-[13px] font-bold cursor-pointer active:scale-95 transition-all"
              >
                ✅ Yes
              </button>
              <button
                type="button"
                onClick={() => handleQuickReply('No', '❌')}
                className="py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[13px] font-bold cursor-pointer active:scale-95 transition-all"
              >
                ❌ No
              </button>
              <button
                type="button"
                onClick={() => handleQuickReply('Kind of...', '🤷')}
                className="py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-[13px] font-bold cursor-pointer active:scale-95 transition-all"
              >
                🤷 Kind of
              </button>
            </div>
          </div>

          {/* Ask a Question */}
          <form onSubmit={handleAskQuestion} className="space-y-2">
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/40">
              Ask a Yes/No question:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Is it alive?"
                maxLength={200}
                className="flex-1 rounded-xl bg-black/50 border border-white/15 focus:border-white/40 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/25 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!customQuestion.trim()}
                className="rounded-xl px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.15] text-white text-[13px] font-bold cursor-pointer active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all border border-white/10"
              >
                Ask
              </button>
            </div>
          </form>

          {/* Make a Guess */}
          <form onSubmit={handleMakeGuess} className="space-y-2">
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/40">
              Make your guess:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder={`Guess what ${cleanPartnerName} is thinking...`}
                maxLength={100}
                className="flex-1 rounded-xl bg-black/50 border border-white/15 focus:border-white/40 px-3.5 py-2.5 text-[13.5px] text-white placeholder:text-white/25 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!guessInput.trim()}
                className="rounded-xl px-4 py-2.5 bg-white text-black text-[13px] font-bold shadow-sm cursor-pointer active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
              >
                Guess
              </button>
            </div>
          </form>

          {/* End Game Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-[12px]">
            <button
              type="button"
              onClick={() => handleEndGame(true)}
              className="text-white/70 hover:text-white transition-colors font-medium cursor-pointer"
            >
              🎉 They Got It!
            </button>
            <button
              type="button"
              onClick={() => handleEndGame(false)}
              className="text-white/70 hover:text-white transition-colors font-medium cursor-pointer"
            >
              😅 Nobody Guessed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
