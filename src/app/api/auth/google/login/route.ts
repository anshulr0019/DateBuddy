import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let origin = request.nextUrl.origin;
  const host = request.headers.get('host') || '';
  if (origin.includes('0.0.0.0') || host.includes('0.0.0.0')) {
    origin = origin.replace('0.0.0.0', 'localhost');
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.redirect(new URL('/welcome?error=missing_google_client_id', origin));
  }

  const state = randomBytes(16).toString('hex');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.append('client_id', clientId);
  googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.append('response_type', 'code');
  googleAuthUrl.searchParams.append('scope', 'openid profile email');
  googleAuthUrl.searchParams.append('state', state);
  googleAuthUrl.searchParams.append('prompt', 'select_account');

  const response = NextResponse.redirect(googleAuthUrl.toString());
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
