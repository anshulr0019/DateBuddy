'use client';

export interface CachedUserProfile {
  id: number;
  name: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  city?: string | null;
  bio?: string | null;
  dateOfBirth?: string | Date | null;
  gender?: string | null;
  lookingFor?: string | null;
  isVerified?: boolean | null;
  instagramHandle?: string | null;
  snapchatHandle?: string | null;
  profession?: string | null;
  education?: string | null;
  photos?: string[];
  interests?: string[];
  prompts?: { question: string; answer: string }[];
  preferences?: unknown;
  [key: string]: unknown;
}

const PROFILE_MAX_AGE_MS = 5 * 60 * 1000;

let cachedProfile: CachedUserProfile | null = null;
let cachedAt = 0;
let inflight: Promise<CachedUserProfile> | null = null;

export class UserProfileRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export function getCachedUserProfile(): CachedUserProfile | null {
  return cachedProfile;
}

export function isUserProfileCacheFresh(): boolean {
  return Boolean(cachedProfile && Date.now() - cachedAt < PROFILE_MAX_AGE_MS);
}

export function setCachedUserProfile(profile: CachedUserProfile): void {
  cachedProfile = profile;
  cachedAt = Date.now();
}

export function updateCachedUserProfile(patch: Partial<CachedUserProfile>): void {
  if (!cachedProfile) return;
  cachedProfile = { ...cachedProfile, ...patch };
  cachedAt = Date.now();
}

export function invalidateUserProfileCache(): void {
  cachedAt = 0;
}

export function clearUserProfileCache(): void {
  cachedProfile = null;
  cachedAt = 0;
  inflight = null;
}

export function loadUserProfile(options: { force?: boolean } = {}): Promise<CachedUserProfile> {
  if (!options.force && isUserProfileCacheFresh()) return Promise.resolve(cachedProfile!);
  if (inflight) return inflight;

  inflight = fetch('/api/users/me', { cache: 'no-store' })
    .then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !data.user) {
        throw new UserProfileRequestError(data?.message || 'Could not load your profile', res.status);
      }
      const profile = data.user as CachedUserProfile;
      setCachedUserProfile(profile);
      return profile;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
