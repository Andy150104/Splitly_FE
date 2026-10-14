/* Cache only the public offline screen. Always fetch real pages from the network. */
const OFFLINE_CACHE = 'splitly-offline-v2'
const OFFLINE_ASSETS = [
  '/offline.html',
  '/offline.css',
  '/offline-fonts/be-vietnam-pro-latin-400-normal.woff2',
  '/offline-fonts/be-vietnam-pro-vietnamese-400-normal.woff2',
  '/offline-fonts/barlow-condensed-latin-700-normal.woff2',
  '/offline-fonts/barlow-condensed-vietnamese-700-normal.woff2',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then(async (cache) => {
      await cache.addAll(OFFLINE_ASSETS)
      await self.skipWaiting()
    }),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith('splitly-offline-') && key !== OFFLINE_CACHE)
          .map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(OFFLINE_CACHE)
        return (await cache.match('/offline.html')) || Response.error()
      }),
    )
  } else if (OFFLINE_ASSETS.includes(url.pathname)) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(OFFLINE_CACHE)
        return (await cache.match(url.pathname)) || Response.error()
      }),
    )
  }
})
