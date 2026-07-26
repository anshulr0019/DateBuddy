import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, matches } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json(
        { success: false, message: 'matchId is required' },
        { status: 400 }
      );
    }

    const conversation = await db.select()
      .from(messages)
      .where(eq(messages.matchId, parseInt(matchId)))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({
      success: true,
      messages: conversation,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const currentUserId = session?.userId || 1;

    const { matchId, content, type = 'text' } = await request.json();

    if (!matchId || !content) {
      return NextResponse.json(
        { success: false, message: 'matchId and content are required' },
        { status: 400 }
      );
    }

    // Verify match exists
    const [match] = await db.select().from(matches).where(eq(matches.id, parseInt(matchId)));
    if (!match) {
      return NextResponse.json(
        { success: false, message: 'Match not found' },
        { status: 404 }
      );
    }

    const receiverId = match.user1Id === currentUserId ? match.user2Id : match.user1Id;

    const [newMessage] = await db.insert(messages).values({
      matchId: parseInt(matchId),
      senderId: currentUserId,
      receiverId,
      content,
      type,
    }).returning();

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}
