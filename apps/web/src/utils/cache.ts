/**
 * Advanced caching system for optimal performance
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of items
  strategy?: 'lru' | 'lfu' | 'fifo' // Eviction strategy
}

// Memory cache with intelligent eviction
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheItem<T>>()
  private options: Required<CacheOptions>

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: options.maxSize || 1000,
      strategy: options.strategy || 'lru'
    }
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now()
    const itemTtl = ttl || this.options.ttl

    // Remove expired items before adding new one
    this.cleanup()

    // Evict items if cache is full
    if (this.cache.size >= this.options.maxSize) {
      this.evict()
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: itemTtl,
      accessCount: 0,
      lastAccessed: now
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    const now = Date.now()
    
    // Check if item has expired
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    // Update access statistics
    item.accessCount++
    item.lastAccessed = now

    return item.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    this.cleanup()
    return this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  private evict(): void {
    if (this.cache.size === 0) return

    let keyToEvict: string | null = null

    switch (this.options.strategy) {
      case 'lru': // Least Recently Used
        let oldestAccess = Date.now()
        this.cache.forEach((item, key) => {
          if (item.lastAccessed < oldestAccess) {
            oldestAccess = item.lastAccessed
            keyToEvict = key
          }
        })
        break

      case 'lfu': // Least Frequently Used
        let lowestCount = Infinity
        this.cache.forEach((item, key) => {
          if (item.accessCount < lowestCount) {
            lowestCount = item.accessCount
            keyToEvict = key
          }
        })
        break

      case 'fifo': // First In, First Out
        let oldestTimestamp = Date.now()
        this.cache.forEach((item, key) => {
          if (item.timestamp < oldestTimestamp) {
            oldestTimestamp = item.timestamp
            keyToEvict = key
          }
        })
        break
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict)
    }
  }

  getStats() {
    this.cleanup()
    
    let totalAccess = 0
    let avgAge = 0
    const now = Date.now()

    this.cache.forEach(item => {
      totalAccess += item.accessCount
      avgAge += now - item.timestamp
    })

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      totalAccess,
      avgAccessCount: this.cache.size > 0 ? totalAccess / this.cache.size : 0,
      avgAge: this.cache.size > 0 ? avgAge / this.cache.size : 0,
      hitRate: 0 // Would need to track hits/misses
    }
  }
}

// Global cache instances
export const documentCache = new MemoryCache<any>({ ttl: 10 * 60 * 1000, maxSize: 500 }) // 10 minutes
export const templateCache = new MemoryCache<any>({ ttl: 30 * 60 * 1000, maxSize: 200 }) // 30 minutes
export const userCache = new MemoryCache<any>({ ttl: 5 * 60 * 1000, maxSize: 100 }) // 5 minutes
export const apiCache = new MemoryCache<any>({ ttl: 2 * 60 * 1000, maxSize: 1000 }) // 2 minutes

// IndexedDB cache for persistent storage
export class IndexedDBCache {
  private dbName: string
  private version: number
  private db: IDBDatabase | null = null

  constructor(dbName: string = 'DocuSlicerCache', version: number = 1) {
    this.dbName = dbName
    this.version = version
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('ttl', 'ttl', { unique: false })
        }
      }
    })
  }

  async set(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      
      const item = {
        key,
        data,
        timestamp: Date.now(),
        ttl
      }

      const request = store.put(item)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async get(key: string): Promise<any | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly')
      const store = transaction.objectStore('cache')
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const item = request.result
        
        if (!item) {
          resolve(null)
          return
        }

        // Check if expired
        if (Date.now() - item.timestamp > item.ttl) {
          this.delete(key)
          resolve(null)
          return
        }

        resolve(item.data)
      }
    })
  }

  async delete(key: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.delete(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async cleanup(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      const index = store.index('timestamp')
      const request = index.openCursor()

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        
        if (cursor) {
          const item = cursor.value
          if (Date.now() - item.timestamp > item.ttl) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
    })
  }
}

// Global IndexedDB cache
export const persistentCache = new IndexedDBCache()

// Cache decorator for functions
export function cached<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    cache?: MemoryCache
    keyGenerator?: (...args: Parameters<T>) => string
    ttl?: number
  } = {}
): T {
  const cache = options.cache || apiCache
  const keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args))
  const ttl = options.ttl

  return ((...args: Parameters<T>) => {
    const key = `${fn.name}_${keyGenerator(...args)}`
    
    // Try to get from cache first
    const cached = cache.get(key)
    if (cached !== null) {
      return cached
    }

    // Execute function and cache result
    const result = fn(...args)
    
    // Handle promises
    if (result instanceof Promise) {
      return result.then(data => {
        cache.set(key, data, ttl)
        return data
      })
    }

    cache.set(key, result, ttl)
    return result
  }) as T
}

// React hook for cached API calls
export function useCachedApi<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    cache?: MemoryCache
    ttl?: number
    enabled?: boolean
  } = {}
) {
  const cache = options.cache || apiCache
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (options.enabled === false) return

    // Check cache first
    const cached = cache.get(key)
    if (cached !== null) {
      setData(cached)
      return
    }

    // Fetch data
    setLoading(true)
    setError(null)

    fetcher()
      .then(result => {
        cache.set(key, result, options.ttl)
        setData(result)
      })
      .catch(err => {
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [key, options.enabled, options.ttl])

  const invalidate = React.useCallback(() => {
    cache.delete(key)
  }, [key, cache])

  const refetch = React.useCallback(() => {
    cache.delete(key)
    setData(null)
    setError(null)
    
    setLoading(true)
    fetcher()
      .then(result => {
        cache.set(key, result, options.ttl)
        setData(result)
      })
      .catch(err => {
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [key, fetcher, options.ttl, cache])

  return { data, loading, error, invalidate, refetch }
}

// Cache warming utilities
export class CacheWarmer {
  private static instance: CacheWarmer
  private warmingQueue: Array<{ key: string; fetcher: () => Promise<any>; priority: number }> = []
  private isWarming = false

  static getInstance(): CacheWarmer {
    if (!CacheWarmer.instance) {
      CacheWarmer.instance = new CacheWarmer()
    }
    return CacheWarmer.instance
  }

  addToWarmingQueue(key: string, fetcher: () => Promise<any>, priority: number = 1) {
    this.warmingQueue.push({ key, fetcher, priority })
    this.warmingQueue.sort((a, b) => b.priority - a.priority)
    
    if (!this.isWarming) {
      this.processQueue()
    }
  }

  private async processQueue() {
    if (this.warmingQueue.length === 0) {
      this.isWarming = false
      return
    }

    this.isWarming = true
    const { key, fetcher } = this.warmingQueue.shift()!

    try {
      const data = await fetcher()
      apiCache.set(key, data)
    } catch (error) {
      console.warn(`Cache warming failed for key: ${key}`, error)
    }

    // Process next item with a small delay to avoid overwhelming the system
    setTimeout(() => this.processQueue(), 100)
  }

  warmCriticalData() {
    // Warm up critical data that users are likely to need
    this.addToWarmingQueue('user-profile', () => fetch('/api/user/profile').then(r => r.json()), 10)
    this.addToWarmingQueue('workflow-templates', () => fetch('/api/templates').then(r => r.json()), 8)
    this.addToWarmingQueue('recent-documents', () => fetch('/api/documents/recent').then(r => r.json()), 6)
  }
}

// Initialize cache warming on app start
export const cacheWarmer = CacheWarmer.getInstance()

// Cleanup expired cache items periodically
setInterval(() => {
  documentCache.size() // Triggers cleanup
  templateCache.size()
  userCache.size()
  apiCache.size()
  persistentCache.cleanup()
}, 5 * 60 * 1000) // Every 5 minutes
