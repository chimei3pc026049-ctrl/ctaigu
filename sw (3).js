/* 持股操作帳本 — Service Worker
   策略:網路優先(network-first),離線時回退快取。
   每次改版請把 CACHE 版本號 +1,以強制更新。 */
var CACHE = 'stk-ledger-v2';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = e.request.url;
  // API 請求(Apps Script)一律走網路,不快取
  if (url.indexOf('script.google.com') >= 0 || url.indexOf('googleusercontent.com') >= 0) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.status === 200 && e.request.url.indexOf('http') === 0) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (m) { return m || caches.match('./index.html'); });
    })
  );
});
