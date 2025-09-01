/* eslint-disable no-restricted-globals */

// Nom du cache avec version (incrémenter pour forcer la mise à jour)
const CACHE_NAME = '2ISE-GROUPE-v1.1.0';
const STATIC_CACHE = '2ISE-GROUPE-static-v1.1.0';
const DYNAMIC_CACHE = '2ISE-GROUPE-dynamic-v1.1.0';

// Fichiers à mettre en cache statique
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/android-icon-192x192.png'
];

// Installation du service worker et mise en cache des fichiers statiques
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
        .then(cache => {
            console.log('Service Worker: Caching static files');
            return cache.addAll(urlsToCache);
        })
        .then(() => {
            console.log('Service Worker: Static files cached');
            return self.skipWaiting();
        })
        .catch(error => {
            console.error('Service Worker: Error caching static files', error);
        })
    );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys()
        .then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
        .then(() => {
            console.log('Service Worker: Activated');
            return self.clients.claim();
        })
    );
});

// Interception des requêtes et stratégie de cache
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer les requêtes non-GET
    if (request.method !== 'GET') {
        return;
    }

    // Ignorer complètement les requêtes vers l'API backend
    if (url.origin === 'https://2ise-groupe.com' && url.pathname.startsWith('/api/')) {
        console.log('Service Worker: Ignoring API request', url.pathname);
        return;
    }

    // Ignorer les requêtes localhost en développement
    if (url.hostname === 'localhost') {
        return;
    }

    // Stratégie Network First pour les pages HTML (toujours récupérer la dernière version)
    if (request.destination === 'document' || url.pathname === '/') {
        console.log('Service Worker: Network First for document', url.pathname);
        event.respondWith(
            fetch(request)
            .then(response => {
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then(cache => {
                            cache.put(request, responseToCache);
                        });
                }
                return response;
            })
            .catch(() => {
                console.log('Service Worker: Network failed, using cache for document');
                return caches.match(request)
                    .then(response => {
                        if (response) {
                            return response;
                        }
                        // Fallback vers la page d'accueil
                        return caches.match('/');
                    });
            })
        );
        return;
    }

    // Stratégie Stale While Revalidate pour les ressources statiques
    if (request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'image' ||
        url.pathname.startsWith('/static/')) {

        console.log('Service Worker: Stale While Revalidate for static resource', url.pathname);
        event.respondWith(
            caches.open(DYNAMIC_CACHE)
            .then(cache => {
                return cache.match(request)
                    .then(cachedResponse => {
                        const fetchPromise = fetch(request)
                            .then(networkResponse => {
                                if (networkResponse && networkResponse.status === 200) {
                                    cache.put(request, networkResponse.clone());
                                }
                                return networkResponse;
                            })
                            .catch(() => {
                                console.log('Service Worker: Network failed for static resource, using cache');
                                return cachedResponse;
                            });

                        return cachedResponse || fetchPromise;
                    });
            })
        );
        return;
    }

    // Stratégie par défaut : Network First avec fallback cache
    console.log('Service Worker: Network First for other requests', url.pathname);
    event.respondWith(
        fetch(request)
        .then(response => {
            if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(DYNAMIC_CACHE)
                    .then(cache => {
                        cache.put(request, responseToCache);
                    });
            }
            return response;
        })
        .catch(() => {
            console.log('Service Worker: Network failed, using cache');
            return caches.match(request);
        })
    );
});

// Gestion des messages du client
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    // Nouveau : Message pour vider le cache
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('Service Worker: Clearing cache as requested');
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    console.log('Service Worker: Deleting cache', cacheName);
                    return caches.delete(cacheName);
                })
            );
        });
    }

    // Nouveau : Message pour mettre à jour le badge
    if (event.data && event.data.type === 'UPDATE_BADGE') {
        console.log('Service Worker: Updating badge count to', event.data.count);
        updateBadge(event.data.count);
    }

    // Nouveau : Message pour récupérer les notifications
    if (event.data && event.data.type === 'FETCH_NOTIFICATIONS') {
        console.log('Service Worker: Fetching notifications');
        fetchNotifications(event.data.userId, event.data.token);
    }
});

// Nouveau : Fonction pour mettre à jour le badge de l'application
async function updateBadge(count) {
    if ('setAppBadge' in navigator) {
        try {
            if (count > 0) {
                await navigator.setAppBadge(count);
                console.log('Service Worker: Badge updated to', count);
            } else {
                await navigator.clearAppBadge();
                console.log('Service Worker: Badge cleared');
            }
        } catch (error) {
            console.error('Service Worker: Error updating badge', error);
        }
    } else {
        console.log('Service Worker: Badge API not supported');
    }
}

// Nouveau : Fonction pour récupérer les notifications depuis l'API
async function fetchNotifications(userId, token) {
    try {
        const response = await fetch(`https://2ise-groupe.com/api/events/my-notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const notifications = await response.json();
            const unreadCount = notifications.filter(n => !n.is_read).length;

            // Mettre à jour le badge
            await updateBadge(unreadCount);

            // Notifier tous les clients connectés
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'NOTIFICATIONS_UPDATED',
                    count: unreadCount,
                    notifications: notifications
                });
            });
        }
    } catch (error) {
        console.error('Service Worker: Error fetching notifications', error);
    }
}

// Nouveau : Gestion des notifications push
self.addEventListener('push', event => {
    console.log('Service Worker: Push event received');

    let notificationData = {
        title: '2ISE-GROUPE',
        body: 'Nouvelle notification',
        icon: '/android-icon-192x192.png',
        badge: '/android-icon-192x192.png',
        tag: 'notification',
        data: {}
    };

    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                ...notificationData,
                ...data
            };
        } catch (error) {
            console.error('Service Worker: Error parsing push data', error);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
        .then(() => {
            // Mettre à jour le badge après affichage de la notification
            return updateBadge(1); // Incrémenter le badge
        })
    );
});

// Nouveau : Gestion des clics sur les notifications
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked');

    event.notification.close();

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clients => {
            // Si une fenêtre est déjà ouverte, la focaliser
            for (let client of clients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }

            // Sinon, ouvrir une nouvelle fenêtre
            if (self.clients.openWindow) {
                return self.clients.openWindow('/');
            }
        })
    );
});

// Nouveau : Gestion de la fermeture des notifications
self.addEventListener('notificationclose', event => {
    console.log('Service Worker: Notification closed');
    // Optionnel : décrémenter le badge quand une notification est fermée
});

// Gestion des erreurs
self.addEventListener('error', event => {
    console.error('Service Worker: Error', event.error);
});

// Gestion des rejets de promesses non gérés
self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
});