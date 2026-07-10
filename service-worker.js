// ============================================================================
// SERVICE WORKER - Vinisa
// Cuida de duas coisas:
//   1) Cache básico offline (pro app abrir rápido / funcionar com net ruim)
//   2) Push notifications reais (aparecem na barra do sistema do Android
//      mesmo com o app fechado), via Firebase Cloud Messaging
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

// ----------------------------------------------------------------------------
// FIREBASE CLOUD MESSAGING (push real, aparece na barra de notificação do
// Android mesmo com o app fechado ou o celular bloqueado)
// ----------------------------------------------------------------------------
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

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

// Chega um push com o app fechado/em background -> mostra na barra do sistema.
messaging.onBackgroundMessage((payload) => {
    const titulo = (payload.notification && payload.notification.title) || 'Vinisa';
    const corpo = (payload.notification && payload.notification.body) || 'Nova mensagem';

    self.registration.showNotification(titulo, {
        body: corpo,
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        tag: 'chat-vinisa',
        renotify: true,
        vibrate: [120, 60, 120],
        data: { url: '/index.html' }
    });
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
