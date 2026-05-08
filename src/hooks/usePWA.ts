/**
 * usePWA Hook - Gestion Progressive Web App
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isOffline: boolean;
  updateAvailable: boolean;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
}

interface PWAActions {
  install: () => Promise<boolean>;
  update: () => Promise<void>;
  skipWaiting: () => Promise<void>;
}

export function usePWA(): PWAState & PWAActions {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if running as standalone (installed PWA)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                            (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Check if already installed
    if (isStandaloneMode) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Listen for offline/online events
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    // Listen for service worker updates
    const handleUpdateFound = () => {
      setUpdateAvailable(true);
    };

    // Register event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Custom events from index.html
    window.addEventListener('pwaInstallAvailable', ((e: CustomEvent) => {
      setDeferredPrompt(e.detail);
      setIsInstallable(true);
    }) as EventListener);

    window.addEventListener('pwaInstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
    });

    // Get service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        setSwRegistration(registration);
        registration.addEventListener('updatefound', handleUpdateFound);
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Install PWA
  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    setIsInstallable(false);
    
    return outcome === 'accepted';
  }, [deferredPrompt]);

  // Update service worker
  const update = useCallback(async (): Promise<void> => {
    if (swRegistration) {
      await swRegistration.update();
    }
  }, [swRegistration]);

  // Skip waiting for new service worker
  const skipWaiting = useCallback(async (): Promise<void> => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage('skipWaiting');
    }
  }, [swRegistration]);

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    isOffline,
    updateAvailable,
    serviceWorkerRegistration: swRegistration,
    install,
    update,
    skipWaiting,
  };
}

// Hook for online/offline status
export function useNetworkStatus(): { isOnline: boolean; isOffline: boolean } {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}

// Hook for background sync
export function useBackgroundSync(): {
  sync: (tag: string) => Promise<void>;
  isSupported: boolean;
} {
  const isSupported = 'sync' in ServiceWorkerRegistration.prototype;

  const sync = useCallback(async (tag: string): Promise<void> => {
    if (!isSupported) {
      console.warn('[PWA] Background sync not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
    } catch (error) {
      console.error('[PWA] Background sync registration failed:', error);
    }
  }, [isSupported]);

  return { sync, isSupported };
}

// Hook for push notifications (prepared for future use)
export function usePushNotifications(): {
  isSupported: boolean;
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<PushSubscription | null>;
} {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );

  const isSupported = 'PushManager' in window && 'Notification' in window;

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'YOUR_VAPID_PUBLIC_KEY_HERE' // Replace with your VAPID key
        ) as BufferSource,
      });
      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return null;
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    requestPermission,
    subscribe,
  };
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export default usePWA;
