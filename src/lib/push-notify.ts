import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendPushNotification, type PushPayload } from '@/lib/web-push';

/**
 * Deliver a Web Push notification to ALL subscribed devices of a user.
 * Automatically cleans up expired subscriptions.
 * Non-throwing — failures are logged but never bubble up to callers.
 */
export async function pushNotifyUser(userId: number, payload: PushPayload): Promise<void> {
  try {
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subs.length === 0) return;

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await sendPushNotification(
            { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
            payload
          );
        } catch (err: any) {
          if (err?.message === 'SUBSCRIPTION_EXPIRED') {
            // Clean up stale subscription
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.endpoint, sub.endpoint))
              .catch(() => {});
          }
        }
      })
    );
  } catch (err) {
    console.error('[pushNotifyUser] Error:', err);
  }
}
