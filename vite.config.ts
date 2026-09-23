import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const BASE = '/spisak/'

/** Emit a service worker that precaches the built app shell + hashed assets. */
function spisakServiceWorker(): Plugin {
  return {
    name: 'spisak-service-worker',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const dist = path.resolve('dist')
      const assetsDir = path.join(dist, 'assets')
      const iconsDir = path.join(dist, 'icons')

      const assets = fs.existsSync(assetsDir)
        ? fs.readdirSync(assetsDir).map((f) => `${BASE}assets/${f}`)
        : []
      const icons = fs.existsSync(iconsDir)
        ? fs.readdirSync(iconsDir).map((f) => `${BASE}icons/${f}`)
        : []

      const precache = Array.from(
        new Set([
          BASE,
          `${BASE}index.html`,
          `${BASE}404.html`,
          `${BASE}manifest.webmanifest`,
          `${BASE}favicon.svg`,
          ...icons,
          ...assets,
        ]),
      )

      const cacheId = assets.map((a) => a.split('/').pop()).join('|').slice(0, 48) || 'shell'
      const cacheName = `spisak-static-${Buffer.from(cacheId).toString('base64url').slice(0, 16)}`

      const sw = `/* SmartLife service worker — generated at build time */
const CACHE = ${JSON.stringify(cacheName)};
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    void cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      void cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('${BASE}index.html');
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    if (url.hostname.endsWith('googleusercontent.com')) {
      event.respondWith(cacheFirst(request));
    }
    return;
  }

  if (!url.pathname.startsWith('${BASE.replace(/\/$/, '')}')) return;

  if (
    url.pathname.startsWith('${BASE}assets/') ||
    /\\.(?:png|svg|ico|webp|woff2?|webmanifest)$/i.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
  }
});
`

      fs.writeFileSync(path.join(dist, 'sw.js'), sw)
      // GitHub Pages SPA fallback
      const indexHtml = path.join(dist, 'index.html')
      if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, path.join(dist, '404.html'))
      }
    },
  }
}

export default defineConfig({
  base: BASE,
  build: {
    cssCodeSplit: true,
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('@dnd-kit')) return 'dnd'
          if (id.includes('i18next') || id.includes('react-i18next')) return 'i18n'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router')) {
            return 'react-vendor'
          }
          if (id.includes('date-fns') || id.includes('zustand')) return 'utils'
          return 'vendor'
        },
      },
    },
  },
  plugins: [react(), spisakServiceWorker()],
})
