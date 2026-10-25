// Service worker: keeps the app usable on a flaky or missing connection.
// - build assets, fonts and icons: cache first (file names are hashed or never change);
// - pages, Next.js data and API GETs: network first with a timeout, the last copy when offline;
// - a navigation with no copy at all gets /offline.html.
// The API origin comes from the registration URL (`/sw.js?api=<origin>`).
// Bump VERSION when a non-hashed asset changes (icons, offline page): the old caches are dropped on activate.

const VERSION = 'v1'
const STATIC_CACHE = `static-${VERSION}`
const RUNTIME_CACHE = `runtime-${VERSION}`
const OFFLINE_URL = '/offline.html'
// Installed up front and never trimmed: the offline fallback must survive any number of cached build assets
const PRECACHE = [OFFLINE_URL, '/favicon.svg']

const STATIC_LIMIT = 300
const RUNTIME_LIMIT = 60
const NETWORK_TIMEOUT = 4000

const apiOrigin = new URL(self.location.href).searchParams.get('api')

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE))
            .then(() => self.skipWaiting())
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys.filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE).map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    )
})

self.addEventListener('fetch', (event) => {
    const { request } = event

    if (request.method !== 'GET') {
        return
    }

    const url = new URL(request.url)
    const sameOrigin = url.origin === self.location.origin

    if (sameOrigin && isStatic(url.pathname)) {
        event.respondWith(cacheFirst(request))
        return
    }

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request).catch(() => caches.match(OFFLINE_URL)))
        return
    }

    if ((sameOrigin && url.pathname.startsWith('/_next/data/')) || (apiOrigin && url.origin === apiOrigin)) {
        event.respondWith(networkFirst(request, cacheKey(request)))
    }
})

// The API answers in the language of the `Locale` header and sends no `Vary`, so the language goes into the cache key
const cacheKey = (request) => {
    const locale = request.headers.get('Locale')

    if (!locale) {
        return request
    }

    const url = new URL(request.url)
    url.searchParams.set('__locale', locale)

    return new Request(url.toString())
}

const isStatic = (pathname) =>
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    /\.(png|svg|ico|woff2?)$/.test(pathname)

const cacheFirst = async (request) => {
    const cached = await caches.match(request)

    if (cached) {
        return cached
    }

    const response = await fetch(request)

    if (response.ok) {
        put(STATIC_CACHE, request, response.clone(), STATIC_LIMIT).catch(() => undefined)
    }

    return response
}

// The network answers within the timeout, or the cached copy does; with no copy the network gets all the time it needs
const networkFirst = async (request, key = request) => {
    const cached = await caches.match(key)
    const network = fetch(request).then((response) => {
        if (response.ok) {
            put(RUNTIME_CACHE, key, response.clone(), RUNTIME_LIMIT).catch(() => undefined)
        }

        return response
    })

    if (!cached) {
        return network
    }

    const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), NETWORK_TIMEOUT))

    return Promise.race([network.catch(() => cached), timeout])
}

// Oldest entries go first (Cache keeps insertion order); the precached files are never evicted
const put = async (cacheName, request, response, limit) => {
    const cache = await caches.open(cacheName)

    await cache.delete(request)
    await cache.put(request, response)

    const keys = (await cache.keys()).filter((key) => !PRECACHE.includes(new URL(key.url).pathname))

    await Promise.all(keys.slice(0, Math.max(0, keys.length - limit)).map((key) => cache.delete(key)))
}
