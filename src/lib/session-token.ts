import { jwtVerify } from 'jose';

export const COOKIE_NAME = 'auth_token';
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type Session = { userId: number; phoneNumber: string; onboardingComplete: boolean };

// Kept free of `next/headers` so middleware can import it on the edge runtime.
export function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set to a random string of at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export async function verifyAuthToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) return null;
    return {
      userId,
      phoneNumber: String(payload.phoneNumber ?? ''),
      onboardingComplete: payload.onboardingComplete === true,
    };
  } catch {
    return null;
  }
}
