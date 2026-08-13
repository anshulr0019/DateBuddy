'use client';

/* Client-side types for Random Chat — mirrors the API contracts in
   src/lib/random-chat-matchmaking.ts and src/lib/random-chat-config.ts. */

export type RandomChatVibe =
  | 'chill'
  | 'funny'
  | 'deep talks'
  | 'flirty'
  | 'random'
  | 'late night'
  | 'creative'
  | 'gaming'
  | 'fitness'
  | 'music';

export type RandomChatGenderPref = 'men' | 'women' | 'everyone';

export interface RandomChatPrefs {
  vibe: string;
  ageMin: number;
  ageMax: number;
  genderPref: RandomChatGenderPref;
  interests: string[];
}

export interface SessionMessage {
  id: number;
  senderIsMe: boolean;
  content: string;
  createdAt: string;
}

export interface SessionPartner {
  alias: string;
  age: number | null;
  interests: string[];
  sharedInterests: string[];
}

export interface SessionMatch {
  matchId: number;
  partnerName: string;
  partnerPhoto: string | null;
  partnerCity: string | null;
  partnerVerified: boolean;
}

export interface RandomChatSession {
  id: number;
  myAlias: string;
  status: 'active' | 'connected' | 'ended';
  vibe: string | null;
  partner: SessionPartner | null;
  connection: {
    requestedByMe: boolean;
    requestedByPartner: boolean;
    isMutual: boolean;
  };
  match: SessionMatch | null;
  messages: SessionMessage[];
  endedByMe: boolean | null;
  icebreakers: string[];
}

export type SessionPoll =
  | { status: 'none' }
  | { status: 'searching'; searching: { vibe: string } }
  | { status: 'matched'; session: RandomChatSession }
  | { status: 'ended'; session: RandomChatSession };

export interface RandomChatOverview {
  onlineCount: number;
  chattingNow: number;
  inQueue: boolean;
  hasActiveSession: boolean;
  prefill: {
    gender: string;
    lookingFor: string;
    ageMin: number;
    ageMax: number;
    interests: string[];
  };
}

export type ClientPhase =
  | 'loading'
  | 'entry'
  | 'searching'
  | 'preview'
  | 'chat'
  | 'connected'
  | 'ended'
  | 'error';
