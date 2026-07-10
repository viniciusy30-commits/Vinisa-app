// ============================================================================
// SERVICE WORKER - Vinisa
// Cuida do cache básico offline (pro app abrir rápido / funcionar com net
// ruim) e de exibir notificações locais do chat (via showNotification,
// chamado pelo próprio index.html quando o app está aberto ou minimizado há
// pouco tempo) e de reagir ao toque nelas, abrindo o app de volta.
//
// OBS: push notification "de verdade" — que acorda o celular com o app
// TOTALMENTE fechado — precisa de Firebase Cloud Messaging + Cloud Functions
// no backend, que por sua vez exige o plano pago Blaze do Firebase. Isso não
// está ativo aqui por enquanto; pode ser adicionado depois se for preciso.
// ============================================================================

const CACHE_NOME = 'vinisa-cache-v1';
const ARQUIVOS_CACHE = [
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS_CACHE).catch(() => {}))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((nomes) =>
            Promise.all(nomes.filter((n) => n !== CACHE_NOME).map((n) => caches.delete(n)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Estratégia simples: tenta rede, cai pro cache se offline.
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

// Toca na notificação -> abre (ou foca) o app.
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) return client.focus();
            }
            if (self.clients.openWindow) return self.clients.openWindow('/index.html');
        })
    );
});
