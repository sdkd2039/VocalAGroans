// sw.js - Service Worker with Custom Notification Icon & OneSignal
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

const CACHE_NAME = 'vocal-groans-v3';
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

// معالج الإشعارات لفرض ظهور الشعار الخاص بك بشكل دقيق ودائري
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || data.heading || 'آهات صوتية';
    const body = data.body || data.alert || 'يوجد محتوى صوتي جديد بانتظارك!';
    
    // رابط الشعار الخاص بك المفضل
    const customIcon = 'https://file.garden/aluU_B9tLXBUY8kP/%D8%B4%D8%B9%D8%A7%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B5%D9%88%D8%B1/T401785315620882.png';

    const options = {
      body: body,
      icon: customIcon,
      badge: customIcon, // الأيقونة الصغيرة في شريط الحالة
      dir: 'rtl',
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (e) {
    // في حال كانت البيانات نصية بحتة
    const textBody = event.data.text();
    const customIcon = 'https://file.garden/aluU_B9tLXBUY8kP/%D8%B4%D8%B9%D8%A7%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B5%D9%88%D8%B1/T401785315620882.png';
    
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
