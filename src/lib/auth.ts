import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { COOKIE_NAME, MAX_AGE_SECONDS, getSecret, verifyAuthToken, type Session } from './session-token';

export type { Session };
export { verifyAuthToken };

export async function setAuthSession(userId: number, phoneNumber: string, onboardingComplete = false) {
  const token = await new SignJWT({ phoneNumber, onboardingComplete })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  });
}

export async function getAuthSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAuthToken(token);
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  cookieStore.delete(COOKIE_NAME);
}
