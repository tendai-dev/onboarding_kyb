'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Icon,
  Input,
  Textarea,
  Switch,
  SimpleGrid,
  Field,
} from '@chakra-ui/react';
import { Button, Typography, Tag, Modal, ModalFooter } from '@/lib/mukuruImports';
import {
  FiDownload,
  FiX,
  FiBell,
  FiBellOff,
  FiWifi,
  FiWifiOff,
  FiSmartphone,
  FiCheck,
  FiRefreshCw,
} from 'react-icons/fi';

// PWA Installation Hook
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as any);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt as EventListener
    );
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error installing PWA:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    installApp,
  };
}

// Push Notifications Hook
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const subscribeToPush = useCallback(async () => {
    if (!isSupported || permission !== 'granted') return false;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      setSubscription(sub);

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sub),
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission]);

  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) return false;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Notify server
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }, [subscription]);

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
  };
}

// PWA Installation Banner Component
interface PWAInstallBannerProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export function PWAInstallBanner({ onInstall, onDismiss }: PWAInstallBannerProps) {
  const { isInstallable, installApp } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInstallable) {
      setIsVisible(true);
    }
  }, [isInstallable]);

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      setIsVisible(false);
      onInstall?.();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <VStack
      gap="2"
      p="4"
      bg="blue.50"
      borderRadius="md"
      mb="4"
      border="1px solid"
      borderColor="blue.200"
    >
      <Box flex="1">
        <Typography fontWeight="semibold" mb="2">
          Install Mukuru KYC
        </Typography>
        <Typography fontSize="sm" color="gray.700">
          Install this app on your device for a better experience and offline access.
        </Typography>
      </Box>
      <HStack gap="2">
        <Button size="sm" variant="primary" onClick={handleInstall}>
          Install
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss}>
          <Icon as={FiX} />
        </Button>
      </HStack>
    </VStack>
  );
}

// Push Notification Settings Component
export function PushNotificationSettings() {
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
  } = usePushNotifications();

  const [settings, setSettings] = useState({
    applicationUpdates: true,
    documentStatus: true,
    messages: true,
    systemAlerts: false,
  });

  const handleToggle = async (key: string) => {
    if (!subscription && settings[key as keyof typeof settings]) {
      // Need to subscribe first
      const hasPermission = await requestPermission();
      if (hasPermission) {
        await subscribeToPush();
      }
    } else if (subscription && !settings[key as keyof typeof settings]) {
      // Unsubscribe if no notifications are enabled
      const hasAnyEnabled = Object.entries(settings).some(([k, v]) => k !== key && v);
      if (!hasAnyEnabled) {
        await unsubscribeFromPush();
      }
    }

    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  if (!isSupported) {
    return (
      <Box
        bg="orange.50"
        borderColor="orange.200"
        borderWidth="1px"
        borderRadius="md"
        p="4"
      >
        <Typography fontWeight="semibold" mb="2" color="orange.800">
          Push notifications not supported
        </Typography>
        <Typography fontSize="sm" color="gray.700">
          Your browser doesn&apos;t support push notifications.
        </Typography>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap="4">
      <HStack justify="space-between">
        <VStack align="start" gap="1">
          <Typography fontWeight="semibold">Push Notifications</Typography>
          <Typography fontSize="sm" color="gray.600">
            {permission === 'granted' ? 'Enabled' : 'Disabled'}
          </Typography>
        </VStack>
        <Tag variant="solid" size="md">
          {permission === 'granted' ? 'Active' : 'Inactive'}
        </Tag>
      </HStack>

      {permission === 'default' && (
        <Button variant="primary" onClick={requestPermission} loading={isLoading}>
          Enable Notifications
        </Button>
      )}

      {permission === 'granted' && (
        <VStack align="stretch" gap="3">
          <HStack justify="space-between">
            <Typography>Application Updates</Typography>
            <Switch.Root
              checked={settings.applicationUpdates}
              onCheckedChange={() => handleToggle('applicationUpdates')}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>

          <HStack justify="space-between">
            <Typography>Document Status Changes</Typography>
            <Switch.Root
              checked={settings.documentStatus}
              onCheckedChange={() => handleToggle('documentStatus')}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>

          <HStack justify="space-between">
            <Typography>New Messages</Typography>
            <Switch.Root
              checked={settings.messages}
              onCheckedChange={() => handleToggle('messages')}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>

          <HStack justify="space-between">
            <Typography>System Alerts</Typography>
            <Switch.Root
              checked={settings.systemAlerts}
              onCheckedChange={() => handleToggle('systemAlerts')}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </HStack>
        </VStack>
      )}

      {permission === 'denied' && (
        <Box bg="red.50" borderColor="red.200" borderWidth="1px" borderRadius="md" p="4">
          <Typography fontWeight="semibold" mb="2" color="red.800">
            Notifications blocked
          </Typography>
          <Typography fontSize="sm" color="gray.700">
            Please enable notifications in your browser settings to receive updates.
          </Typography>
        </Box>
      )}
    </VStack>
  );
}

// Offline Indicator Component
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <Box
      bg={isOnline ? 'green.50' : 'orange.50'}
      borderColor={isOnline ? 'green.200' : 'orange.200'}
      borderWidth="1px"
      position="fixed"
      top="4"
      left="4"
      right="4"
      zIndex="9999"
      borderRadius="md"
      p="4"
    >
      <Box flex="1">
        <Typography
          fontWeight="semibold"
          mb="2"
          color={isOnline ? 'green.800' : 'orange.800'}
        >
          {isOnline ? 'Back Online' : 'You are offline'}
        </Typography>
        <Typography fontSize="sm" color="gray.700">
          {isOnline
            ? 'Your connection has been restored.'
            : 'Some features may be limited while offline.'}
        </Typography>
      </Box>
      <Button size="sm" variant="ghost" onClick={() => setShowIndicator(false)}>
        <Icon as={FiX} />
      </Button>
    </Box>
  );
}

// PWA Share Target Handler
export function ShareTargetHandler() {
  const [sharedData, setSharedData] = useState<any>(null);

  useEffect(() => {
    // Handle shared data from PWA share target
    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get('title');
    const text = urlParams.get('text');
    const url = urlParams.get('url');

    if (title || text || url) {
      setSharedData({ title, text, url });
    }
  }, []);

  if (!sharedData) return null;

  return (
    <Modal isOpen={true} onClose={() => setSharedData(null)} title="Shared Content">
      <VStack align="stretch" gap="4">
        {sharedData.title && (
          <Field.Root>
            <Field.Label>Title</Field.Label>
            <Input value={sharedData.title} readOnly />
          </Field.Root>
        )}

        {sharedData.text && (
          <Field.Root>
            <Field.Label>Text</Field.Label>
            <Textarea value={sharedData.text} readOnly />
          </Field.Root>
        )}

        {sharedData.url && (
          <Field.Root>
            <Field.Label>URL</Field.Label>
            <Input value={sharedData.url} readOnly />
          </Field.Root>
        )}
      </VStack>
      <ModalFooter>
        <Button variant="primary" onClick={() => setSharedData(null)}>
          Process Shared Content
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// PWA Update Available Component
export function PWAUpdateAvailable() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });
    }
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // Reload the page to use the new service worker
      window.location.reload();
    } catch (error) {
      console.error('Error updating PWA:', error);
      setIsUpdating(false);
    }
  };

  if (!updateAvailable) return null;

  return (
    <Box
      bg="blue.50"
      borderColor="blue.200"
      borderWidth="1px"
      borderRadius="md"
      mb="4"
      p="4"
    >
      <Box flex="1">
        <Typography fontWeight="semibold" mb="2" color="blue.800">
          Update Available
        </Typography>
        <Typography fontSize="sm" color="gray.700">
          A new version of the app is available. Update now for the latest features.
        </Typography>
      </Box>
      <Button size="sm" variant="primary" onClick={handleUpdate} loading={isUpdating}>
        <Icon as={FiRefreshCw} mr="1" />
        Update
      </Button>
    </Box>
  );
}

// PWA Status Component
export function PWAStatus() {
  const { isInstallable, isInstalled } = usePWAInstall();
  const { permission } = usePushNotifications();
  const [isOnline, setIsOnline] = useState(true);

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

  return (
    <SimpleGrid columns={2} gap="4">
      <VStack
        align="start"
        gap="2"
        p="4"
        bg="white"
        borderRadius="md"
        border="1px"
        borderColor="gray.200"
      >
        <HStack>
          <Icon
            as={isInstalled ? FiCheck : FiDownload}
            color={isInstalled ? 'green.500' : 'gray.400'}
          />
          <Typography fontWeight="semibold">App Installation</Typography>
        </HStack>
        <Typography fontSize="sm" color="gray.600">
          {isInstalled ? 'Installed' : isInstallable ? 'Available' : 'Not available'}
        </Typography>
      </VStack>

      <VStack
        align="start"
        gap="2"
        p="4"
        bg="white"
        borderRadius="md"
        border="1px"
        borderColor="gray.200"
      >
        <HStack>
          <Icon
            as={permission === 'granted' ? FiBell : FiBellOff}
            color={permission === 'granted' ? 'green.500' : 'gray.400'}
          />
          <Typography fontWeight="semibold">Notifications</Typography>
        </HStack>
        <Typography fontSize="sm" color="gray.600">
          {permission === 'granted' ? 'Enabled' : 'Disabled'}
        </Typography>
      </VStack>

      <VStack
        align="start"
        gap="2"
        p="4"
        bg="white"
        borderRadius="md"
        border="1px"
        borderColor="gray.200"
      >
        <HStack>
          <Icon
            as={isOnline ? FiWifi : FiWifiOff}
            color={isOnline ? 'green.500' : 'red.500'}
          />
          <Typography fontWeight="semibold">Connection</Typography>
        </HStack>
        <Typography fontSize="sm" color="gray.600">
          {isOnline ? 'Online' : 'Offline'}
        </Typography>
      </VStack>

      <VStack
        align="start"
        gap="2"
        p="4"
        bg="white"
        borderRadius="md"
        border="1px"
        borderColor="gray.200"
      >
        <HStack>
          <Icon as={FiSmartphone} color="blue.500" />
          <Typography fontWeight="semibold">PWA Mode</Typography>
        </HStack>
        <Typography fontSize="sm" color="gray.600">
          {window.matchMedia('(display-mode: standalone)').matches
            ? 'Standalone'
            : 'Browser'}
        </Typography>
      </VStack>
    </SimpleGrid>
  );
}
