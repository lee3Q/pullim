// 풀림 Service Worker — PWA 오프라인 지원 + 캐시 전략
const CACHE_NAME = "pullim-v1";
const IMAGE_CACHE_NAME = "pullim-images-v1";
const ALL_CACHES = [CACHE_NAME, IMAGE_CACHE_NAME];
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
];

// Install: 정적 에셋 프리캐시
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: 이전 캐시 정리
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !ALL_CACHES.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Network-first (API), Cache-first (정적 에셋)
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청은 항상 네트워크 우선
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(request));
    return;
  }

  // SSE 스트리밍은 캐시하지 않음
  if (request.headers.get("accept")?.includes("text/event-stream")) {
    event.respondWith(fetch(request));
    return;
  }

  // /assets/ 이미지: pullim-images-v1 캐시로 분리 (cache-first)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(IMAGE_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // 정적 에셋: 캐시 우선, 없으면 네트워크
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // 성공 응답만 캐시
        if (response.ok && request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    }).catch(() => {
      // 오프라인 폴백
      if (request.destination === "document") {
        return caches.match("/");
      }
      return new Response("오프라인 상태입니다.", { status: 503 });
    })
  );
});
