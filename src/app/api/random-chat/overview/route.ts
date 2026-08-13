import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getRandomChatOverview, getRandomChatPrefill } from '@/lib/random-chat-matchmaking';

export const dynamic = 'force-dynamic';

/* Powers the Home card with real presence numbers and pre-fills the entry
   screen from the user's stored preferences. */
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const [overview, prefill] = await Promise.all([
      getRandomChatOverview(session.userId),
      getRandomChatPrefill(session.userId),
    ]);
    return NextResponse.json({ success: true, ...overview, prefill });
  } catch (error) {
    console.error('Error loading random chat overview:', error);
    return NextResponse.json({ success: false, message: 'Could not load.' }, { status: 500 });
  }
}
