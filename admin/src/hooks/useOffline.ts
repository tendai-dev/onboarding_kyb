"use client";

import { useState, useEffect, useCallback } from 'react';

// Network status hook
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection speed
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setIsSlowConnection(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');

      const handleConnectionChange = () => {
        setIsSlowConnection(connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
      };

      connection.addEventListener('change', handleConnectionChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isSlowConnection };
}

// Offline form submission hook
export function useOfflineSubmission() {
  const [queuedSubmissions, setQueuedSubmissions] = useState<any[]>([]);
  const { isOnline } = useNetworkStatus();

  const queueSubmission = useCallback(async (submission: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
  }) => {
    if (isOnline) {
      // Try to submit immediately if online
      try {
        const response = await fetch(submission.url, {
          method: submission.method,
          headers: submission.headers,
          body: JSON.stringify(submission.body)
        });

        if (response.ok) {
          return { success: true, data: await response.json() };
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        // If submission fails, queue it
        console.warn('Submission failed, queuing for later:', error);
      }
    }

    // Queue the submission
    const queuedSubmission = {
      id: `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...submission,
      timestamp: Date.now()
    };

    setQueuedSubmissions(prev => [...prev, queuedSubmission]);
    
    // Store in IndexedDB
    try {
      await storeQueuedSubmission(queuedSubmission);
    } catch (error) {
      console.error('Failed to store queued submission:', error);
    }

    return { success: false, queued: true, id: queuedSubmission.id };
  }, [isOnline]);

  const processQueuedSubmissions = useCallback(async () => {
    if (!isOnline || queuedSubmissions.length === 0) return;

    const successfulSubmissions: string[] = [];

    for (const submission of queuedSubmissions) {
      try {
        const response = await fetch(submission.url, {
          method: submission.method,
          headers: submission.headers,
          body: JSON.stringify(submission.body)
        });

        if (response.ok) {
          successfulSubmissions.push(submission.id);
          await removeQueuedSubmission(submission.id);
        }
      } catch (error) {
        console.error('Failed to process queued submission:', submission.id, error);
      }
    }

    // Remove successful submissions from state
    setQueuedSubmissions(prev => 
      prev.filter(submission => !successfulSubmissions.includes(submission.id))
    );
  }, [isOnline, queuedSubmissions]);

  // Process queued submissions when coming back online
  useEffect(() => {
    if (isOnline) {
      processQueuedSubmissions();
    }
  }, [isOnline, processQueuedSubmissions]);

  return {
    queueSubmission,
    queuedSubmissions,
    processQueuedSubmissions
  };
}

// Offline data caching hook
export function useOfflineCache<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { isOnline } = useNetworkStatus();

  const fetchData = useCallback(async (forceRefresh = false) => {
    // Check cache first
    const cachedData = await getCachedData(key);
    const cacheAge = cachedData ? Date.now() - cachedData.timestamp : Infinity;
    const maxCacheAge = 5 * 60 * 1000; // 5 minutes

    if (cachedData && !forceRefresh && cacheAge < maxCacheAge) {
      setData(cachedData.data);
      setLastUpdated(new Date(cachedData.timestamp));
      return;
    }

    // If offline and no cache, return cached data or null
    if (!isOnline && !cachedData) {
      setData(null);
      setError(new Error('No cached data available offline'));
      return;
    }

    // If offline but have cache, use it
    if (!isOnline && cachedData) {
      setData(cachedData.data);
      setLastUpdated(new Date(cachedData.timestamp));
      return;
    }

    // Fetch fresh data
    setIsLoading(true);
    setError(null);

    try {
      const freshData = await fetcher();
      setData(freshData);
      setLastUpdated(new Date());

      // Cache the data
      await cacheData(key, freshData);
    } catch (err) {
      setError(err as Error);
      
      // If fetch fails and we have cached data, use it
      if (cachedData) {
        setData(cachedData.data);
        setLastUpdated(new Date(cachedData.timestamp));
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, isOnline]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refetch: () => fetchData(true),
    isStale: lastUpdated ? Date.now() - lastUpdated.getTime() > 5 * 60 * 1000 : false
  };
}

// IndexedDB utilities
async function storeQueuedSubmission(submission: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MukuruKYC', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['queuedSubmissions'], 'readwrite');
      const store = transaction.objectStore('queuedSubmissions');
      const addRequest = store.add(submission);
      
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('queuedSubmissions')) {
        db.createObjectStore('queuedSubmissions', { keyPath: 'id' });
      }
    };
  });
}

async function removeQueuedSubmission(id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MukuruKYC', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['queuedSubmissions'], 'readwrite');
      const store = transaction.objectStore('queuedSubmissions');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

async function cacheData(key: string, data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MukuruKYC', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const addRequest = store.put({
        key,
        data,
        timestamp: Date.now()
      });
      
      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    };
  });
}

async function getCachedData(key: string): Promise<{ data: any; timestamp: number } | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MukuruKYC', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const getRequest = store.get(key);
      
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        resolve(result ? { data: result.data, timestamp: result.timestamp } : null);
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
}

// Offline indicator component hook
export function useOfflineIndicator() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
    } else if (isSlowConnection) {
      setShowIndicator(true);
      // Hide slow connection indicator after 3 seconds
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowIndicator(false);
    }
  }, [isOnline, isSlowConnection]);

  return {
    showIndicator,
    isOnline,
    isSlowConnection,
    message: !isOnline 
      ? 'You are offline. Some features may be limited.' 
      : isSlowConnection 
        ? 'Slow connection detected. Loading may take longer.'
        : ''
  };
}
