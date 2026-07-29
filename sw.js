const CACHE_NAME = 'vocal-groans-v1';
const assetsToCache = [
  './index.html',
  './manifest.json'
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

// تفعيل الخدمة وحذف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// جلب الملفات (Fetch Strategy)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    }).catch(() => {
      // التعامل مع حالة أوفلاين
    })
  );
});

// استقبال وإظهار الإشعارات الفعلية (Push Notifications)
self.addEventListener('push', event => {
  let title = 'آهات صوتية';
  let body = 'يوجد محتوى صوتي جديد بانتظارك!';
  let icon = 'https://file.garden/aluU_B9tLXBUY8kP/%D8%B4%D8%B9%D8%A7%D8%B1%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B5%D9%88%D8%B1/T401785315620882.png';

  if (event.data) {
    try {
      const payload = event.data.json();
      
      // استخراج العنوان والوصف وسحب بيانات OneSignal بشكل صحيح
      if (payload.title) title = payload.title;
      if (payload.body) body = payload.body;
      if (payload.custom && payload.custom.a && payload.custom.a.body) {
        body = payload.custom.a.body;
      } else if (payload.alert) {
        body = payload.alert;
      }
      if (payload.icon) icon = payload.icon;
    } catch (e) {
      body = event.data.text();
    }
  }

  const options = {
    body: body,
    icon: icon,
    badge: icon,
    dir: 'rtl',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// التفاعل عند النقر على الإشعار وفتح التطبيق
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
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
