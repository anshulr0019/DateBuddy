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
  const [partnerLockedIn, setPartnerLockedIn] = useState(true); // simulated partner lock
  const [rangeMin, setRangeMin] = useState(0);
  const [rangeMax, setRangeMax] = useState(100);
  const [customQuestion, setCustomQuestion] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [winner, setWinner] = useState<string | null>(null);

  const handleLockIn = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(mySecretNumber);
    if (isNaN(num) || num < 0 || num > 100) return;
    setIsLockedIn(true);
    onSendGameMessage(`🎮 I locked in my secret number for Guess The Number (0–100)! Your turn to guess.`);
  };

  const handleAskQuickQuestion = (threshold: number) => {
    const text = `🔢 Clue Question: Is your secret number greater than ${threshold}?`;
    onSendGameMessage(text);
  };

  const handleAskCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    onSendGameMessage(`🔢 Clue Question: ${customQuestion.trim()}`);
    setCustomQuestion('');
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
      setWinner('You');
      onSendGameMessage(`🏆 Bingo! You guessed my number correctly! You win! 🎉`);
    } else {
      setWinner(cleanPartnerName);
      onSendGameMessage(`🎉 I guessed it! Your number was right on point! Great game! ✨`);
    }
  };

  return (
    <div className="w-full rounded-[24px] bg-[#16141F] border border-purple-500/25 p-4 text-white shadow-2xl space-y-4 animate-scale-pop select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 text-lg">
            🔢
          </span>
          <div>
            <h3 className="text-[15px] font-bold text-white leading-tight">Guess The Number (0–100)</h3>
            <p className="text-[11px] text-white/50">Instagram Reel Style 2-Player Game</p>
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

      {/* Step 1: Secret Number Lock-in */}
      {!isLockedIn ? (
        <form onSubmit={handleLockIn} className="space-y-3 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
          <div>
            <p className="text-[13px] font-bold text-purple-300">Step 1: Choose your secret number</p>
            <p className="text-[11.5px] text-white/60">
              Only you can see this. {cleanPartnerName} will try to guess it!
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
              className="flex-1 rounded-xl bg-black/40 border border-purple-500/30 px-3.5 py-2 text-[15px] font-mono text-white placeholder:text-white/30 outline-none"
            />
            <button
              type="submit"
              disabled={!mySecretNumber.trim()}
              className="rounded-xl px-4 py-2 bg-gradient-to-r from-[#FF6B9D] to-[#7B68EE] text-white text-[13px] font-bold shadow-md cursor-pointer active:scale-95 disabled:opacity-40"
            >
              🔒 Lock In
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          {/* Secret Number Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <div>
              <p className="text-[11px] uppercase font-extrabold tracking-wider text-purple-300">Your Secret Number</p>
              <p className="text-[20px] font-mono font-black text-white">{mySecretNumber} <span className="text-[11px] font-normal text-white/50">(Secret)</span></p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                ✓ Game Live
              </span>
            </div>
          </div>

          {/* Dynamic Range Tracker */}
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-bold text-white/80">Current Number Range:</span>
              <span className="font-mono font-bold text-purple-300 text-[14px]">[{rangeMin} — {rangeMax}]</span>
            </div>

            {/* Quick Narrow Slider Buttons */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleNarrowRange(0, 50)}
                className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-white/80 border border-white/5 cursor-pointer"
              >
                Range 0–50
              </button>
              <button
                type="button"
                onClick={() => handleNarrowRange(50, 100)}
                className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-white/80 border border-white/5 cursor-pointer"
              >
                Range 50–100
              </button>
              <button
                type="button"
                onClick={() => handleNarrowRange(0, 100)}
                className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-white/80 border border-white/5 cursor-pointer"
              >
                Reset 0–100
              </button>
            </div>
          </div>

          {/* Quick Clue Starters */}
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase font-bold text-white/50">Send Clue Questions to Chat:</p>
            <div className="flex flex-wrap gap-1.5">
              {[25, 50, 75].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAskQuickQuestion(val)}
                  className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-purple-500/20 hover:text-purple-300 text-[11.5px] font-medium text-white/80 cursor-pointer transition-colors border border-white/5"
                >
                  Is it &gt; {val}?
                </button>
              ))}
              <button
                type="button"
                onClick={() => onSendGameMessage('🔢 Clue Question: Is your secret number an EVEN or ODD number?')}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-purple-500/20 hover:text-purple-300 text-[11.5px] font-medium text-white/80 cursor-pointer transition-colors border border-white/5"
              >
                Even / Odd?
              </button>
            </div>
          </div>

          {/* Guess Submission Form */}
          <form onSubmit={handleMakeGuess} className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={guessInput}
              onChange={(e) => setGuessInput(e.target.value)}
              placeholder={`Guess ${cleanPartnerName}'s number...`}
              className="flex-1 rounded-xl bg-black/40 border border-white/15 px-3 py-2 text-[13px] font-mono text-white placeholder:text-white/30 outline-none"
            />
            <button
              type="submit"
              disabled={!guessInput.trim()}
              className="rounded-xl px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[12.5px] font-bold cursor-pointer active:scale-95 disabled:opacity-40"
            >
              🎯 Guess
            </button>
          </form>

          {/* End Game / Win Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[12px]">
            <button
              type="button"
              onClick={() => handleDeclareResult(true)}
              className="text-emerald-400 hover:underline font-bold cursor-pointer"
            >
              🎉 I Won / Match Guessed!
            </button>
            <button
              type="button"
              onClick={() => handleDeclareResult(false)}
              className="text-rose-400 hover:underline font-bold cursor-pointer"
            >
              🤝 I Guessed Theirs!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
