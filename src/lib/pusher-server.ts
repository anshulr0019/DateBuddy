import Pusher from 'pusher';

/* ─────────────────────────────────────────────────
   Pusher Server Singleton & Real-Time Event Layer
   Dispatches sub-50ms WebSocket events for:
   • Instant message delivery
   • Real-time typing indicators
   • Live read receipts
   • Anonymous radar connection alerts
   • WebRTC incoming call notifications
───────────────────────────────────────────────── */

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

export const isPusherServerConfigured = Boolean(appId && key && secret);

export const pusherServer = isPusherServerConfigured
  ? new Pusher({
      appId: appId!,
      key: key!,
      secret: secret!,
      cluster: cluster!,
      useTLS: true,
    })
  : null;

/**
 * Broadcast an event to a Pusher channel safely
 */
export async function triggerPusherEvent(channel: string, event: string, data: any): Promise<boolean> {
  if (!pusherServer) return false;
  try {
    await pusherServer.trigger(channel, event, data);
    return true;
  } catch (error) {
    console.error(`[PUSHER] Failed to trigger event ${event} on channel ${channel}:`, error);
    return false;
  }
}

/* ── Typed Domain Event Helpers ── */

export async function triggerChatMessage(matchId: number, message: any) {
  return triggerPusherEvent(`chat-${matchId}`, 'new-message', message);
}

export async function triggerTypingIndicator(matchId: number, senderId: number, isTyping: boolean) {
  return triggerPusherEvent(`chat-${matchId}`, 'typing', { senderId, isTyping });
}

export async function triggerReadReceipt(matchId: number, readerId: number) {
  return triggerPusherEvent(`chat-${matchId}`, 'messages-read', { readerId });
}

export async function triggerRandomChatMessage(sessionId: number, message: any) {
  return triggerPusherEvent(`random-session-${sessionId}`, 'random-message', message);
}

export async function triggerRandomChatStatus(sessionId: number, status: string, data?: any) {
  return triggerPusherEvent(`random-session-${sessionId}`, 'status-change', { status, data });
}

export async function triggerCallSignal(matchId: number, receiverId: number, signal: any) {
  return triggerPusherEvent(`call-signal-${matchId}-${receiverId}`, 'signal', signal);
}

/** Triggers a call signal on the user-level global channel — for global incoming call detection */
export async function triggerGlobalCallSignal(receiverId: number, signal: any) {
  return triggerPusherEvent(`call-signal-global-${receiverId}`, 'signal', signal);
}

export async function triggerUserNotification(userId: number, notification: any) {
  return triggerPusherEvent(`user-${userId}`, 'notification', notification);
}
