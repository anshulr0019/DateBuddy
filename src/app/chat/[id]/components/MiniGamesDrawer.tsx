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

  const partnerFirstName = partnerName?.split(' ')[0] || 'Match';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none"
    >
      {/* Backdrop click to dismiss */}
      <div onClick={onClose} className="absolute inset-0" />

      {/* Main Sheet Container */}
      <div className="relative z-10 w-full max-w-[420px] rounded-t-[32px] sm:rounded-[28px] p-6 bg-[#0D0D11] border border-white/[0.08] shadow-[0_-20px_60px_rgba(0,0,0,0.8)] text-white flex flex-col items-center animate-sheet-up">
        {/* Minimalist Drag Handle */}
        <div className="h-1 w-9 rounded-full bg-white/20 mb-4" />

        {activeGame === 'guess_number' ? (
          <GuessNumberGame
            partnerName={partnerName}
            onSendGameMessage={(msg) => {
              onSendGameMessage(msg);
            }}
            onSendAndClose={(msg) => {
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
          <div className="w-full space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-[0.18em] uppercase text-white/40">
                  Interactive
                </span>
                <h3 className="text-[19px] font-extrabold text-white tracking-tight">Mini Games</h3>
                <p className="text-[12.5px] text-white/50 mt-0.5">
                  Play directly in chat with {partnerFirstName}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="h-8 w-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Game Options — Minimalist Dark Glass Cards */}
            <div className="space-y-3">
              {/* Option 1: Guess The Number */}
              <button
                type="button"
                onClick={() => setActiveGame('guess_number')}
                className="w-full p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 text-left transition-all active:scale-[0.985] cursor-pointer flex items-center gap-4 group"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-white font-mono font-bold text-[16px] group-hover:scale-105 transition-transform">
                  01
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-white tracking-tight">Guess The Number</p>
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-white/80 border border-white/10 text-[9.5px] font-mono uppercase tracking-wider">
                      0–100
                    </span>
                  </div>
                  <p className="text-[12px] text-white/50 mt-1 line-clamp-1">
                    Lock a secret number, ask higher/lower clues, claim victory.
                  </p>
                </div>
                <span className="text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all text-sm font-bold">
                  &rarr;
                </span>
              </button>

              {/* Option 2: Truth or Dare */}
              <button
                type="button"
                onClick={() => setActiveGame('truth_dare')}
                className="w-full p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/20 text-left transition-all active:scale-[0.985] cursor-pointer flex items-center gap-4 group"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] text-white font-mono font-bold text-[16px] group-hover:scale-105 transition-transform">
                  02
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-white tracking-tight">Truth or Dare</p>
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-white/80 border border-white/10 text-[9.5px] font-mono uppercase tracking-wider">
                      Prompts
                    </span>
                  </div>
                  <p className="text-[12px] text-white/50 mt-1 line-clamp-1">
                    Curated questions and fun voice & camera challenges.
                  </p>
                </div>
                <span className="text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all text-sm font-bold">
                  &rarr;
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
