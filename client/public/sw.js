/* Service worker AFC — coquille d'app installable (PWA).
   Données toujours en ligne : /api, le manifeste et l'icône ne sont jamais mis en cache. */
const CACHE = 'afc-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.add('/')).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Toujours frais (réseau) : API, manifeste, icônes dynamiques.
  if (
    url.pathname.startsWith('/api') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/app-icon' ||
    url.pathname === '/apple-touch-icon'
  ) return;

  // Navigation : réseau d'abord, repli sur la coquille en cache (hors-ligne).
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put('/', cp)); return r; })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // Assets statiques : cache d'abord, sinon réseau (et on met en cache).
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((r) => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
      return r;
    })),
  );
});
