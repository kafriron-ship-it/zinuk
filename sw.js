// זינוק service worker: the whole app (page, sounds, fonts, icons) works offline on the water.
// Page: network first with a short timeout, so updates arrive as soon as there is signal.
// Everything else: served from cache instantly and refreshed in the background.
const CACHE = 'zinuk-v2';
const SHELL = [
  './', 'index.html', 'manifest.json',
  'sounds/whistle.mp3', 'sounds/cannon.mp3', 'sounds/bell.mp3',
  'fonts/heebo-hebrew.woff2', 'fonts/heebo-latin.woff2', 'fonts/rubik-hebrew.woff2', 'fonts/rubik-latin.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
  'icons/apple-touch-icon.png', 'icons/favicon-64.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  if (!sameOrigin) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const net = fetch(req).then(res => { if (res.ok) cache.put('index.html', res.clone()); return res; });
      const timeout = new Promise(r => setTimeout(r, 2500, null));
      try { const res = await Promise.race([net, timeout]); if (res) return res; } catch (_) {}
      const hit = await cache.match('index.html');
      if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
      return net;
    })());
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || Response.error();
  })());
});
