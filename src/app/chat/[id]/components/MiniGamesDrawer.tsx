'use client';

import React, { useState } from 'react';
import { GuessNumberGame } from './GuessNumberGame';
import { TruthOrDareGame } from './TruthOrDareGame';

interface MiniGamesDrawerProps {
  isOpen: boolean;
  partnerName: string;
  onSendGameMessage: (text: string) => void;
  onClose: () => void;
}

type ActiveGame = 'menu' | 'guess_number' | 'truth_dare';

export function MiniGamesDrawer({
  isOpen,
  partnerName,
  onSendGameMessage,
  onClose,
}: MiniGamesDrawerProps) {
  const [activeGame, setActiveGame] = useState<ActiveGame>('menu');

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in select-none"
    >
      <div onClick={onClose} className="absolute inset-0" />

      <div className="relative z-10 w-full max-w-[420px] rounded-t-[32px] sm:rounded-[32px] p-5 bg-[#121018] border border-white/15 shadow-2xl text-white flex flex-col items-center animate-sheet-up">
        {/* Drag Handle */}
        <div className="h-1 w-10 rounded-full bg-white/20 mb-3" />

        {activeGame === 'guess_number' ? (
          <GuessNumberGame
            partnerName={partnerName}
            onSendGameMessage={(msg) => {
              onSendGameMessage(msg);
              onClose();
            }}
            onClose={() => setActiveGame('menu')}
          />
        ) : activeGame === 'truth_dare' ? (
          <TruthOrDareGame
            onSendGameMessage={(msg) => {
              onSendGameMessage(msg);
              onClose();
            }}
            onClose={() => setActiveGame('menu')}
          />
        ) : (
          <div className="w-full space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="text-[18px] font-black text-white">🎮 In-Chat Mini Games</h3>
                <p className="text-[12px] text-white/50">Pick a game to play with {partnerName.split(' ')[0]}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Game Options */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setActiveGame('guess_number')}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 hover:border-purple-500/60 text-left transition-all active:scale-[0.98] cursor-pointer flex items-center gap-3.5 group"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 text-2xl group-hover:scale-110 transition-transform">
                  🔢
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[15px] font-bold text-white">Guess The Number</p>
                    <span className="px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-[9px] font-black">
                      Viral Reel
                    </span>
                  </div>
                  <p className="text-[12px] text-white/60 mt-0.5">
                    Secret 0–100 number pick, clue questions, and win reveal!
                  </p>
                </div>
                <span className="text-purple-300 font-bold text-lg">&rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGame('truth_dare')}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-rose-900/40 to-pink-900/40 border border-rose-500/30 hover:border-rose-500/60 text-left transition-all active:scale-[0.98] cursor-pointer flex items-center gap-3.5 group"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-2xl group-hover:scale-110 transition-transform">
                  🎭
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[15px] font-bold text-white">Truth or Dare</p>
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">
                      Classic
                    </span>
                  </div>
                  <p className="text-[12px] text-white/60 mt-0.5">
                    Spicy questions & fun camera/voice challenges.
                  </p>
                </div>
                <span className="text-rose-300 font-bold text-lg">&rarr;</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
