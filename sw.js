/* Tra cuu phoi ton kho - service worker
   MOI LAN CAP NHAT DU LIEU: doi 'v1' thanh 'v2', 'v3'... roi tai len lai */
var CACHE = 'phoi-ton-v1';
var CORE = ['./', './index.html', './data.js',
            './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) {
      return c.add(u).catch(function () {});   /* thieu 1 file khong lam hong ca ban cai */
    }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url;
  try { url = new URL(e.request.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  /* trang chinh va du lieu: uu tien ban moi tren mang, mat mang thi dung ban da luu */
  var isPage = e.request.mode === 'navigate'
            || /\/(index\.html)?$/.test(url.pathname)
            || /\/data\.js$/.test(url.pathname);
  if (isPage) {
    e.respondWith(fetch(e.request).then(function (r) {
      if (r && r.ok) {
        var copy = r.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return r;
    }).catch(function () {
      return caches.match(e.request).then(function (r) {
        return r || caches.match('./index.html') || caches.match('./');
      });
    }));
    return;
  }

  e.respondWith(caches.match(e.request).then(function (r) { return r || fetch(e.request); }));
});
