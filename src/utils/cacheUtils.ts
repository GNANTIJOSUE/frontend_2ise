// Utilitaires pour gérer le cache du PWA

/**
 * Vide le cache du Service Worker
 */
export const clearServiceWorkerCache = async (): Promise<void> => {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        // Envoyer un message au Service Worker pour vider le cache
        registration.active.postMessage({ type: 'CLEAR_CACHE' });
        console.log('[CACHE] Message de vidage du cache envoyé au Service Worker');
      }
    }
  } catch (error) {
    console.error('[CACHE] Erreur lors du vidage du cache:', error);
  }
};

/**
 * Force la mise à jour du Service Worker
 */
export const forceServiceWorkerUpdate = async (): Promise<void> => {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        // Forcer la mise à jour
        await registration.update();
        console.log('[CACHE] Mise à jour du Service Worker forcée');
        
        // Si un nouveau Service Worker est disponible, l'activer
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          console.log('[CACHE] Nouveau Service Worker activé');
        }
      }
    }
  } catch (error) {
    console.error('[CACHE] Erreur lors de la mise à jour du Service Worker:', error);
  }
};

/**
 * Vide tous les caches disponibles
 */
export const clearAllCaches = async (): Promise<void> => {
  try {
    // Vider le cache du Service Worker
    await clearServiceWorkerCache();
    
    // Vider le cache de l'API Cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('[CACHE] Suppression du cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      console.log('[CACHE] Tous les caches supprimés');
    }
    
    // Vider le cache du navigateur pour les ressources
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.unregister();
        console.log('[CACHE] Service Worker désenregistré');
      }
    }
  } catch (error) {
    console.error('[CACHE] Erreur lors du vidage complet du cache:', error);
  }
};

/**
 * Vérifie si un nouveau Service Worker est disponible
 */
export const checkForServiceWorkerUpdate = async (): Promise<boolean> => {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        console.log('[CACHE] Nouveau Service Worker disponible');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('[CACHE] Erreur lors de la vérification du Service Worker:', error);
    return false;
  }
};

/**
 * Force le rafraîchissement complet de l'application
 */
export const forceAppRefresh = async (): Promise<void> => {
  try {
    console.log('[CACHE] Début du rafraîchissement forcé de l\'application');
    
    // Vider tous les caches
    await clearAllCaches();
    
    // Attendre un peu pour que les caches soient vidés
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Recharger la page
    window.location.reload();
  } catch (error) {
    console.error('[CACHE] Erreur lors du rafraîchissement forcé:', error);
    // En cas d'erreur, recharger quand même
    window.location.reload();
  }
};

/**
 * Ajoute des headers pour éviter le cache sur les requêtes API
 */
export const addNoCacheHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
  return {
    ...headers,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
};

/**
 * Crée une URL unique pour éviter le cache
 */
export const createUncachedUrl = (url: string): string => {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${timestamp}`;
};
