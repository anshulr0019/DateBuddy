import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber || phoneNumber.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Valid 10-digit phone number is required' },
        { status: 400 }
      );
    }

    // In production, this connects to Twilio or Firebase SMS service.
    // For development & demo, code 1234 or any 4 digits is accepted.
    console.log(`[AUTH] OTP requested for ${phoneNumber}. Code: 1234`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      debugCode: '1234',
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
