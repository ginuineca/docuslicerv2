import { apiCache, MemoryCache } from './cache'

/**
 * Optimized API client with batching, caching, and intelligent retry logic
 */

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  cache?: boolean
  cacheTtl?: number
  retry?: boolean
  retryAttempts?: number
  retryDelay?: number
  timeout?: number
  priority?: number
  batch?: boolean
}

interface BatchRequest {
  id: string
  url: string
  config: RequestConfig
  resolve: (value: any) => void
  reject: (error: any) => void
  timestamp: number
}

class OptimizedApiClient {
  private static instance: OptimizedApiClient
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private requestQueue: BatchRequest[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private requestCache: MemoryCache<any>
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig> = []
  private responseInterceptors: Array<(response: any) => any> = []

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    }
    this.requestCache = apiCache
  }

  static getInstance(baseUrl?: string): OptimizedApiClient {
    if (!OptimizedApiClient.instance) {
      OptimizedApiClient.instance = new OptimizedApiClient(baseUrl)
    }
    return OptimizedApiClient.instance
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig) {
    this.requestInterceptors.push(interceptor)
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: (response: any) => any) {
    this.responseInterceptors.push(interceptor)
  }

  // Set default headers
  setDefaultHeaders(headers: Record<string, string>) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers }
  }

  // Main request method
  async request<T = any>(url: string, config: RequestConfig = {}): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`
    const requestId = `${config.method || 'GET'}_${fullUrl}_${JSON.stringify(config.body || {})}`

    // Apply request interceptors
    let processedConfig = { ...config }
    for (const interceptor of this.requestInterceptors) {
      processedConfig = interceptor(processedConfig)
    }

    // Check cache for GET requests
    if ((config.method || 'GET') === 'GET' && config.cache !== false) {
      const cached = this.requestCache.get(requestId)
      if (cached !== null) {
        return cached
      }
    }

    // Handle batching
    if (config.batch && (config.method || 'GET') === 'GET') {
      return this.addToBatch<T>(fullUrl, processedConfig)
    }

    // Execute request
    return this.executeRequest<T>(fullUrl, processedConfig, requestId)
  }

  // Execute individual request
  private async executeRequest<T>(
    url: string, 
    config: RequestConfig, 
    cacheKey: string
  ): Promise<T> {
    const controller = new AbortController()
    const timeout = config.timeout || 30000

    // Set timeout
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await this.fetchWithRetry(url, {
        method: config.method || 'GET',
        headers: { ...this.defaultHeaders, ...config.headers },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal
      }, config)

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      let data = await response.json()

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        data = interceptor(data)
      }

      // Cache successful GET requests
      if ((config.method || 'GET') === 'GET' && config.cache !== false) {
        this.requestCache.set(cacheKey, data, config.cacheTtl)
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // Fetch with intelligent retry
  private async fetchWithRetry(
    url: string, 
    init: RequestInit, 
    config: RequestConfig
  ): Promise<Response> {
    const maxAttempts = config.retry !== false ? (config.retryAttempts || 3) : 1
    const baseDelay = config.retryDelay || 1000

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(url, init)
        
        // Don't retry on client errors (4xx), only server errors (5xx) and network errors
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          return response
        }

        if (attempt === maxAttempts) {
          return response
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))

      } catch (error) {
        if (attempt === maxAttempts) {
          throw error
        }

        // Exponential backoff for network errors
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new Error('Max retry attempts reached')
  }

  // Add request to batch queue
  private addToBatch<T>(url: string, config: RequestConfig): Promise<T> {
    return new Promise((resolve, reject) => {
      const batchRequest: BatchRequest = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        config,
        resolve,
        reject,
        timestamp: Date.now()
      }

      this.requestQueue.push(batchRequest)

      // Sort by priority (higher priority first)
      this.requestQueue.sort((a, b) => (b.config.priority || 0) - (a.config.priority || 0))

      // Schedule batch processing
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), 50) // 50ms batch window
      }
    })
  }

  // Process batched requests
  private async processBatch() {
    if (this.requestQueue.length === 0) {
      this.batchTimer = null
      return
    }

    const batch = [...this.requestQueue]
    this.requestQueue = []
    this.batchTimer = null

    // Group requests by similar characteristics
    const groups = this.groupBatchRequests(batch)

    // Process each group
    for (const group of groups) {
      this.processBatchGroup(group)
    }
  }

  // Group batch requests for optimal processing
  private groupBatchRequests(requests: BatchRequest[]): BatchRequest[][] {
    const groups: BatchRequest[][] = []
    const maxGroupSize = 10

    // Simple grouping by URL pattern for now
    const urlGroups = new Map<string, BatchRequest[]>()

    requests.forEach(request => {
      const urlPattern = request.url.split('/').slice(0, -1).join('/')
      if (!urlGroups.has(urlPattern)) {
        urlGroups.set(urlPattern, [])
      }
      urlGroups.get(urlPattern)!.push(request)
    })

    // Split large groups
    urlGroups.forEach(group => {
      while (group.length > 0) {
        groups.push(group.splice(0, maxGroupSize))
      }
    })

    return groups
  }

  // Process a group of batched requests
  private async processBatchGroup(requests: BatchRequest[]) {
    // For now, execute requests in parallel with concurrency limit
    const concurrencyLimit = 5
    const chunks = []

    for (let i = 0; i < requests.length; i += concurrencyLimit) {
      chunks.push(requests.slice(i, i + concurrencyLimit))
    }

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(async request => {
          try {
            const result = await this.executeRequest(
              request.url,
              request.config,
              `${request.config.method || 'GET'}_${request.url}`
            )
            request.resolve(result)
          } catch (error) {
            request.reject(error)
          }
        })
      )
    }
  }

  // Convenience methods
  async get<T = any>(url: string, config: Omit<RequestConfig, 'method'> = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' })
  }

  async post<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'POST', body: data })
  }

  async put<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PUT', body: data })
  }

  async patch<T = any>(url: string, data?: any, config: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'PATCH', body: data })
  }

  async delete<T = any>(url: string, config: Omit<RequestConfig, 'method'> = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' })
  }

  // Upload with progress
  async upload(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('file', file)

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 100
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch {
            resolve(xhr.responseText)
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      xhr.open('POST', url.startsWith('http') ? url : `${this.baseUrl}${url}`)
      
      // Add default headers except Content-Type (let browser set it for FormData)
      Object.entries(this.defaultHeaders).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(key, value)
        }
      })

      xhr.send(formData)
    })
  }

  // Cancel all pending requests
  cancelAllRequests() {
    this.requestQueue.forEach(request => {
      request.reject(new Error('Request cancelled'))
    })
    this.requestQueue = []
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
  }

  // Get cache statistics
  getCacheStats() {
    return this.requestCache.getStats()
  }

  // Clear cache
  clearCache() {
    this.requestCache.clear()
  }

  // Prefetch data
  async prefetch(urls: string[], config: RequestConfig = {}) {
    const prefetchConfig = { ...config, cache: true, priority: -1 }
    
    const promises = urls.map(url => 
      this.request(url, prefetchConfig).catch(() => {
        // Ignore prefetch errors
      })
    )

    await Promise.allSettled(promises)
  }
}

// Global API client instance
export const api = OptimizedApiClient.getInstance()

// Add common interceptors
api.addRequestInterceptor((config) => {
  // Add authentication token if available
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    }
  }
  return config
})

api.addResponseInterceptor((response) => {
  // Handle common response transformations
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data
  }
  return response
})

// React hooks for API calls
export function useApi<T = any>(
  url: string | null, 
  config: RequestConfig = {}
) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const fetchData = React.useCallback(async () => {
    if (!url) return

    setLoading(true)
    setError(null)

    try {
      const result = await api.request<T>(url, config)
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [url, JSON.stringify(config)])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = React.useCallback(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

// Mutation hook
export function useMutation<T = any, V = any>(
  mutationFn: (variables: V) => Promise<T>
) {
  const [data, setData] = React.useState<T | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const mutate = React.useCallback(async (variables: V) => {
    setLoading(true)
    setError(null)

    try {
      const result = await mutationFn(variables)
      setData(result)
      return result
    } catch (err) {
      setError(err as Error)
      throw err
    } finally {
      setLoading(false)
    }
  }, [mutationFn])

  const reset = React.useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, mutate, reset }
}
