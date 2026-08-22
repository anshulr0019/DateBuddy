'use client';

import PusherClient from "pusher-js";

/* ─────────────────────────────────────────────────
   Pusher Client Singleton
   Provides browser-side WebSocket connection for instant
   sub-50ms chat updates, typing indicators, and presence.
───────────────────────────────────────────────── */

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "40ad308486e4c124933f";
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

export const isPusherClientConfigured = Boolean(PUSHER_KEY);

let clientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;

  if (!clientInstance) {
    clientInstance = new PusherClient(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
    });
  }

  return clientInstance;
}
