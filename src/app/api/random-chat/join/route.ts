import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { joinRandomChat, type RandomChatPreferences } from '@/lib/random-chat-matchmaking';
import { rateLimitHit } from '@/lib/rate-limit';
import { RANDOM_CHAT_VIBES, GENDER_PREFS } from '@/lib/random-chat-config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (!rateLimitHit(session.userId, 'join')) {
      return NextResponse.json(
        { success: false, message: 'You are moving too fast. Take a breath, then try again.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const vibe = typeof body?.vibe === 'string' && RANDOM_CHAT_VIBES.includes(body.vibe as never) ? body.vibe : 'random';
    const ageMin = Math.max(18, Math.min(60, Number(body?.ageMin) || 18));
    const ageMax = Math.max(ageMin, Math.min(70, Number(body?.ageMax) || 30));
    const genderPref =
      typeof body?.genderPref === 'string' && GENDER_PREFS.includes(body.genderPref as never)
        ? body.genderPref
        : 'everyone';
    const interests = Array.isArray(body?.interests)
      ? body.interests.filter((i: unknown): i is string => typeof i === 'string').slice(0, 50)
      : [];

    const prefs: RandomChatPreferences = { vibe, ageMin, ageMax, genderPref, interests };
    const status = await joinRandomChat(session.userId, prefs);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error joining random chat:', error);
    return NextResponse.json(
      { success: false, message: 'Could not start the search. Please try again.' },
      { status: 500 }
    );
  }
}
