// زاد اليوم — يعمل دون إنترنت، ولا يعلق إذا كان الإنترنت ضعيفًا
const CACHE = "zad-v2";
const SHELL = ["./", "index.html", "manifest.json", "privacy.html",
  "Cairo-Regular.ttf", "Cairo-SemiBold.ttf", "Cairo-Bold.ttf", "ScheherazadeNew-Bold.ttf",
  "icon-192.png", "icon-512.png", "adhan_takbir.mp3"];
self.addEventListener("install", e => {
  // لا يفشل التثبيت لو تعذّر ملف واحد
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // طلبات خارجية غير الخطوط (مثل نص الحديث): تمرّ مباشرة دون تدخل
  if (url.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
  // صفحة البرنامج: نحاول الإنترنت ٣ ثوانٍ فقط، فإن تأخر نعرض النسخة المحفوظة فورًا ونحدّثها في الخلفية
  if (req.mode === "navigate") {
    const net = fetch(req).then(r => { if (r && r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put("index.html", c)); } return r; });
    e.waitUntil(net.catch(() => {}));
    e.respondWith(new Promise(resolve => {
      let done = false;
      const fallback = () => caches.match("index.html").then(hit => { if (!done && hit) { done = true; resolve(hit); } });
      const t = setTimeout(fallback, 3000);
      net.then(r => { if (!done) { done = true; clearTimeout(t); resolve(r); } })
         .catch(() => { clearTimeout(t); caches.match("index.html").then(hit => { if (!done) { done = true; resolve(hit || Response.error()); } }); });
    }));
    return;
  }
  // بقية الملفات والخطوط: من الذاكرة فورًا، مع تحديثها في الخلفية
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => Response.error());
  }));
});
