/* =============================================
   Infyn Service Worker — Push Notifications
   ============================================= */

const CACHE_NAME = 'infyn-v1';

/* ── Install & Activate ── */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* ── Push Event — fires even when app is closed ── */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Infyn', body: event.data.text() };
  }

  const title = payload.title || 'Infyn';
  const options = {
    body: payload.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || 'infyn-notification',
    renotify: true,
    data: {
      url: payload.url || '/messages',
      matchId: payload.matchId,
    },
    vibrate: [100, 50, 100],
    actions: payload.actions || [],
  };

  event.waitUntil((async () => {
    if (payload.silentWhenVisible) {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (windows.some((client) => client.visibilityState === 'visible')) return;
    }
    await self.registration.showNotification(title, options);
  })());
});

/* ── Notification Click — open / focus the app tab ── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/messages';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing tab if open
        for (const client of clientList) {
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === new URL(targetUrl, self.location.origin).pathname) {
            return client.focus();
          }
        }
        // Open a new window/tab
        return self.clients.openWindow(targetUrl);
      })
  );
});
