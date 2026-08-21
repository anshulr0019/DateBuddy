'use client';

import React, { useState } from 'react';

interface GuessNumberGameProps {
  partnerName: string;
  onSendGameMessage: (text: string) => void;
  onClose: () => void;
}

export function GuessNumberGame({
  partnerName,
  onSendGameMessage,
  onClose,
}: GuessNumberGameProps) {
  const cleanPartnerName = partnerName?.split(' ')[0] || 'Partner';

  const [mySecretNumber, setMySecretNumber] = useState<string>('');
  const [isLockedIn, setIsLockedIn] = useState(false);
  const [rangeMin, setRangeMin] = useState(0);
  const [rangeMax, setRangeMax] = useState(100);
  const [guessInput, setGuessInput] = useState('');

  const handleLockIn = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(mySecretNumber);
    if (isNaN(num) || num < 0 || num > 100) return;
    setIsLockedIn(true);
    onSendGameMessage(`🎮 I locked in my secret number for Guess The Number (0–100)! Ask clue questions or make your guess.`);
  };

  const handleAskQuickQuestion = (threshold: number) => {
    const text = `🔢 Clue Question: Is your secret number greater than ${threshold}?`;
    onSendGameMessage(text);
  };

  const handleNarrowRange = (newMin: number, newMax: number) => {
    setRangeMin(Math.max(0, newMin));
    setRangeMax(Math.min(100, newMax));
  };

  const handleMakeGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(guessInput);
    if (isNaN(num)) return;
    onSendGameMessage(`🎯 My Final Guess: Is your number ${num}?`);
    setGuessInput('');
  };

  const handleDeclareResult = (iWon: boolean) => {
    if (iWon) {
      onSendGameMessage(`🏆 Bingo! You guessed my secret number correctly! You win! ✨`);
    } else {
      onSendGameMessage(`🎉 I guessed your number! That was a great game! ✨`);
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
              01 • Game
            </span>
            <h3 className="text-[16px] font-extrabold text-white leading-tight">Guess The Number</h3>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[10px] font-mono text-white/60">
          0–100
        </span>
      </div>

      {/* Step 1: Secret Number Lock-in */}
      {!isLockedIn ? (
        <form onSubmit={handleLockIn} className="space-y-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
          <div>
            <p className="text-[13px] font-bold text-white">Choose your secret number</p>
            <p className="text-[11.5px] text-white/50 mt-0.5">
              Only you can see this. {cleanPartnerName} will try to guess it.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={mySecretNumber}
              onChange={(e) => setMySecretNumber(e.target.value)}
              placeholder="e.g. 74"
              className="flex-1 rounded-xl bg-black/50 border border-white/15 focus:border-white/40 px-3.5 py-2.5 text-[15px] font-mono text-white placeholder:text-white/25 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!mySecretNumber.trim()}
              className="rounded-xl px-5 py-2.5 bg-white text-black text-[13px] font-bold shadow-sm cursor-pointer active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
            >
              Lock In
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3.5">
          {/* Secret Number Status Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/40">Your Secret Number</p>
              <p className="text-[20px] font-mono font-black text-white mt-0.5">
                {mySecretNumber} <span className="text-[11px] font-normal text-white/40">(Hidden)</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10.5px] font-mono font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Live
            </span>
          </div>

          {/* Dynamic Range Tracker */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-white/60 font-medium">Search Range:</span>
              <span className="font-mono font-bold text-white text-[13.5px]">[{rangeMin} — {rangeMax}]</span>
            </div>

            {/* Quick Narrow Buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleNarrowRange(0, 50)}
                className="py-1.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-mono text-white/70 border border-white/5 cursor-pointer transition-colors"
              >
                0–50
              </button>
              <button
                type="button"
                onClick={() => handleNarrowRange(50, 100)}
                className="py-1.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-mono text-white/70 border border-white/5 cursor-pointer transition-colors"
              >
                50–100
              </button>
              <button
                type="button"
                onClick={() => handleNarrowRange(0, 100)}
                className="py-1.5 px-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-mono text-white/70 border border-white/5 cursor-pointer transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Quick Clue Starters */}
          <div className="space-y-2">
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-white/40">Ask Clue Question:</p>
            <div className="flex flex-wrap gap-1.5">
              {[25, 50, 75].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAskQuickQuestion(val)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-[11.5px] font-medium text-white/80 border border-white/5 cursor-pointer transition-colors"
                >
                  Is it &gt; {val}?
                </button>
              ))}
              <button
                type="button"
                onClick={() => onSendGameMessage('🔢 Clue Question: Is your secret number an EVEN or ODD number?')}
                className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-[11.5px] font-medium text-white/80 border border-white/5 cursor-pointer transition-colors"
              >
                Even or Odd?
              </button>
            </div>
          </div>

          {/* Guess Submission Form */}
          <form onSubmit={handleMakeGuess} className="flex items-center gap-2 pt-1">
            <input
              type="number"
              min={0}
              max={100}
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder={`Guess ${cleanPartnerName}'s number...`}
              className="flex-1 rounded-xl bg-black/50 border border-white/15 focus:border-white/40 px-3.5 py-2.5 text-[13.5px] font-mono text-white placeholder:text-white/25 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!guessInput.trim()}
              className="rounded-xl px-4 py-2.5 bg-white text-black text-[13px] font-bold shadow-sm cursor-pointer active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
            >
              Guess
            </button>
          </form>

          {/* End Game / Win Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-[12px]">
            <button
              type="button"
              onClick={() => handleDeclareResult(true)}
              className="text-white/70 hover:text-white transition-colors font-medium cursor-pointer"
            >
              🎉 Match Guessed Mine
            </button>
            <button
              type="button"
              onClick={() => handleDeclareResult(false)}
              className="text-white/70 hover:text-white transition-colors font-medium cursor-pointer"
            >
              🤝 I Guessed Theirs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
