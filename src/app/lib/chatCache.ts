'use client';

import type { ChatMessage, Partner } from '../chat/[id]/chatTypes';

interface ChatCacheEntry {
  viewerId: number;
  partner: Partner;
  messages: ChatMessage[];
  hasMore: boolean;
  updatedAt: number;
}

const MAX_CHATS = 6;
const MAX_MESSAGES_PER_CHAT = 100;
const chats = new Map<number, ChatCacheEntry>();

export function getCachedChat(matchId: number, viewerId: number): ChatCacheEntry | null {
  const cached = chats.get(matchId);
  if (!cached || cached.viewerId !== viewerId) return null;
  chats.delete(matchId);
  chats.set(matchId, cached);
  return cached;
}

export function setCachedChat(
  matchId: number,
  update: Omit<ChatCacheEntry, 'updatedAt'>
): void {
  chats.delete(matchId);
  chats.set(matchId, {
    ...update,
    messages: update.messages.slice(-MAX_MESSAGES_PER_CHAT),
    updatedAt: Date.now(),
  });
  while (chats.size > MAX_CHATS) {
    const oldest = chats.keys().next().value as number | undefined;
    if (oldest === undefined) break;
    chats.delete(oldest);
  }
}

export function deleteCachedChat(matchId: number): void {
  chats.delete(matchId);
}

export function clearChatCache(): void {
  chats.clear();
}
