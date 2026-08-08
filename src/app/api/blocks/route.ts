import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { blocks, matches, users, photos } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const blockerId = session.userId;

    const blockRows = await db
      .select({ blockedId: blocks.blockedId })
      .from(blocks)
      .where(eq(blocks.blockerId, blockerId));

    if (blockRows.length === 0) {
      return NextResponse.json({ success: true, blocked: [] });
    }

    const blockedIds = blockRows.map((b) => b.blockedId);
    const [blockedUsers, blockedPhotos] = await Promise.all([
      db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, blockedIds)),
      db
        .select({ userId: photos.userId, url: photos.url })
        .from(photos)
        .where(inArray(photos.userId, blockedIds))
        .orderBy(photos.orderIndex),
    ]);

    const photoByUser = new Map<number, string>();
    for (const p of blockedPhotos) {
      if (!photoByUser.has(p.userId)) photoByUser.set(p.userId, p.url);
    }

    const result = blockedUsers.map((u) => ({
      id: u.id,
      name: u.name,
      photo: photoByUser.get(u.id) ?? null,
    }));

    return NextResponse.json({ success: true, blocked: result });
  } catch (error) {
    console.error('Error listing blocks:', error);
    return NextResponse.json({ success: false, message: 'Could not load blocked users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const blockerId = session.userId;

    const body = await request.json();
    const blockedId = Number(body?.blockedUserId);

    if (!Number.isInteger(blockedId) || blockedId <= 0) {
      return NextResponse.json(
        { success: false, message: 'A valid blockedUserId is required' },
        { status: 400 }
      );
    }
    if (blockedId === blockerId) {
      return NextResponse.json(
        { success: false, message: 'You cannot block yourself' },
        { status: 400 }
      );
    }

    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, blockedId));
    if (!target) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // The blocks table has no unique constraint, so guard against duplicate rows.
    const [existing] = await db
      .select({ id: blocks.id })
      .from(blocks)
      .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)));

    if (!existing) {
      await db.insert(blocks).values({ blockerId, blockedId });
    }

    // Blocking must also tear down any existing match so neither side can keep messaging.
    await db
      .update(matches)
      .set({ isActive: false })
      .where(
        and(
          eq(matches.user1Id, Math.min(blockerId, blockedId)),
          eq(matches.user2Id, Math.max(blockerId, blockedId))
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating block:', error);
    return NextResponse.json(
      { success: false, message: 'Could not block user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const blockerId = session.userId;

    const body = await request.json();
    const blockedId = Number(body?.blockedUserId);

    if (!Number.isInteger(blockedId) || blockedId <= 0) {
      return NextResponse.json({ success: false, message: 'A valid blockedUserId is required' }, { status: 400 });
    }

    await db
      .delete(blocks)
      .where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing block:', error);
    return NextResponse.json({ success: false, message: 'Could not unblock user' }, { status: 500 });
  }
}
