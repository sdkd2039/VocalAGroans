// sw.js - Service Worker with Custom Notification Icon & OneSignal
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_NAME = 'vocal-groans-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (
    requestUrl.hostname.includes('onesignal.com') ||
    requestUrl.pathname.includes('OneSignalSDKWorker.js')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

// معالج الإشعارات باستخدام رابط الشعار المباشر من جيت هاب
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const customIcon = 'https://raw.githubusercontent.com/sdkd2039/VocalAGroans/refs/heads/main/T401785315620882.png';

  try {
    const data = event.data.json();
    const title = data.title || data.heading || 'آهات صوتية';
    const body = data.body || data.alert || 'يوجد محتوى صوتي جديد بانتظارك!';

    const options = {
      body: body,
      icon: customIcon,
      badge: customIcon,
      dir: 'rtl',
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (e) {
    const textBody = event.data.text();

    event.waitUntil(
      self.registration.showNotification('آهات صوتية', {
        body: textBody,
        icon: customIcon,
        badge: customIcon,
        dir: 'rtl'
      })
    );
  }
});

// التفاعل عند النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html');
      }
    })
  );
});
