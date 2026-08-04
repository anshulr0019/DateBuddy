import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, photos, preferences, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { setAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');
  const expectedState = request.cookies.get('oauth_state')?.value;

  if (error || !code) {
    console.error('Google OAuth redirect error:', error);
    return NextResponse.redirect(`${origin}/welcome?error=google_auth_failed`);
  }

  if (!state || !expectedState || state !== expectedState) {
    console.error('Google OAuth state mismatch — possible CSRF');
    return NextResponse.redirect(`${origin}/welcome?error=invalid_state`);
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    console.error('Missing Google OAuth credentials');
    return NextResponse.redirect(`${origin}/welcome?error=missing_credentials`);
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Token exchange failed:', tokenData);
      return NextResponse.redirect(`${origin}/welcome?error=token_exchange_failed`);
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userResponse.json();

    // `sub` is Google's stable, unique account identifier — the only safe join key.
    const googleId = googleUser.sub;
    const { email, name, picture, email_verified: emailVerified } = googleUser;

    if (!googleId || !email || !name || emailVerified === false) {
      console.error('Invalid or unverified Google user data');
      return NextResponse.redirect(`${origin}/welcome?error=invalid_user_data`);
    }

    let [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    let isNewUser = false;

    if (!user) {
      // Link to an existing account that signed up with this same verified email.
      const [byEmail] = await db.select().from(users).where(eq(users.email, email));
      if (byEmail) {
        [user] = await db
          .update(users)
          .set({ googleId, updatedAt: new Date() })
          .where(eq(users.id, byEmail.id))
          .returning();
      }
    }

    if (!user) {
      isNewUser = true;
      const [newUser] = await db
        .insert(users)
        .values({
          phoneNumber: null,
          email,
          googleId,
          name,
          dateOfBirth: new Date('2000-01-01'),
          gender: 'other',
          lookingFor: 'everyone',
          city: '',
          bio: '',
        })
        .returning();

      user = newUser;

      if (picture) {
        await db.insert(photos).values({ userId: user.id, url: picture, orderIndex: 0 });
      }
      await db.insert(preferences).values({ userId: user.id, ageMin: 18, ageMax: 30, distanceMax: 50 });
      await db.insert(subscriptions).values({ userId: user.id, tier: 'free' }).onConflictDoNothing();
    }

    await setAuthSession(user.id, user.phoneNumber ?? '');

    // Send brand-new accounts through onboarding; returning users straight in.
    const destination = isNewUser || !user.city ? '/onboarding/basic-info' : '/discover';
    const response = NextResponse.redirect(new URL(destination, origin));
    response.cookies.delete('oauth_state');
    return response;
  } catch (err) {
    console.error('Google OAuth exception:', err);
    return NextResponse.redirect(`${origin}/welcome?error=oauth_exception`);
  }
}
