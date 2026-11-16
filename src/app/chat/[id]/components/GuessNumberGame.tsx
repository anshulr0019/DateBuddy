'use client';

import React, { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PREFIX = 'datebuddy_guessnumber_';

interface GuessNumberGameProps {
  matchId: number;
  partnerName: string;
  onSendGameMessage: (text: string) => void;
  onSendAndClose: (text: string) => void;
  onClose: () => void;
}

interface GameState {
  mySecretNumber: string;
  isLockedIn: boolean;
  isRevealed: boolean;
}

export function GuessNumberGame({
  matchId,
  partnerName,
  onSendGameMessage,
  onSendAndClose,
  onClose,
}: GuessNumberGameProps) {
  const cleanPartnerName = partnerName?.split(' ')[0] || 'Partner';
  const storageKey = `${STORAGE_KEY_PREFIX}${matchId}`;

  // Load persisted state from localStorage
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored) as GameState;
    } catch { /* ignore */ }
    return { mySecretNumber: '', isLockedIn: false, isRevealed: false };
  });

  const [inputNumber, setInputNumber] = useState('');

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
    const num = Number(inputNumber);
    if (isNaN(num) || num < 0 || num > 100) return;
    setGameState({ mySecretNumber: inputNumber, isLockedIn: true, isRevealed: false });
    onSendGameMessage(`🎮 I locked in my secret number for Guess The Number (0–100)! Ask clue questions or make your guess.`);
  }, [inputNumber, onSendGameMessage]);

  const handleReveal = useCallback(() => {
    setGameState((prev) => ({ ...prev, isRevealed: true }));
    onSendAndClose(`👁 Revealing my secret number: ✨ ${gameState.mySecretNumber} ✨ — I had this locked in from the start!`);
  }, [gameState.mySecretNumber, onSendAndClose]);

  const handleNewGame = useCallback(() => {
    setGameState({ mySecretNumber: '', isLockedIn: false, isRevealed: false });
    setInputNumber('');
    try {
      localStorage.removeItem(storageKey);
    } catch { /* ignore */ }
  }, [storageKey]);

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
              01 • Game
            </span>
            <h3 className="text-[16px] font-semibold text-infyn-ink leading-tight">Guess The Number</h3>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-infyn-surface-soft border border-infyn-border text-[10px] text-infyn-secondary">
          0–100
        </span>
      </div>

      {/* Before lock-in: input field */}
      {!gameState.isLockedIn ? (
        <form onSubmit={handleLockIn} className="space-y-3.5 p-4 rounded-2xl bg-infyn-surface border border-infyn-border">
          <div>
            <p className="text-[13px] font-bold text-infyn-ink">Choose your secret number</p>
            <p className="text-[11.5px] text-infyn-secondary mt-0.5">
              Only you can see this. {cleanPartnerName} will try to guess it.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value)}
              placeholder="e.g. 74"
              className="flex-1 rounded-xl bg-infyn-surface-soft border border-infyn-border focus:border-infyn-rose-line px-3.5 py-2.5 text-[15px] text-infyn-ink placeholder:text-infyn-muted/70 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!inputNumber.trim()}
              className="rounded-xl px-5 py-2.5 bg-white text-black text-[13px] font-bold shadow-sm cursor-pointer active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
            >
              Lock In
            </button>
          </div>
        </form>
      ) : (
        /* After lock-in: clean 2-button UI */
        <div className="space-y-4">
          {/* Secret Number Badge */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-infyn-surface border border-infyn-border">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-infyn-muted">Your Secret Number</p>
              <p className="text-[24px] font-semibold text-infyn-ink mt-1">
                {gameState.mySecretNumber}
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
                Reveal My Number to {cleanPartnerName}
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
            Use the chat to ask clue questions and make guesses
          </p>
        </div>
      )}
    </div>
  );
}
