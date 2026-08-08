import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Lightweight endpoint — called by the client periodically to keep
// lastActiveAt fresh. No response body needed beyond success flag.
export async function POST() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    await db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, session.userId));

    return NextResponse.json({ success: true });
  } catch {
    // Heartbeat failures are silent — don't break the UX.
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
