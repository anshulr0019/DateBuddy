'use client';

import { useEffect } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers the Infyn service worker and subscribes the browser to Web Push.
 * Call this hook inside any authenticated page/component.
 * It's safe to call multiple times — it deduplicates via localStorage.
 */
export function usePushNotifications() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!VAPID_PUBLIC_KEY) return;

    // Don't spam the server — only re-register if not done in the last 7 days
    const lastRegistered = localStorage.getItem('infyn_push_registered_at');
    if (lastRegistered && Date.now() - Number(lastRegistered) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    async function registerPush() {
      try {
        // 1. Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // 2. Request permission (no-op if already granted/denied)
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // 3. Subscribe to push
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });

        // 4. Send subscription to server
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        });

        if (res.ok) {
          localStorage.setItem('infyn_push_registered_at', String(Date.now()));
        }
      } catch (err) {
        console.warn('[Push] Registration failed:', err);
      }
    }

    registerPush();
  }, []);
}
