'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; userId: number; name: string | null };

const AUTH_CACHE_MS = 5 * 60 * 1000;

let cachedAuth: AuthState | null = null;
let cachedAt = 0;
let authRequest: Promise<AuthState> | null = null;
const subscribers = new Set<(auth: AuthState) => void>();

function publish(auth: AuthState) {
  cachedAuth = auth;
  cachedAt = Date.now();
  subscribers.forEach((subscriber) => subscriber(auth));
}

function loadCurrentUser(): Promise<AuthState> {
  const cacheIsFresh =
    cachedAuth?.status === 'authenticated' && Date.now() - cachedAt < AUTH_CACHE_MS;
  if (cacheIsFresh) return Promise.resolve(cachedAuth!);
  if (authRequest) return authRequest;

  authRequest = fetch('/api/auth/me', { cache: 'no-store' })
    .then(async (res): Promise<AuthState> => {
      if (res.status === 401) return { status: 'unauthenticated' };
      const data = await res.json();
      if (res.ok && data.success && data.user?.id) {
        return {
          status: 'authenticated',
          userId: data.user.id,
          name: data.user.name ?? null,
        };
      }
      return { status: 'unauthenticated' };
    })
    .catch((): AuthState => ({ status: 'unauthenticated' }))
    .then((auth) => {
      publish(auth);
      return auth;
    })
    .finally(() => {
      authRequest = null;
    });

  return authRequest;
}

/*
 * Resolves the logged-in user once and shares the result across every mounted
 * consumer. Route changes retry an unauthenticated result so a client-side
 * login immediately wakes root listeners without duplicating requests.
 */
export function useCurrentUser(): AuthState {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthState>(() => cachedAuth ?? { status: 'loading' });

  useEffect(() => {
    let active = true;
    const handleAuth = (next: AuthState) => {
      if (active) setAuth(next);
    };
    subscribers.add(handleAuth);

    const cacheIsFresh =
      cachedAuth?.status === 'authenticated' && Date.now() - cachedAt < AUTH_CACHE_MS;
    if (cacheIsFresh) {
      setAuth(cachedAuth!);
    } else {
      void loadCurrentUser();
    }

    return () => {
      active = false;
      subscribers.delete(handleAuth);
    };
  }, [pathname]);

  return auth;
}
