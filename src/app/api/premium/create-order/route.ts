import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Plan definitions — amounts in paise (1 INR = 100 paise)
const PLANS = {
  daily:   { amount: 4900,   durationDays: 1  },
  weekly:  { amount: 29900,  durationDays: 7  },
  monthly: { amount: 99900,  durationDays: 30 },
} as const;

type PlanId = keyof typeof PLANS;

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await request.json();
    if (!planId || !(planId in PLANS)) {
      return NextResponse.json(
        { success: false, message: 'Invalid plan. Choose daily, weekly, or monthly.' },
        { status: 400 }
      );
    }

    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { success: false, message: 'Payment gateway not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment.' },
        { status: 503 }
      );
    }

    const plan = PLANS[planId as PlanId];

    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await client.orders.create({
      amount:   plan.amount,
      currency: 'INR',
      receipt:  `user_${session.userId}_${planId}_${Date.now()}`,
      notes: {
        userId: String(session.userId),
        planId,
        durationDays: String(plan.durationDays),
      },
    });

    return NextResponse.json({
      success:      true,
      orderId:      order.id,
      amount:       plan.amount,
      currency:     'INR',
      keyId,
      planId,
      durationDays: plan.durationDays,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { success: false, message: 'Could not create payment order. Please try again.' },
      { status: 500 }
    );
  }
}
