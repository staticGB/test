// Caches the page and the Kokoro library files so the app works offline after the first visit.
// (The ~90 MB voice model is cached separately by the library itself.)
const CACHE = "narration-studio-v1";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html"])));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const store = res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  };

  if (url.origin === location.origin) {
    // Your own files: try the network first so updates show up, fall back to cache offline.
    e.respondWith(fetch(req).then(store).catch(() => caches.match(req)));
  } else if (url.hostname === "cdn.jsdelivr.net") {
    // Library files are version-pinned, so cache-first is safe.
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(store)));
  }
});
