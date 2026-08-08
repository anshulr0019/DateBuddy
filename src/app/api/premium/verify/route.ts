import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PLAN_DURATION_DAYS: Record<string, number> = {
  daily:   1,
  weekly:  7,
  monthly: 30,
};

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } =
      await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return NextResponse.json(
        { success: false, message: 'Missing payment verification fields.' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { success: false, message: 'Payment gateway not configured.' },
        { status: 503 }
      );
    }

    // Verify the Razorpay signature — this is the critical security check.
    // The signature is HMAC-SHA256 of "<orderId>|<paymentId>" using the key secret.
    const expectedSignature = createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Payment verification failed. Signature mismatch.' },
        { status: 400 }
      );
    }

    // Signature valid — activate the subscription.
    const durationDays = PLAN_DURATION_DAYS[planId] ?? 30;
    const now = new Date();
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await db
      .insert(subscriptions)
      .values({
        userId:        session.userId,
        tier:          planId as 'daily' | 'weekly' | 'monthly',
        startDate:     now,
        endDate,
        autoRenew:     false,
        transactionId: razorpay_payment_id,
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          tier:          planId as 'daily' | 'weekly' | 'monthly',
          startDate:     now,
          endDate,
          autoRenew:     false,
          transactionId: razorpay_payment_id,
        },
      });

    return NextResponse.json({
      success: true,
      message: 'Subscription activated!',
      expiresAt: endDate.toISOString(),
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, message: 'Could not verify payment. Contact support.' },
      { status: 500 }
    );
  }
}
