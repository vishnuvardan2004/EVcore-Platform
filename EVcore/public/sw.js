
const CACHE_NAME = 'vehicle-tracker-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Background sync for pending submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-submissions') {
    event.waitUntil(syncPendingSubmissions());
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  // Properly handle messages and ensure response is sent
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SYNC_REQUEST':
        syncPendingSubmissions()
          .then(() => {
            // Send response back to main thread
            event.ports[0]?.postMessage({ success: true });
          })
          .catch((error) => {
            event.ports[0]?.postMessage({ success: false, error: error.message });
          });
        break;
      default:
        // Always send a response to prevent channel close errors
        event.ports[0]?.postMessage({ success: true, message: 'Unknown message type' });
    }
  }
});

async function syncPendingSubmissions() {
  try {
    // This will be handled by the main app
    console.log('Background sync triggered');
    
    // Get pending submissions from IndexedDB or localStorage
    const pendingData = await self.registration.sync.getTags();
    console.log('Pending sync tags:', pendingData);
    
    // For now, just log - the actual sync logic should be implemented
    return Promise.resolve();
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}
