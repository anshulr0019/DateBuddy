/* Shared types for the chat screen. */

export type SendStatus = 'sending' | 'queued' | 'failed' | 'sent' | 'seen';

/* Mirrors the server's message type enum. */
export type MessageKind = 'text' | 'photo' | 'gif' | 'voice' | 'location';

export interface ChatMessage {
  id: string;
  senderId: number;
  type: MessageKind;
  /* Text body for 'text', image URL for 'photo'/'gif', place text for 'location'. */
  content: string;
  createdAt: string;
  /* Only present on the current user's own messages. */
  status?: SendStatus;
}

export interface Partner {
  matchId: number;
  partnerId: number;
  name: string;
  photo: string | null;
  verified: boolean;
}
