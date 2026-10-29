/**
 * @file sw.js
 * مشغل خدمة PWA لتطبيق المفاهيم القانونية
 * يتيح تثبيت التطبيق على الأجهزة، ويسرّع تحميل الخطوط والأيقونات، مع الحفاظ على حداثة طلبات الـ API
 */

const CACHE_NAME = 'lc-attendance-v1'

// الأصول الثابتة الأساسية للواجهة
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
]

// 1. مرحلة التثبيت: حفظ الأصول الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // تجاهل أخطاء كاش بعض الملفات أثناء التطوير المحلي
        console.warn('[SW] Caching non-critical static assets skipped:', err)
      })
    })
  )
  self.skipWaiting()
})

// 2. مرحلة التنشيط: مسح أي كاش قديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// 3. معالجة الطلبات:
// - مسارات الـ API: استراتيجية Network First (تجاوز الكاش لجلب أحدث البيانات الحية دائماً)
// - الأصول الثابتة (الخطوط والأيقونات والصور): استراتيجية Cache First مع Network Fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // لا نتدخل في طلبات غير الـ GET أو طلبات الـ API أو الاستعلامات الديناميكية
  if (request.method !== 'GET' || url.pathname.startsWith('/api')) {
    return
  }

  // للأصول الثابتة (الصور والخطوط وملفات css/js)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // تحديث الكاش في الخلفية (Stale-while-revalidate)
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse))
          }
        }).catch(() => {/* وضع عدم الاتصال */})

        return cachedResponse
      }

      // إذا لم يكن في الكاش، جلبه من الشبكة وحفظه
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse
        }

        const responseToCache = networkResponse.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache)
        })

        return networkResponse
      }).catch(() => {
        // العودة لصفحة البداية إذا انقطع الاتصال تماماً
        if (request.mode === 'navigate') {
          return caches.match('/')
        }
      })
    })
  )
})

