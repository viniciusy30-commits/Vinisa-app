// ============================================================================
// SERVICE WORKER - Vinisa
// Cuida do cache básico offline (pro app abrir rápido / funcionar com net
// ruim) e agora TAMBÉM do push notification real via Firebase Cloud
// Messaging, que funciona mesmo com o app totalmente fechado.
// ============================================================================

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyB0zJCTSVv4mOM0UdOPXXo3fb9jR29Ezi0",
    authDomain: "viniussa-5ac61.firebaseapp.com",
    databaseURL: "https://viniussa-5ac61-default-rtdb.firebaseio.com",
    projectId: "viniussa-5ac61",
    storageBucket: "viniussa-5ac61.firebasestorage.app",
    messagingSenderId: "427736345845",
    appId: "1:427736345845:web:1d803ce4aac194167b69bc"
});

const messaging = firebase.messaging();

// Chamado pelo navegador/sistema quando chega um push do FCM e o app está
// fechado ou em background — é isso que faz a notificação aparecer na barra
// do Android mesmo sem o app aberto.
messaging.onBackgroundMessage((payload) => {
    const titulo = (payload.notification && payload.notification.title) || 'Vinisa';
    const corpo = (payload.notification && payload.notification.body) || '';

    self.registration.showNotification(titulo, {
        body: corpo,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200]
    });
});

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
