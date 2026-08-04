import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { reports, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const REPORT_REASONS = ['inappropriate', 'spam', 'harassment', 'photos', 'fake', 'other'] as const;
type ReportReason = (typeof REPORT_REASONS)[number];

const MAX_DETAILS_LENGTH = 1000;

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const reporterId = session.userId;

    const body = await request.json();
    const reportedId = Number(body?.reportedUserId);
    const reason = body?.reason;
    const details = typeof body?.details === 'string' ? body.details.trim().slice(0, MAX_DETAILS_LENGTH) : null;

    if (!Number.isInteger(reportedId) || reportedId <= 0) {
      return NextResponse.json(
        { success: false, message: 'A valid reportedUserId is required' },
        { status: 400 }
      );
    }
    if (reportedId === reporterId) {
      return NextResponse.json(
        { success: false, message: 'You cannot report yourself' },
        { status: 400 }
      );
    }
    if (!REPORT_REASONS.includes(reason as ReportReason)) {
      return NextResponse.json({ success: false, message: 'Invalid report reason' }, { status: 400 });
    }

    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, reportedId));
    if (!target) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    await db.insert(reports).values({
      reporterId,
      reportedId,
      reason: reason as ReportReason,
      details: details || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { success: false, message: 'Could not submit report' },
      { status: 500 }
    );
  }
}
