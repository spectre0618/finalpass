const CACHE = 'finalpass-v1';
const STATIC = [
  '/finalpass/',
  '/finalpass/index.html',
  '/finalpass/manifest.json',
  '/finalpass/icon-192.png',
  '/finalpass/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&family=Share+Tech+Mono&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Weather API — network first, no cache (always want live data)
  if (url.hostname.includes('aviationweather') ||
      url.hostname.includes('corsproxy') ||
      url.hostname.includes('allorigins')) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } })
    ));
    return;
  }

  // Everything else — cache first, fall back to network
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
