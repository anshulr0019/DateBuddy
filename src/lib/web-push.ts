import webpush from 'web-push';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateKey = process.env.VAPID_PRIVATE_KEY!;
const email = process.env.VAPID_EMAIL || 'mailto:hello@infyn.app';

if (publicKey && privateKey) {
  webpush.setVapidDetails(email, publicKey, privateKey);
}

export { webpush };

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  matchId?: number;
  icon?: string;
}

/**
 * Send a push notification to a subscription endpoint.
 * Silently handles expired/invalid subscriptions.
 */
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  if (!publicKey || !privateKey) return false;

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: any) {
    // 404/410 = subscription expired/unsubscribed — caller should delete it
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      throw new Error('SUBSCRIPTION_EXPIRED');
    }
    console.error('[WebPush] Failed to send:', err?.message);
    return false;
  }
}
