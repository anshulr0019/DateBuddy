import { createHash } from 'crypto';

export function normalizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const digits = input.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

export function hashOtp(phoneNumber: string, code: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET must be set');
  return createHash('sha256').update(`${phoneNumber}:${code}:${secret}`).digest('hex');
}
