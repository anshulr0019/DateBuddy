import { cookies } from 'next/headers';

export async function setAuthSession(userId: number, phoneNumber: string) {
  const cookieStore = await cookies();
  const sessionData = JSON.stringify({ userId, phoneNumber, time: Date.now() });
  const encodedToken = Buffer.from(sessionData).toString('base64');

  cookieStore.set('auth_token', encodedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export async function getAuthSession(): Promise<{ userId: number; phoneNumber: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    if (data && data.userId) {
      return { userId: Number(data.userId), phoneNumber: data.phoneNumber };
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}
