'use client';

import React, { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'datebuddy_20q_';

const CATEGORIES = [
  { id: 'person', emoji: '👤', label: 'Person' },
  { id: 'place', emoji: '📍', label: 'Place' },
  { id: 'thing', emoji: '📦', label: 'Thing' },
  { id: 'abstract', emoji: '💭', label: 'Abstract' },
];

interface TwentyQuestionsGameProps {
  matchId: number;
  partnerName: string;
  onSendGameMessage: (text: string) => void;
  onSendAndClose: (text: string) => void;
  onClose: () => void;
}

interface GameState {
  secretWord: string;
  category: string;
  isLockedIn: boolean;
  isRevealed: boolean;
}

export function TwentyQuestionsGame({
  matchId,
  partnerName,
  onSendGameMessage,
  onSendAndClose,
  onClose,
}: TwentyQuestionsGameProps) {
  const cleanPartnerName = partnerName?.split(' ')[0] || 'Partner';
  const storageKey = `${STORAGE_KEY_PREFIX}${matchId}`;

  // Load persisted state from localStorage
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored) as GameState;
    } catch { /* ignore */ }
    return { secretWord: '', category: '', isLockedIn: false, isRevealed: false };
  });

  const [inputWord, setInputWord] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Persist game state to localStorage whenever it changes
  useEffect(() => {
    if (gameState.isLockedIn) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(gameState));
      } catch { /* ignore */ }
    }
  }, [gameState, storageKey]);

  const handleLockIn = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord.trim() || !selectedCategory) return;
    const cat = CATEGORIES.find((c) => c.id === selectedCategory);
    setGameState({ secretWord: inputWord.trim(), category: selectedCategory, isLockedIn: true, isRevealed: false });
    onSendGameMessage(
      `🎯 I'm thinking of something! 20 Questions starts now.\n${cat?.emoji} Category: ${cat?.label}\nAsk me Yes/No questions to figure it out!`
    );
  }, [inputWord, selectedCategory, onSendGameMessage]);

  const handleReveal = useCallback(() => {
    setGameState((prev) => ({ ...prev, isRevealed: true }));
    onSendAndClose(`👁 Revealing my secret: ✨ ${gameState.secretWord} ✨ — That's what I was thinking of!`);
  }, [gameState.secretWord, onSendAndClose]);

  const handleNewGame = useCallback(() => {
    setGameState({ secretWord: '', category: '', isLockedIn: false, isRevealed: false });
    setInputWord('');
    setSelectedCategory(null);
    try {
      localStorage.removeItem(storageKey);
    } catch { /* ignore */ }
  }, [storageKey]);

  const categoryObj = CATEGORIES.find((c) => c.id === gameState.category);

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

        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[10px] font-mono text-white/60">
          Y/N
        </span>
      </div>

      {/* Before lock-in: setup */}
      {!gameState.isLockedIn ? (
        <form onSubmit={handleLockIn} className="space-y-4">
          {/* Category Picker */}
          <div className="space-y-2">
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/40">Pick a category:</p>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                    selectedCategory === cat.id
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
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value)}
                placeholder="e.g. Eiffel Tower"
                maxLength={100}
                className="flex-1 rounded-xl bg-black/50 border border-white/15 focus:border-white/40 px-3.5 py-2.5 text-[15px] text-white placeholder:text-white/25 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!inputWord.trim() || !selectedCategory}
                className="rounded-xl px-5 py-2.5 bg-white text-black text-[13px] font-bold shadow-sm cursor-pointer active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
              >
                Start
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* After lock-in: clean 2-button UI */
        <div className="space-y-4">
          {/* Secret Word Badge */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/40">Your Secret</p>
                {categoryObj && (
                  <span className="text-[10px] text-white/40">
                    {categoryObj.emoji} {categoryObj.label}
                  </span>
                )}
              </div>
              <p className="text-[22px] font-black text-white">
                {gameState.secretWord}
              </p>
            </div>
            {gameState.isRevealed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
                👁 Revealed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Hidden
              </span>
            )}
          </div>

          {/* Reveal Button */}
          <button
            type="button"
            onClick={handleReveal}
            disabled={gameState.isRevealed}
            className={`w-full py-3.5 rounded-2xl text-[14px] font-bold transition-all cursor-pointer active:scale-[0.98] disabled:cursor-default disabled:active:scale-100 flex items-center justify-center gap-2.5 ${
              gameState.isRevealed
                ? 'bg-white/[0.04] border border-white/[0.08] text-white/40'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30'
            }`}
          >
            {gameState.isRevealed ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                Revealed to {cleanPartnerName}
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                Reveal My Secret to {cleanPartnerName}
              </>
            )}
          </button>

          {/* Start New Game */}
          <button
            type="button"
            onClick={handleNewGame}
            className="w-full py-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/70 hover:text-white text-[13px] font-bold transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
            Start New Game
          </button>

          {/* Hint text */}
          <p className="text-[11px] text-white/30 text-center">
            Use the chat to ask Yes/No questions and make guesses
          </p>
        </div>
      )}
    </div>
  );
}
