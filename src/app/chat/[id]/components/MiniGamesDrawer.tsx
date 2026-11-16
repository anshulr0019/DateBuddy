'use client';

import React, { useState } from 'react';
import { Ic } from '../../../components/icons';
import { GuessNumberGame } from './GuessNumberGame';
import { TruthOrDareGame } from './TruthOrDareGame';
import { TwentyQuestionsGame } from './TwentyQuestionsGame';

interface MiniGamesDrawerProps {
  isOpen: boolean;
  matchId: number;
  partnerName: string;
  onSendGameMessage: (text: string) => void;
  onClose: () => void;
}

type ActiveGame = 'menu' | 'guess_number' | 'truth_dare' | 'twenty_questions';

export function MiniGamesDrawer({
  isOpen,
  matchId,
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-infyn-ink/50 animate-fade-in select-none"
    >
      {/* Backdrop click to dismiss */}
      <div onClick={onClose} className="absolute inset-0" />

      {/* Main Sheet Container */}
      <div className="relative z-10 w-full max-w-[420px] rounded-t-[32px] sm:rounded-[28px] p-6 bg-infyn-paper border border-infyn-border shadow-[0_-12px_40px_-12px_rgba(32,26,22,0.25)] text-infyn-ink flex flex-col items-center animate-sheet-up">
        {/* Minimalist Drag Handle */}
        <div className="h-1 w-9 rounded-full bg-infyn-blush mb-4" />

        {activeGame === 'guess_number' ? (
          <GuessNumberGame
            matchId={matchId}
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
        ) : activeGame === 'twenty_questions' ? (
          <TwentyQuestionsGame
            matchId={matchId}
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
        ) : (
          <div className="w-full space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-infyn-border">
              <div>
                <span className="text-[12px] font-semibold tracking-[0.1em] uppercase text-infyn-muted">
                  Play together
                </span>
                <h3 className="font-display text-[24px] text-infyn-ink tracking-tight">Mini games</h3>
                <p className="text-[14px] text-infyn-secondary mt-0.5">
                  Play directly in chat with {partnerFirstName}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close games"
                className="h-8 w-8 rounded-full bg-infyn-surface-soft hover:bg-infyn-blush flex items-center justify-center text-infyn-secondary hover:text-infyn-ink transition-colors cursor-pointer"
              >
                <Ic.X className="w-4 h-4" />
              </button>
            </div>

            {/* Game Options — Minimalist Dark Glass Cards */}
            <div className="space-y-3">
              {/* Option 1: Guess The Number */}
              <button
                type="button"
                onClick={() => setActiveGame('guess_number')}
                className="w-full p-4 rounded-2xl bg-infyn-surface hover:bg-infyn-surface-soft border border-infyn-border hover:border-infyn-rose-line text-left transition-all active:scale-[0.985] cursor-pointer flex items-center gap-4 group"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-infyn-surface-soft border border-infyn-border text-infyn-rose group-hover:scale-105 transition-transform"><Ic.Sparkle className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-infyn-ink tracking-tight">Guess The Number</p>
                                      </div>
                  <p className="text-[13px] text-infyn-secondary mt-0.5 line-clamp-2">
                    Lock a secret number, ask higher/lower clues, claim victory.
                  </p>
                </div>
                <span className="text-infyn-muted/70 group-hover:text-infyn-ink group-hover:translate-x-0.5 transition-all text-sm font-bold">
                  <span className="inline-block -rotate-90"><Ic.ChevDown /></span>
                </span>
              </button>

              {/* Option 2: Truth or Dare */}
              <button
                type="button"
                onClick={() => setActiveGame('truth_dare')}
                className="w-full p-4 rounded-2xl bg-infyn-surface hover:bg-infyn-surface-soft border border-infyn-border hover:border-infyn-rose-line text-left transition-all active:scale-[0.985] cursor-pointer flex items-center gap-4 group"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-infyn-surface-soft border border-infyn-border text-infyn-rose group-hover:scale-105 transition-transform"><Ic.Chat /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-infyn-ink tracking-tight">Truth or Dare</p>
                                      </div>
                  <p className="text-[13px] text-infyn-secondary mt-0.5 line-clamp-2">
                    Curated questions and fun voice & camera challenges.
                  </p>
                </div>
                <span className="text-infyn-muted/70 group-hover:text-infyn-ink group-hover:translate-x-0.5 transition-all text-sm font-bold">
                  <span className="inline-block -rotate-90"><Ic.ChevDown /></span>
                </span>
              </button>

              {/* Option 3: 20 Questions */}
              <button
                type="button"
                onClick={() => setActiveGame('twenty_questions')}
                className="w-full p-4 rounded-2xl bg-infyn-surface hover:bg-infyn-surface-soft border border-infyn-border hover:border-infyn-rose-line text-left transition-all active:scale-[0.985] cursor-pointer flex items-center gap-4 group"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-infyn-surface-soft border border-infyn-border text-infyn-rose group-hover:scale-105 transition-transform"><Ic.Search className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-bold text-infyn-ink tracking-tight">20 Questions</p>
                                      </div>
                  <p className="text-[13px] text-infyn-secondary mt-0.5 line-clamp-2">
                    Think of something — they ask 20 Yes/No questions to guess it.
                  </p>
                </div>
                <span className="text-infyn-muted/70 group-hover:text-infyn-ink group-hover:translate-x-0.5 transition-all text-sm font-bold">
                  <span className="inline-block -rotate-90"><Ic.ChevDown /></span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
