// 1. استيراد سكريبت OneSignal الرسمي ليعمل في نفس السيرفيس وركر
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

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

      // قراءة العنوان من OneSignal أو البيانات العادية
      if (payload.title) title = payload.title;
      else if (payload.heading) title = payload.heading;
      else if (payload.custom && payload.custom.a && payload.custom.a.title) title = payload.custom.a.title;

      // قراءة الوصف من جميع هياكل OneSignal الممكنة
      if (payload.body) {
        body = payload.body;
      } else if (payload.alert) {
        body = payload.alert;
      } else if (payload.custom && payload.custom.a && payload.custom.a.body) {
        body = payload.custom.a.body;
      } else if (payload.custom && payload.custom.a && payload.custom.a.alert) {
        body = payload.custom.a.alert;
      } else if (payload.custom && payload.custom.a && payload.custom.a.message) {
        body = payload.custom.a.message;
      } else if (payload.additionalData && payload.additionalData.body) {
        body = payload.additionalData.body;
      }

      // قراءة الأيقونة
      if (payload.icon) icon = payload.icon;
      else if (payload.custom && payload.custom.a && payload.custom.a.icon) icon = payload.custom.a.icon;

    } catch (e) {
      if (event.data.text()) {
        body = event.data.text();
      }
    }
  }

  // الضمان النهائي لخروج وصف دائمًا
  if (!body || body.trim() === '') {
    body = 'يوجد محتوى جديد بانتظارك!';
  }

  const options = {
    body: body,
    icon: icon,
    badge: icon,
    dir: 'rtl',
    vibrate: [200, 100, 200]
  };

  // التأكد من عدم تكرار الإشعار إن قامت مكتبة OneSignal بعرضه تلقائيًا
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
