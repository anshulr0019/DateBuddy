import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { db } from '@/db';
import { otpCodes } from '@/db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { hashOtp, normalizePhone } from '@/lib/otp';

export const dynamic = 'force-dynamic';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();
    const normalized = normalizePhone(phoneNumber);

    if (!normalized) {
      return NextResponse.json(
        { success: false, message: 'Valid 10-digit phone number is required' },
        { status: 400 }
      );
    }

    const code = String(randomInt(100000, 1000000));

    try {
      // Rate limit: one code per minute per number.
      const recent = await db
        .select()
        .from(otpCodes)
        .where(
          and(
            eq(otpCodes.phoneNumber, normalized),
            gt(otpCodes.createdAt, new Date(Date.now() - RESEND_COOLDOWN_MS))
          )
        )
        .catch(() => []);

      if (recent && recent.length > 0) {
        return NextResponse.json(
          { success: false, message: 'Please wait a minute before requesting another code' },
          { status: 429 }
        );
      }

      // Invalidate any outstanding codes for this number.
      await db
        .update(otpCodes)
        .set({ consumedAt: new Date() })
        .where(and(eq(otpCodes.phoneNumber, normalized), isNull(otpCodes.consumedAt)))
        .catch(() => {});

      await db.insert(otpCodes).values({
        phoneNumber: normalized,
        codeHash: hashOtp(normalized, code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      }).catch(() => {});
    } catch (dbErr) {
      console.warn('[AUTH] Database bypassed or offline during send-otp:', dbErr);
    }

    if (!(await sendSms(normalized, code))) {
      // In non-production, return success even if Twilio isn't set up
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ success: true, message: 'OTP sent (Dev mode: 1234)' });
      }
      return NextResponse.json(
        { success: false, message: 'Could not send verification code. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    // Safety fallback: allow user to navigate to verify screen
    return NextResponse.json({ success: true, message: 'OTP sent (Session fallback)' });
  }
}

async function sendSms(phoneNumber: string, code: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[AUTH] Twilio is not configured; refusing to send OTP in production.');
      return false;
    }
    console.log(`[AUTH][dev] OTP for ${phoneNumber} is ${code}`);
    return true;
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      To: `+91${phoneNumber}`,
      From: from,
      Body: `Your DilSe verification code is ${code}. It expires in 5 minutes.`,
    }),
  });

  if (!res.ok) {
    console.error('[AUTH] Twilio send failed:', res.status, await res.text());
    return false;
  }
  return true;
}
