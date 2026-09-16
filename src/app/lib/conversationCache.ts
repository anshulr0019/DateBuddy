'use client';

export interface ConversationSummary {
  id: number;
  partnerId: number;
  name: string;
  photo: string | null;
  lastMsg: string;
  time: string;
  unread: number;
  online?: boolean;
}

let conversations: ConversationSummary[] | null = null;
let fetchedAt = 0;
const subscribers = new Set<(items: ConversationSummary[]) => void>();

function publish(items: ConversationSummary[], fresh = false): void {
  conversations = items;
  if (fresh) fetchedAt = Date.now();
  subscribers.forEach((subscriber) => subscriber(items));
}

export function getCachedConversations(): ConversationSummary[] | null {
  return conversations;
}

export function setCachedConversations(items: ConversationSummary[]): void {
  publish(items, true);
}

export function subscribeConversationCache(subscriber: (items: ConversationSummary[]) => void): () => void {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

export function isConversationCacheStale(maxAgeMs = 30_000): boolean {
  return !conversations || Date.now() - fetchedAt > maxAgeMs;
}

export function updateConversationPreview(
  matchId: number,
  preview: string,
  time: string,
  options: { incrementUnread?: boolean; markRead?: boolean } = {}
): void {
  if (!conversations) return;
  const existing = conversations.find((conversation) => conversation.id === matchId);
  if (!existing) return;
  const updated: ConversationSummary = {
    ...existing,
    lastMsg: preview,
    time,
    unread: options.markRead
      ? 0
      : options.incrementUnread
      ? existing.unread + 1
      : existing.unread,
  };
  publish([updated, ...conversations.filter((conversation) => conversation.id !== matchId)]);
}

export function markConversationRead(matchId: number): void {
  if (!conversations) return;
  const next = conversations.map((conversation) =>
    conversation.id === matchId && conversation.unread !== 0
      ? { ...conversation, unread: 0 }
      : conversation
  );
  if (next.some((item, index) => item !== conversations![index])) publish(next);
}

export function clearConversationCache(): void {
  conversations = null;
  fetchedAt = 0;
}
