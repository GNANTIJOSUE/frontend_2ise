// src/serviceWorkerRegistration.js

const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
        const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
        if (publicUrl.origin !== window.location.origin) {
            return;
        }

        window.addEventListener('load', () => {
            const swUrl = `${process.env.PUBLIC_URL}/custom-sw.js`;

            if (isLocalhost) {
                // This is running on localhost. Let's check if a service worker still exists or not.
                checkValidServiceWorker(swUrl, config);

                // Add some additional logging to localhost, pointing developers to the
                // service worker/PWA documentation.
                navigator.serviceWorker.ready.then(() => {
                    console.log(
                        'This web app is being served cache-first by a service ' +
                        'worker. To learn more, visit https://cra.link/PWA'
                    );
                });
            } else {
                // Is not localhost. Just register service worker
                registerValidSW(swUrl, config);
            }
        });
    }
}

function registerValidSW(swUrl, config) {
    navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            registration.onupdatefound = () => {
                const installingWorker = registration.installing;
                if (installingWorker == null) {
                    return;
                }
                installingWorker.onstatechange = () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // At this point, the updated precached content has been fetched,
                            // but the previous service worker will still serve the older
                            // content until all client tabs are closed.
                            console.log(
                                'New content is available and will be used when all ' +
                                'tabs for this page are closed. See https://cra.link/PWA.'
                            );

                            // Execute callback
                            if (config && config.onUpdate) {
                                config.onUpdate(registration);
                            }

                            // Show update notification
                            showUpdateNotification(registration);
                        } else {
                            // At this point, everything has been precached.
                            // It's the perfect time to display a
                            // "Content is cached for offline use." message.
                            console.log('Content is cached for offline use.');

                            // Execute callback
                            if (config && config.onSuccess) {
                                config.onSuccess(registration);
                            }
                        }
                    }
                };
            };

            // Nouveau : Écouter les messages du service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'NOTIFICATIONS_UPDATED') {
                    console.log('Notifications updated:', event.data.count);
                    // Émettre un événement personnalisé pour informer l'application
                    window.dispatchEvent(new CustomEvent('notificationsUpdated', {
                        detail: {
                            count: event.data.count,
                            notifications: event.data.notifications
                        }
                    }));
                }
            });

            // Nouveau : Initialiser la synchronisation des notifications
            initializeNotificationSync(registration);
        })
        .catch((error) => {
            console.error('Error during service worker registration:', error);
        });
}

// Nouveau : Fonction pour initialiser la synchronisation des notifications
function initializeNotificationSync(registration) {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem('token');
    if (!token) {
        return;
    }

    // Récupérer les informations utilisateur depuis le token
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.id;

        // Demander au service worker de récupérer les notifications
        if (registration.active) {
            registration.active.postMessage({
                type: 'FETCH_NOTIFICATIONS',
                userId: userId,
                token: token
            });
        }

        // Configurer la synchronisation périodique
        setInterval(() => {
            if (registration.active) {
                registration.active.postMessage({
                    type: 'FETCH_NOTIFICATIONS',
                    userId: userId,
                    token: token
                });
            }
        }, 30000); // Synchroniser toutes les 30 secondes

    } catch (error) {
        console.error('Error parsing token for notification sync:', error);
    }
}

// Nouveau : Fonction pour mettre à jour le badge manuellement
export function updateAppBadge(count) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'UPDATE_BADGE',
            count: count
        });
    }
}

// Nouveau : Fonction pour demander la permission des notifications push
export async function requestPushPermission() {
    if ('Notification' in window && 'serviceWorker' in navigator) {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Push notification permission granted');
                return true;
            } else {
                console.log('Push notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('Error requesting push permission:', error);
            return false;
        }
    }
    return false;
}

// Nouveau : Fonction pour s'abonner aux notifications push
export async function subscribeToPushNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array('BPeqCNA95bi6yRtbdalZh_JmnfIDUFG0b83r-BkEE9JIwWEtJOdPvJvkl9s60EfEnaCz6NmvLyVfVVPcEOUSM-8')
            });

            console.log('Push subscription:', subscription);

            // Envoyer la subscription au serveur
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('https://2ise-groupe.com/api/push/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(subscription)
                });
            }

            return subscription;
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
            return null;
        }
    }
    return null;
}

// Nouveau : Fonction utilitaire pour convertir la clé VAPID
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function checkValidServiceWorker(swUrl, config) {
    // Check if the service worker can be found. If it can't reload the page.
    fetch(swUrl, {
            headers: { 'Service-Worker': 'script' },
        })
        .then((response) => {
            // Ensure service worker exists, and that we really are getting a JS file.
            const contentType = response.headers.get('content-type');
            if (
                response.status === 404 ||
                (contentType != null && contentType.indexOf('javascript') === -1)
            ) {
                // No service worker found. Probably a different app. Reload the page.
                navigator.serviceWorker.ready.then((registration) => {
                    registration.unregister().then(() => {
                        window.location.reload();
                    });
                });
            } else {
                // Service worker found. Proceed as normal.
                registerValidSW(swUrl, config);
            }
        })
        .catch(() => {
            console.log('No internet connection found. App is running in offline mode.');
        });
}

function showUpdateNotification(registration) {
    // Créer une notification de mise à jour
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('2ISE-GROUPE - Mise à jour disponible', {
            body: 'Une nouvelle version de l\'application est disponible. Fermez tous les onglets pour l\'appliquer.',
            icon: '/android-icon-192x192.png',
            badge: '/android-icon-192x192.png',
            tag: 'app-update',
            requireInteraction: true,
            actions: [{
                    action: 'update',
                    title: 'Mettre à jour maintenant'
                },
                {
                    action: 'dismiss',
                    title: 'Plus tard'
                }
            ]
        });

        notification.onclick = function(event) {
            if (event.action === 'update') {
                // Envoyer un message au service worker pour forcer la mise à jour
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
            }
            notification.close();
        };

        // Auto-fermer la notification après 10 secondes
        setTimeout(() => {
            notification.close();
        }, 10000);
    }
}

export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => {
                registration.unregister();
            })
            .catch((error) => {
                console.error(error.message);
            });
    }
}

// Fonction pour demander la permission de notification
export function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    console.log('Permission de notification accordée');
                }
            });
        }
    }
}

// Fonction pour vérifier si l'app est installée
export function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
}

// Fonction pour afficher un prompt d'installation
export function showInstallPrompt() {
    let deferredPrompt;
    let installButton = null;

    // Détecter si l'app est déjà installée
    if (isAppInstalled()) {
        return; // Ne pas afficher le prompt si déjà installé
    }

    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('beforeinstallprompt event triggered');

        // Empêcher l'affichage automatique du prompt
        e.preventDefault();

        // Stocker l'événement pour qu'il puisse être déclenché plus tard
        deferredPrompt = e;

        // Afficher automatiquement le bouton d'installation après 3 secondes
        setTimeout(() => {
            showCustomInstallButton();
        }, 3000);
    });

    // Détecter l'installation réussie
    window.addEventListener('appinstalled', (e) => {
        console.log('Application installée avec succès');
        if (installButton) {
            installButton.remove();
        }
        // Afficher une notification de succès
        showInstallSuccessNotification();
    });

    function showCustomInstallButton() {
        // Vérifier si l'app est déjà installée
        if (isAppInstalled()) {
            return;
        }

        // Supprimer l'ancien bouton s'il existe
        if (installButton) {
            installButton.remove();
        }

        // Créer un bouton d'installation personnalisé
        installButton = document.createElement('div');
        installButton.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                background: linear-gradient(135deg, #1976d2, #1565c0);
                color: white;
                border: none;
                padding: 15px 20px;
                border-radius: 25px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                box-shadow: 0 4px 20px rgba(25, 118, 210, 0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Installer 2ISE-GROUPE
            </div>
        `;

        installButton.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('Utilisateur a accepté l\'installation');
                        showInstallSuccessNotification();
                    } else {
                        console.log('Utilisateur a refusé l\'installation');
                        // Réessayer plus tard
                        setTimeout(() => {
                            showCustomInstallButton();
                        }, 60000); // 1 minute plus tard
                    }
                    deferredPrompt = null;
                });
            }
        });

        document.body.appendChild(installButton);

        // Supprimer le bouton après 2 minutes
        setTimeout(() => {
            if (installButton && installButton.parentNode) {
                installButton.remove();
                installButton = null;
            }
        }, 120000);
    }

    function showInstallSuccessNotification() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                background: #4caf50;
                color: white;
                padding: 15px 25px;
                border-radius: 25px;
                font-weight: bold;
                box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
                animation: slideIn 0.5s ease;
            ">
                ✅ Application installée avec succès !
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}