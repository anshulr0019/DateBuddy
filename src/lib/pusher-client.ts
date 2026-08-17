'use client';

import PusherClient from 'pusher-js';

/* ─────────────────────────────────────────────────
   Pusher Client Singleton
   Provides browser-side WebSocket connection for instant
   sub-50ms chat updates, typing indicators, and presence.
───────────────────────────────────────────────── */

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

export const isPusherClientConfigured = Boolean(pusherKey);

let clientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === 'undefined') return null;
  if (!isPusherClientConfigured) return null;

  if (!clientInstance) {
    clientInstance = new PusherClient(pusherKey!, {
      cluster: pusherCluster,
      forceTLS: true,
    });
  }

  return clientInstance;
}
