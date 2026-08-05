import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { verifications } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [latest] = await db
      .select()
      .from(verifications)
      .where(eq(verifications.userId, session.userId))
      .orderBy(desc(verifications.createdAt))
      .limit(1);

    return NextResponse.json({
      success: true,
      verification: latest
        ? { status: latest.status, submittedAt: latest.createdAt, verifiedAt: latest.verifiedAt }
        : null,
    });
  } catch (error) {
    console.error('Error loading verification:', error);
    return NextResponse.json(
      { success: false, message: 'Could not load verification status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.userId;

  let videoUrl: string | null = null;
  try {
    const body = await request.json();
    if (typeof body?.videoUrl === 'string' && body.videoUrl.trim()) {
      videoUrl = body.videoUrl.trim();
    }
  } catch {
    /* body is optional — a submission with no capture is still a valid request */
  }

  try {
    const [existing] = await db
      .select()
      .from(verifications)
      .where(eq(verifications.userId, userId))
      .orderBy(desc(verifications.createdAt))
      .limit(1);

    if (existing?.status === 'pending') {
      return NextResponse.json(
        { success: true, status: 'pending', message: 'Your verification is already under review' },
        { status: 200 }
      );
    }
    if (existing?.status === 'verified') {
      return NextResponse.json({ success: true, status: 'verified', message: 'You are already verified' });
    }

    await db.insert(verifications).values({ userId, videoUrl, status: 'pending' });

    return NextResponse.json({
      success: true,
      status: 'pending',
      message: 'Verification submitted — our team will review it shortly',
    });
  } catch (error) {
    console.error('Error submitting verification:', error);
    return NextResponse.json(
      { success: false, message: 'Could not submit your verification' },
      { status: 500 }
    );
  }
}
