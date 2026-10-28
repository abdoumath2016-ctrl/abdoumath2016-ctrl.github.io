// زاد اليوم — يعمل دون إنترنت، ويجلب أحدث نسخة من البرنامج عند توفّر الاتصال
const CACHE = "zad-v1";
const SHELL = ["./", "index.html", "manifest.json", "privacy.html",
  "Cairo-Regular.ttf", "Cairo-SemiBold.ttf", "Cairo-Bold.ttf", "ScheherazadeNew-Bold.ttf",
  "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // صفحة البرنامج: من الإنترنت أولًا (لتصل التعديلات فورًا)، ثم من الذاكرة دون اتصال
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("index.html", c)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // بقية الملفات والخطوط: من الذاكرة، مع تحديثها في الخلفية
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
