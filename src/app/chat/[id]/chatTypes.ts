/* Shared types for the chat screen. */

export type SendStatus = 'sending' | 'queued' | 'failed' | 'sent' | 'seen';

/* Mirrors the server's message type enum. */
export type MessageKind = 'text' | 'photo' | 'gif' | 'voice' | 'location';

export interface ReplyTarget {
  id: string;
  senderName: string;
  content: string;
  type: MessageKind;
}

export interface ChatMessage {
  id: string;
  senderId: number;
  type: MessageKind;
  /* Text body, image/audio URL for media, or place text for 'location'. */
  content: string;
  createdAt: string;
  /* Only present on the current user's own messages. */
  status?: SendStatus;
  metadata?: {
    durationSec?: number;
    reactions?: Record<string, string>;
    replyTo?: ReplyTarget;
    [key: string]: any;
  } | null;
}

export interface Partner {
  matchId: number;
  partnerId: number;
  name: string;
  photo: string | null;
  verified: boolean;
  online?: boolean;
  lastActiveAt?: string | null;
}
