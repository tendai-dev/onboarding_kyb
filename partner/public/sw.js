// Service Worker for offline capabilities
const CACHE_NAME = 'mukuru-kyc-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/admin/dashboard',
  '/customer/dashboard',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/mukuru-logo.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        // Cache each URL individually to handle failures gracefully
        return Promise.allSettled(
          STATIC_CACHE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null; // Continue even if one fails
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error);
        // Still skip waiting to activate the service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/offline.html');
            }
            
            // Return a generic offline response for other requests
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'form-sync') {
    event.waitUntil(
      // Process queued form submissions
      processQueuedSubmissions()
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/mukuru-logo.png',
      badge: '/mukuru-logo.png',
      tag: data.tag,
      data: data.data,
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Helper function to process queued submissions
async function processQueuedSubmissions() {
  try {
    const queuedSubmissions = await getQueuedSubmissions();
    
    for (const submission of queuedSubmissions) {
      try {
        const response = await fetch(submission.url, {
          method: submission.method,
          headers: submission.headers,
          body: submission.body
        });

        if (response.ok) {
          await removeQueuedSubmission(submission.id);
          console.log('Successfully synced submission:', submission.id);
        }
      } catch (error) {
        console.error('Failed to sync submission:', submission.id, error);
      }
    }
  } catch (error) {
    console.error('Error processing queued submissions:', error);
  }
}

// IndexedDB utilities for offline storage
const DB_NAME = 'MukuruKYC';
const DB_VERSION = 1;
const STORES = {
  FORM_DATA: 'formData',
  QUEUED_SUBMISSIONS: 'queuedSubmissions',
  CACHED_DOCUMENTS: 'cachedDocuments'
};

// Initialize IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Form data store
      if (!db.objectStoreNames.contains(STORES.FORM_DATA)) {
        const formStore = db.createObjectStore(STORES.FORM_DATA, { keyPath: 'id' });
        formStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Queued submissions store
      if (!db.objectStoreNames.contains(STORES.QUEUED_SUBMISSIONS)) {
        const queueStore = db.createObjectStore(STORES.QUEUED_SUBMISSIONS, { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Cached documents store
      if (!db.objectStoreNames.contains(STORES.CACHED_DOCUMENTS)) {
        const docStore = db.createObjectStore(STORES.CACHED_DOCUMENTS, { keyPath: 'id' });
        docStore.createIndex('url', 'url', { unique: true });
        docStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Generic IndexedDB operations
async function addToStore(storeName: string, data: any): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  
  return new Promise((resolve, reject) => {
    const request = store.add(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getFromStore(storeName: string, key: string): Promise<any> {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllFromStore(storeName: string): Promise<any[]> {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removeFromStore(storeName: string, key: string): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Specific functions for queued submissions
async function queueSubmission(submission: any): Promise<void> {
  const queuedSubmission = {
    id: `submission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...submission,
    timestamp: Date.now()
  };
  
  await addToStore(STORES.QUEUED_SUBMISSIONS, queuedSubmission);
}

async function getQueuedSubmissions(): Promise<any[]> {
  return await getAllFromStore(STORES.QUEUED_SUBMISSIONS);
}

async function removeQueuedSubmission(id: string): Promise<void> {
  await removeFromStore(STORES.QUEUED_SUBMISSIONS, id);
}

// Export for use in main thread
if (typeof self !== 'undefined') {
  (self as any).queueSubmission = queueSubmission;
  (self as any).getQueuedSubmissions = getQueuedSubmissions;
  (self as any).removeQueuedSubmission = removeQueuedSubmission;
}
