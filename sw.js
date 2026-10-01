// Service worker của bản web app. Chiến lược "mạng trước, bộ nhớ đệm dự phòng":
// có mạng thì luôn lấy bản mới nhất từ GitHub (nên đẩy bản mới lên là điện thoại nhận được), mất mạng thì mở bản đã lưu.
// Chỉ xử lý file cùng nguồn; lời gọi dữ liệu tới Apps Script và thư viện CDN đi thẳng ra mạng, không qua đây.
const VERSION = 'crm-web-20261001-131036';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      const copy = res.clone();
      caches.open(VERSION).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (m) { return m || caches.match('./index.html'); });
    })
  );
});
