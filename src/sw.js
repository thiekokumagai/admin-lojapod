import { precacheAndRoute } from 'workbox-precaching';


self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen to SKIP_WAITING message sent by pwa-register
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Precaching using Workbox
precacheAndRoute(self.__WB_MANIFEST || []);

// Listen to Push event
self.addEventListener('push', (event) => {
  if (event.data) {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Nova notificação', body: event.data.text() };
    }
    let iconUrl = '/favicon-192x192.png';
    if (data.data && data.data.icon) {
      iconUrl = data.data.icon;
    }

    const options = {
      body: data.body,
      icon: iconUrl,
      data: data.data || {},
      vibrate: [100, 50, 100],
    };
    event.waitUntil(self.registration.showNotification(data.title || 'Loja Pod', options));
  }
});

// Listen to Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  let targetUrl = '/pedidos';

  if (notificationData.url) {
    targetUrl = notificationData.url;
  } else if (notificationData.orderId) {
    targetUrl = `/pedidos/${notificationData.orderId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      let client = windowClients.find((c) => c.visibilityState === 'visible') || windowClients[0];
      if (client) {
        client.navigate(targetUrl);
        client.focus();
      } else {
        clients.openWindow(targetUrl);
      }
    })
  );
});

