const CACHE_NAME = 'docuslicer-v1.1.0'
const OFFLINE_URL = '/offline.html'
const API_CACHE_NAME = 'docuslicer-api-v1.1.0'
const IMAGE_CACHE_NAME = 'docuslicer-images-v1.1.0'

// Resources to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Critical CSS and JS will be added by webpack
]

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
}

// API endpoints that should work offline
const OFFLINE_FALLBACK_PAGES = [
  '/dashboard',
  '/workflows',
  '/templates',
  '/documents'
]

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static resources')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('Service Worker: Installation complete')
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activation complete')
        return self.clients.claim()
      })
  )
})

// Advanced fetch event handler with intelligent caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return
  }

  // Handle different types of requests with appropriate strategies
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request))
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAssetRequest(request))
  } else {
    event.respondWith(handleGenericRequest(request))
  }
})

// Handle navigation requests with network-first strategy
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request)
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    return caches.match(OFFLINE_URL)
  }
}

// Handle API requests with stale-while-revalidate strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(() => {
    // Return cached version if network fails
    return cachedResponse
  })

  // Return cached version immediately if available, then update in background
  if (cachedResponse) {
    fetchPromise.catch(() => {}) // Prevent unhandled promise rejection
    return cachedResponse
  }

  return fetchPromise
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const response = await fetch(request)
    if (response.status === 200) {
      // Only cache successful image responses
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    // Return a placeholder image for failed requests
    return new Response(
      '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="#9ca3af">Image unavailable</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAssetRequest(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const response = await fetch(request)
    if (response.status === 200) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response('Asset unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Handle generic requests
async function handleGenericRequest(request) {
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Resource unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// Utility functions
function isImageRequest(request) {
  return request.destination === 'image' ||
         /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(new URL(request.url).pathname)
}

function isStaticAsset(request) {
  return request.destination === 'script' ||
         request.destination === 'style' ||
         request.destination === 'font' ||
         /\.(js|css|woff|woff2|ttf|eot)$/i.test(new URL(request.url).pathname)
}

  // Handle static assets
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          return fetch(request)
            .then(response => {
              if (response.status === 200) {
                const responseClone = response.clone()
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(request, responseClone)
                  })
              }
              return response
            })
        })
        .catch(() => {
          // Return a fallback for failed asset requests
          if (request.destination === 'image') {
            return new Response(
              '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="#9ca3af">Image unavailable</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            )
          }
          return new Response('Resource unavailable offline', { status: 503 })
        })
    )
    return
  }

  // Default: try network first, then cache
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseClone)
            })
        }
        return response
      })
      .catch(() => {
        return caches.match(request)
      })
  )
})

// Handle API requests with offline fallbacks
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Try network first
    const response = await fetch(request)
    
    // Cache successful GET requests
    if (request.method === 'GET' && response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Network failed, try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    
    // Return offline fallback for specific endpoints
    return handleOfflineApiRequest(url.pathname, request.method)
  }
}

// Provide offline fallbacks for API requests
function handleOfflineApiRequest(pathname, method) {
  // Documents API
  if (pathname.startsWith('/api/documents')) {
    if (method === 'GET') {
      return new Response(JSON.stringify({
        documents: getOfflineDocuments(),
        offline: true,
        message: 'Showing cached documents. Connect to internet for latest data.'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // Workflows API
  if (pathname.startsWith('/api/workflows')) {
    if (method === 'GET') {
      return new Response(JSON.stringify({
        workflows: getOfflineWorkflows(),
        offline: true,
        message: 'Showing cached workflows. Connect to internet for latest data.'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // Templates API
  if (pathname.startsWith('/api/templates')) {
    if (method === 'GET') {
      return new Response(JSON.stringify({
        templates: getOfflineTemplates(),
        offline: true,
        message: 'Showing cached templates. Connect to internet for latest data.'
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // Default offline response
  return new Response(JSON.stringify({
    error: 'Service unavailable offline',
    message: 'This feature requires an internet connection.',
    offline: true
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Get cached documents for offline use
function getOfflineDocuments() {
  return [
    {
      id: 'offline-doc-1',
      name: 'Cached Document 1.pdf',
      size: 1024000,
      type: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      status: 'cached'
    }
  ]
}

// Get cached workflows for offline use
function getOfflineWorkflows() {
  return [
    {
      id: 'offline-workflow-1',
      name: 'Basic PDF Processing',
      description: 'Simple PDF split and merge workflow',
      nodes: [],
      offline: true
    }
  ]
}

// Get cached templates for offline use
function getOfflineTemplates() {
  return [
    {
      id: 'offline-template-1',
      name: 'PDF Split Template',
      description: 'Split PDF into individual pages',
      category: 'document-processing',
      offline: true
    }
  ]
}

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'document-upload') {
    event.waitUntil(syncPendingUploads())
  }
  
  if (event.tag === 'workflow-save') {
    event.waitUntil(syncPendingWorkflows())
  }
})

// Sync pending uploads when online
async function syncPendingUploads() {
  try {
    // Get pending uploads from IndexedDB
    const pendingUploads = await getPendingUploads()
    
    for (const upload of pendingUploads) {
      try {
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: upload.formData
        })
        
        if (response.ok) {
          await removePendingUpload(upload.id)
          console.log('Service Worker: Synced upload', upload.id)
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync upload', upload.id, error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

// Sync pending workflows when online
async function syncPendingWorkflows() {
  try {
    // Get pending workflows from IndexedDB
    const pendingWorkflows = await getPendingWorkflows()
    
    for (const workflow of pendingWorkflows) {
      try {
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(workflow.data)
        })
        
        if (response.ok) {
          await removePendingWorkflow(workflow.id)
          console.log('Service Worker: Synced workflow', workflow.id)
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync workflow', workflow.id, error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Workflow sync failed', error)
  }
}

// IndexedDB helpers (simplified - would need full implementation)
async function getPendingUploads() {
  // Implementation would use IndexedDB to get pending uploads
  return []
}

async function removePendingUpload(id) {
  // Implementation would remove upload from IndexedDB
}

async function getPendingWorkflows() {
  // Implementation would use IndexedDB to get pending workflows
  return []
}

async function removePendingWorkflow(id) {
  // Implementation would remove workflow from IndexedDB
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'DocuSlicer notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open DocuSlicer',
        icon: '/icons/action-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('DocuSlicer', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
