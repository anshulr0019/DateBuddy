'use client';

import { useEffect, useState } from 'react';

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; userId: number; name: string | null };

/* Resolves the logged-in user from the session cookie via /api/auth/me. */
export function useCurrentUser(): AuthState {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch('/api/auth/me', { signal: controller.signal });
        if (res.status === 401) {
          setAuth({ status: 'unauthenticated' });
          return;
        }
        const data = await res.json();
        if (res.ok && data.success && data.user?.id) {
          setAuth({ status: 'authenticated', userId: data.user.id, name: data.user.name ?? null });
        } else {
          setAuth({ status: 'unauthenticated' });
        }
      } catch (err) {
        if (!controller.signal.aborted) setAuth({ status: 'unauthenticated' });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  return auth;
}
