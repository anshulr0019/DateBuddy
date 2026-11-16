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
              03 • Game
            </span>
            <h3 className="text-[16px] font-semibold text-infyn-ink leading-tight">20 Questions</h3>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-infyn-surface-soft border border-infyn-border text-[10px] text-infyn-secondary">
          Y/N
        </span>
      </div>

      {/* Before lock-in: setup */}
      {!gameState.isLockedIn ? (
        <form onSubmit={handleLockIn} className="space-y-4">
          {/* Category Picker */}
          <div className="space-y-2">
            <p className="text-[10.5px] uppercase tracking-wider text-infyn-muted">Pick a category:</p>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 ${
                    selectedCategory === cat.id
                      ? 'bg-infyn-blush border-infyn-rose-line shadow-sm scale-[1.02]'
                      : 'bg-infyn-surface border-infyn-border hover:bg-infyn-surface-soft hover:border-infyn-rose-line'
                  }`}
                >
                  <span className="text-[20px] block">{cat.emoji}</span>
                  <span className="text-[10px] font-bold text-infyn-secondary mt-1 block">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Secret Word Input */}
          <div className="space-y-2 p-4 rounded-2xl bg-infyn-surface border border-infyn-border">
            <div>
              <p className="text-[13px] font-bold text-infyn-ink">What are you thinking of?</p>
              <p className="text-[11.5px] text-infyn-secondary mt-0.5">
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
                className="flex-1 rounded-xl bg-infyn-surface-soft border border-infyn-border focus:border-infyn-rose-line px-3.5 py-2.5 text-[15px] text-infyn-ink placeholder:text-infyn-muted/70 outline-none transition-colors"
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
          <div className="flex items-center justify-between p-4 rounded-2xl bg-infyn-surface border border-infyn-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] uppercase tracking-wider text-infyn-muted">Your Secret</p>
                {categoryObj && (
                  <span className="text-[10px] text-infyn-muted">
                    {categoryObj.emoji} {categoryObj.label}
                  </span>
                )}
              </div>
              <p className="text-[22px] font-semibold text-infyn-ink">
                {gameState.secretWord}
              </p>
            </div>
            {gameState.isRevealed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-infyn-blush text-infyn-rose text-[12px] font-semibold">
                Revealed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-infyn-surface-soft text-infyn-secondary text-[12px] font-semibold">
                <span className="h-2 w-2 rounded-full bg-infyn-muted" />
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
                ? 'bg-infyn-surface border border-infyn-border text-infyn-muted'
                : 'bg-infyn-rose text-[#fff8f0]'
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
            className="w-full py-3 rounded-2xl bg-infyn-surface-soft hover:bg-infyn-blush border border-infyn-border text-infyn-secondary hover:text-infyn-ink text-[13px] font-bold transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
            Start New Game
          </button>

          {/* Hint text */}
          <p className="text-[11px] text-infyn-muted/70 text-center">
            Use the chat to ask Yes/No questions and make guesses
          </p>
        </div>
      )}
    </div>
  );
}
