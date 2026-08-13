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

    // Rate limit: one code per minute per number.
    const recent = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phoneNumber, normalized),
          gt(otpCodes.createdAt, new Date(Date.now() - RESEND_COOLDOWN_MS))
        )
      );

    if (recent.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Please wait a minute before requesting another code' },
        { status: 429 }
      );
    }

    // Invalidate any outstanding codes for this number.
    await db
      .update(otpCodes)
      .set({ consumedAt: new Date() })
      .where(and(eq(otpCodes.phoneNumber, normalized), isNull(otpCodes.consumedAt)));

    await db.insert(otpCodes).values({
      phoneNumber: normalized,
      codeHash: hashOtp(normalized, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    if (!(await sendSms(normalized, code))) {
      return NextResponse.json(
        { success: false, message: 'Could not send verification code. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Could not send verification code. Please try again.' },
      { status: 500 }
    );
  }
}

async function sendSms(phoneNumber: string, code: string): Promise<boolean> {
  // 1. Try Fast2SMS (popular, instant free credits for India)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      const res = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&route=otp&variables_values=${code}&flash=0&numbers=${phoneNumber}`);
      const data = await res.json();
      if (data?.return) {
        console.log(`[AUTH] Fast2SMS real OTP sent successfully to +91${phoneNumber}`);
        return true;
      } else {
        console.error('[AUTH] Fast2SMS send failed:', data?.message || data);
      }
    } catch (err) {
      console.error('[AUTH] Fast2SMS network error:', err);
    }
  }

  // 2. Try 2Factor SMS API
  const twoFactorKey = process.env.TWOFACTOR_API_KEY;
  if (twoFactorKey) {
    try {
      const res = await fetch(`https://2factor.in/API/V1/${twoFactorKey}/SMS/${phoneNumber}/${code}/AUTOGEN`);
      const data = await res.json();
      if (data?.Status === 'Success') {
        console.log(`[AUTH] 2Factor real OTP sent successfully to +91${phoneNumber}`);
        return true;
      } else {
        console.error('[AUTH] 2Factor send failed:', data?.Details);
      }
    } catch (err) {
      console.error('[AUTH] 2Factor network error:', err);
    }
  }

  // 3. Try Twilio
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (sid && token && from) {
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: `+91${phoneNumber}`,
          From: from,
          Body: `Your DateBuddy verification code is ${code}. It expires in 5 minutes.`,
        }),
      });

      if (res.ok) {
        console.log(`[AUTH] Twilio real OTP sent successfully to +91${phoneNumber}`);
        return true;
      } else {
        console.error('[AUTH] Twilio send failed:', res.status, await res.text());
      }
    } catch (err) {
      console.error('[AUTH] Twilio network error:', err);
    }
  }

  // 4. Local Development Fallback
  if (process.env.OTP_DEV_LOG === 'true') {
    console.log(`[AUTH][dev] Real SMS Gateway keys missing. OTP for ${phoneNumber} is ${code}`);
    return true;
  }

  console.error('[AUTH] No valid SMS provider key (FAST2SMS_API_KEY, TWOFACTOR_API_KEY, or TWILIO) configured.');
  return false;
}

