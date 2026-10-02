// Retire the previous worker, which cached dynamic pages and API responses.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('mypetsragdoll-')) await caches.delete(name);
    }
    await self.registration.unregister();
    await self.clients.claim();
  })());
});
