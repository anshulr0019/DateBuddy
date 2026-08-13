import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { getSessionState } from '@/lib/random-chat-matchmaking';

export const dynamic = 'force-dynamic';

/* The single poll endpoint that drives the whole matchmaking + chat state
   machine: searching (in queue), matched (active/connected session with
   messages), ended (partner left), or none. */
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const state = await getSessionState(session.userId);
    return NextResponse.json({ success: true, ...state });
  } catch (error) {
    console.error('Error polling random chat session:', error);
    return NextResponse.json({ success: false, message: 'Could not load your session.' }, { status: 500 });
  }
}
