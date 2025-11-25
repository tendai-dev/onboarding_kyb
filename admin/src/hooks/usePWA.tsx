"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Alert,
  AlertTitle,
  AlertDescription,
  useDisclosure,
  Dialog,
  Field,
  Input,
  Textarea,
  Switch,
  Badge,
  Tooltip,
  SimpleGrid,
  Flex,
  Spinner
} from '@chakra-ui/react';
import {
  FiDownload,
  FiX,
  FiBell,
  FiBellOff,
  FiSettings,
  FiShare,
  FiWifi,
  FiWifiOff,
  FiSmartphone,
  FiMonitor,
  FiTablet,
  FiInfo,
  FiCheck,
  FiAlertTriangle,
  FiRefreshCw,
  FiPlus,
  FiMinus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiEyeOff
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
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
    installApp
  };
}

// Push Notifications Hook
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if basic notifications are supported (service worker removed per requirements)
    // Note: Push subscriptions require service worker, so they are disabled
    if ('Notification' in window) {
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
    // Push subscriptions require service worker, which has been removed per requirements
    // This function is kept for API compatibility but will always return false
    setIsLoading(true);
    try {
      // Service worker removed - push subscriptions not available
      // Use standard browser notifications instead via PushNotificationService
      return false;
    } catch (error) {
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
        body: JSON.stringify(subscription)
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
    unsubscribeFromPush
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
    <Alert.Root status="info" borderRadius="md" mb="4">
      <Box flex="1">
        <AlertTitle>Install Mukuru KYB</AlertTitle>
        <AlertDescription>
          Install this app on your device for a better experience and offline access.
        </AlertDescription>
      </Box>
      <HStack gap="2">
        <Button size="sm" colorScheme="blue" onClick={handleInstall}>
          Install
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss}>
          <Icon as={FiX} />
        </Button>
      </HStack>
    </Alert.Root>
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
    unsubscribeFromPush
  } = usePushNotifications();

  const [settings, setSettings] = useState({
    applicationUpdates: true,
    documentStatus: true,
    messages: true,
    systemAlerts: false
  });

  const handleToggle = async (key: keyof typeof settings) => {
    if (!subscription && settings[key]) {
      // Need to subscribe first
      const hasPermission = await requestPermission();
      if (hasPermission) {
        await subscribeToPush();
      }
    } else if (subscription && !settings[key]) {
      // Unsubscribe if no notifications are enabled
      const hasAnyEnabled = Object.entries(settings).some(([k, v]) => k !== key && v);
      if (!hasAnyEnabled) {
        await unsubscribeFromPush();
      }
    }

    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isSupported) {
    return (
      <Alert.Root status="warning">
        <AlertTitle>Push notifications not supported</AlertTitle>
        <AlertDescription>
          Your browser doesn't support push notifications.
        </AlertDescription>
      </Alert.Root>
    );
  }

  return (
    <VStack align="stretch" gap="4">
      <HStack justify="space-between">
        <VStack align="start" gap="1">
          <Text fontWeight="semibold">Push Notifications</Text>
          <Text fontSize="sm" color="gray.600">
            {permission === 'granted' ? 'Enabled' : 'Disabled'}
          </Text>
        </VStack>
        <Badge colorScheme={permission === 'granted' ? 'green' : 'red'}>
          {permission === 'granted' ? 'Active' : 'Inactive'}
        </Badge>
      </HStack>

      {permission === 'default' && (
        <Button
          colorScheme="blue"
          onClick={requestPermission}
          loading={isLoading}
        >
          <Icon as={FiBell} mr="2" />
          Enable Notifications
        </Button>
      )}

      {permission === 'granted' && (
        <VStack align="stretch" gap="3">
          <HStack justify="space-between">
            <Text>Application Updates</Text>
            <Switch.Root
              checked={settings.applicationUpdates}
              onCheckedChange={() => handleToggle('applicationUpdates')}
            >
              <Switch.Indicator />
            </Switch.Root>
          </HStack>
          
          <HStack justify="space-between">
            <Text>Document Status Changes</Text>
            <Switch.Root
              checked={settings.documentStatus}
              onCheckedChange={() => handleToggle('documentStatus')}
            >
              <Switch.Indicator />
            </Switch.Root>
          </HStack>
          
          <HStack justify="space-between">
            <Text>New Messages</Text>
            <Switch.Root
              checked={settings.messages}
              onCheckedChange={() => handleToggle('messages')}
            >
              <Switch.Indicator />
            </Switch.Root>
          </HStack>
          
          <HStack justify="space-between">
            <Text>System Alerts</Text>
            <Switch.Root
              checked={settings.systemAlerts}
              onCheckedChange={() => handleToggle('systemAlerts')}
            >
              <Switch.Indicator />
            </Switch.Root>
          </HStack>
        </VStack>
      )}

      {permission === 'denied' && (
        <Alert.Root status="error">
          <AlertTitle>Notifications blocked</AlertTitle>
          <AlertDescription>
            Please enable notifications in your browser settings to receive updates.
          </AlertDescription>
        </Alert.Root>
      )}
    </VStack>
  );
}

// Offline Indicator Component
export function OfflineIndicator(): React.JSX.Element | null {
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
    <Alert.Root
      status={isOnline ? 'success' : 'warning'}
      position="fixed"
      top="4"
      left="4"
      right="4"
      zIndex="9999"
      borderRadius="md"
    >
      <Box flex="1">
        <AlertTitle>
          {isOnline ? 'Back Online' : 'You are offline'}
        </AlertTitle>
        <AlertDescription>
          {isOnline 
            ? 'Your connection has been restored.' 
            : 'Some features may be limited while offline.'
          }
        </AlertDescription>
      </Box>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowIndicator(false)}
      >
        <Icon as={FiX} />
      </Button>
    </Alert.Root>
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
    <Dialog.Root open={true} onOpenChange={(e) => !e.open && setSharedData(null)}>
      <Dialog.Backdrop />
      <Dialog.Content>
        <Dialog.Header>Shared Content</Dialog.Header>
        <Dialog.Body>
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
        </Dialog.Body>
        <Dialog.Footer>
          <Button colorScheme="blue" onClick={() => setSharedData(null)}>
            Process Shared Content
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}

// PWA Update Available Component
export function PWAUpdateAvailable() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Service worker removed per requirements - update detection disabled
    // App updates will be handled via standard browser refresh
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // Service worker removed - standard page reload
      window.location.reload();
    } catch (error) {
      setIsUpdating(false);
    }
  };

  if (!updateAvailable) return null;

  return (
    <Alert.Root status="info" borderRadius="md" mb="4">
      <Box flex="1">
        <AlertTitle>Update Available</AlertTitle>
        <AlertDescription>
          A new version of the app is available. Update now for the latest features.
        </AlertDescription>
      </Box>
      <Button
        size="sm"
        colorScheme="blue"
        onClick={handleUpdate}
        loading={isUpdating}
      >
        <Icon as={FiRefreshCw} mr="2" />
        Update
      </Button>
    </Alert.Root>
  );
}

// PWA Status Component
export function PWAStatus() {
  const { isInstallable, isInstalled } = usePWAInstall();
  const { permission, subscription } = usePushNotifications();
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
      <VStack align="start" gap="2" p="4" bg="white" borderRadius="md" border="1px" borderColor="gray.200">
        <HStack>
          <Icon as={isInstalled ? FiCheck : FiDownload} color={isInstalled ? 'green.500' : 'gray.400'} />
          <Text fontWeight="semibold">App Installation</Text>
        </HStack>
        <Text fontSize="sm" color="gray.600">
          {isInstalled ? 'Installed' : isInstallable ? 'Available' : 'Not available'}
        </Text>
      </VStack>

      <VStack align="start" gap="2" p="4" bg="white" borderRadius="md" border="1px" borderColor="gray.200">
        <HStack>
          <Icon as={permission === 'granted' ? FiBell : FiBellOff} color={permission === 'granted' ? 'green.500' : 'gray.400'} />
          <Text fontWeight="semibold">Notifications</Text>
        </HStack>
        <Text fontSize="sm" color="gray.600">
          {permission === 'granted' ? 'Enabled' : 'Disabled'}
        </Text>
      </VStack>

      <VStack align="start" gap="2" p="4" bg="white" borderRadius="md" border="1px" borderColor="gray.200">
        <HStack>
          <Icon as={isOnline ? FiWifi : FiWifiOff} color={isOnline ? 'green.500' : 'red.500'} />
          <Text fontWeight="semibold">Connection</Text>
        </HStack>
        <Text fontSize="sm" color="gray.600">
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </VStack>

      <VStack align="start" gap="2" p="4" bg="white" borderRadius="md" border="1px" borderColor="gray.200">
        <HStack>
          <Icon as={FiSmartphone} color="blue.500" />
          <Text fontWeight="semibold">PWA Mode</Text>
        </HStack>
        <Text fontSize="sm" color="gray.600">
          {window.matchMedia('(display-mode: standalone)').matches ? 'Standalone' : 'Browser'}
        </Text>
      </VStack>
    </SimpleGrid>
  );
}
