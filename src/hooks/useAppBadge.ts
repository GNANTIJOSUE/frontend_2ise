import { useEffect, useState } from 'react';
import { updateAppBadge, requestPushPermission, subscribeToPushNotifications } from '../serviceWorkerRegistration';

interface UseAppBadgeOptions {
  autoUpdate?: boolean;
  interval?: number;
}

export const useAppBadge = (options: UseAppBadgeOptions = {}) => {
  const { autoUpdate = true, interval = 30000 } = options;
  const [badgeCount, setBadgeCount] = useState<number>(0);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    // Vérifier si l'API Badge est supportée
    const checkBadgeSupport = () => {
      const supported = 'setAppBadge' in navigator;
      setIsSupported(supported);
      console.log('Badge API supported:', supported);
    };

    checkBadgeSupport();

    // Écouter les mises à jour de notifications
    const handleNotificationsUpdated = (event: CustomEvent) => {
      const { count } = event.detail;
      setBadgeCount(count);
      updateAppBadge(count);
    };

    window.addEventListener('notificationsUpdated', handleNotificationsUpdated as EventListener);

    // Mise à jour automatique si activée
    let intervalId: NodeJS.Timeout | null = null;
    if (autoUpdate && isSupported) {
      intervalId = setInterval(() => {
        // La synchronisation est gérée par le service worker
        // Ici on peut ajouter une logique supplémentaire si nécessaire
      }, interval);
    }

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated as EventListener);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoUpdate, interval, isSupported]);

  // Fonction pour mettre à jour manuellement le badge
  const updateBadge = (count: number) => {
    if (isSupported) {
      setBadgeCount(count);
      updateAppBadge(count);
    }
  };

  // Fonction pour effacer le badge
  const clearBadge = () => {
    if (isSupported) {
      setBadgeCount(0);
      updateAppBadge(0);
    }
  };

  // Fonction pour demander les permissions de notification
  const requestPermissions = async () => {
    try {
      const permissionGranted = await requestPushPermission();
      if (permissionGranted) {
        await subscribeToPushNotifications();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  return {
    badgeCount,
    isSupported,
    updateBadge,
    clearBadge,
    requestPermissions
  };
};
