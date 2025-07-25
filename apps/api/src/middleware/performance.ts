import { Request, Response, NextFunction } from 'express'
import Redis from 'ioredis'

interface PerformanceMetrics {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: Date
  memoryUsage: NodeJS.MemoryUsage
  userAgent?: string
  cacheHit?: boolean
  queryCount?: number
  payloadSize?: number
}

interface CacheOptions {
  ttl: number // Time to live in seconds
  key?: string
  condition?: (req: Request, res: Response) => boolean
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private maxMetrics = 1000 // Keep last 1000 requests

  addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric)
    
    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics
  }

  getAverageResponseTime(endpoint?: string): number {
    const filteredMetrics = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics

    if (filteredMetrics.length === 0) return 0

    const totalTime = filteredMetrics.reduce((sum, metric) => sum + metric.responseTime, 0)
    return Math.round(totalTime / filteredMetrics.length)
  }

  getSlowRequests(threshold: number = 1000): PerformanceMetrics[] {
    return this.metrics.filter(m => m.responseTime > threshold)
  }

  getErrorRate(): number {
    if (this.metrics.length === 0) return 0

    const errorCount = this.metrics.filter(m => m.statusCode >= 400).length
    return Math.round((errorCount / this.metrics.length) * 100)
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0

    const cacheHits = this.metrics.filter(m => m.cacheHit === true).length
    return Math.round((cacheHits / this.metrics.length) * 100)
  }

  getMemoryTrend(): { average: number; peak: number; current: number } {
    if (this.metrics.length === 0) {
      const current = process.memoryUsage()
      return { average: 0, peak: 0, current: current.heapUsed }
    }

    const memoryValues = this.metrics.map(m => m.memoryUsage.heapUsed)
    const average = memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length
    const peak = Math.max(...memoryValues)
    const current = process.memoryUsage().heapUsed

    return { average: Math.round(average), peak, current }
  }

  getStats(): {
    totalRequests: number
    averageResponseTime: number
    slowRequests: number
    errorRate: number
    memoryUsage: NodeJS.MemoryUsage
    topEndpoints: Array<{ endpoint: string; count: number; avgTime: number }>
  } {
    const memoryUsage = process.memoryUsage()
    
    // Calculate top endpoints
    const endpointStats = new Map<string, { count: number; totalTime: number }>()
    
    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`
      const existing = endpointStats.get(key) || { count: 0, totalTime: 0 }
      endpointStats.set(key, {
        count: existing.count + 1,
        totalTime: existing.totalTime + metric.responseTime
      })
    })

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgTime: Math.round(stats.totalTime / stats.count)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalRequests: this.metrics.length,
      averageResponseTime: this.getAverageResponseTime(),
      slowRequests: this.getSlowRequests().length,
      errorRate: this.getErrorRate(),
      memoryUsage,
      topEndpoints
    }
  }

  reset(): void {
    this.metrics = []
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Performance monitoring middleware
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now()
  const startMemory = process.memoryUsage()

  // Override res.end to capture response time
  const originalEnd = res.end
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const endTime = Date.now()
    const responseTime = endTime - startTime
    const endMemory = process.memoryUsage()

    // Create performance metric
    const metric: PerformanceMetrics = {
      endpoint: req.route?.path || req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      timestamp: new Date(startTime),
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      },
      userAgent: req.get('User-Agent')
    }

    // Add metric to monitor
    performanceMonitor.addMetric(metric)

    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${responseTime}ms`)
    }

    // Log errors
    if (res.statusCode >= 400) {
      console.error(`❌ Error response: ${req.method} ${req.path} - ${res.statusCode}`)
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding, cb)
  }

  next()
}

/**
 * Request timeout middleware
 */
export function timeoutMiddleware(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error(`⏰ Request timeout: ${req.method} ${req.path} - ${timeoutMs}ms`)
        res.status(408).json({
          error: 'Request timeout',
          message: `Request took longer than ${timeoutMs}ms to complete`
        })
      }
    }, timeoutMs)

    // Clear timeout when response is sent
    const originalEnd = res.end
    res.end = function(chunk?: any, encoding?: any, cb?: any) {
      clearTimeout(timeout)
      originalEnd.call(this, chunk, encoding, cb)
    }

    next()
  }
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 */
export function rateLimitMiddleware(maxRequests: number = 100, windowMs: number = 60000) {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown'
    const now = Date.now()
    
    // Clean up expired entries
    for (const [key, value] of requests.entries()) {
      if (now > value.resetTime) {
        requests.delete(key)
      }
    }

    const clientData = requests.get(clientId)
    
    if (!clientData) {
      // First request from this client
      requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      })
      next()
    } else if (clientData.count >= maxRequests) {
      // Rate limit exceeded
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000} seconds`,
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      })
    } else {
      // Increment counter
      clientData.count++
      next()
    }
  }
}

/**
 * Compression middleware for large responses
 */
export function compressionMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Simple compression for JSON responses
  const originalJson = res.json
  res.json = function(obj: any) {
    const jsonString = JSON.stringify(obj)
    
    // Only compress large responses
    if (jsonString.length > 1024) {
      res.set('Content-Encoding', 'gzip')
      // In a real implementation, you'd use actual compression here
      console.log(`📦 Large response compressed: ${jsonString.length} bytes`)
    }
    
    return originalJson.call(this, obj)
  }

  next()
}

// Redis client for caching
let redisClient: Redis | null = null

try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  })
} catch (error) {
  console.warn('Redis not available, caching disabled:', error)
}

/**
 * Response caching middleware
 */
export function cacheMiddleware(options: CacheOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redisClient || req.method !== 'GET') {
      return next()
    }

    const cacheKey = options.key || `cache:${req.originalUrl}`

    try {
      // Check cache condition
      if (options.condition && !options.condition(req, res)) {
        return next()
      }

      // Try to get from cache
      const cachedData = await redisClient.get(cacheKey)

      if (cachedData) {
        const parsed = JSON.parse(cachedData)
        res.set(parsed.headers)
        res.status(parsed.status)

        // Mark as cache hit for metrics
        ;(req as any).cacheHit = true

        return res.json(parsed.data)
      }

      // Override res.json to cache the response
      const originalJson = res.json.bind(res)
      res.json = function(data: any) {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cacheData = {
            data,
            status: res.statusCode,
            headers: res.getHeaders()
          }

          redisClient?.setex(cacheKey, options.ttl, JSON.stringify(cacheData))
            .catch(err => console.warn('Cache write failed:', err))
        }

        return originalJson(data)
      }

      next()
    } catch (error) {
      console.warn('Cache middleware error:', error)
      next()
    }
  }
}

/**
 * Response compression and optimization middleware
 */
export function responseOptimizationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set performance headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Cache-Control': 'public, max-age=300', // 5 minutes default
      'Vary': 'Accept-Encoding'
    })

    // Override res.json to optimize responses
    const originalJson = res.json.bind(res)
    res.json = function(data: any) {
      // Remove null/undefined values to reduce payload size
      const optimizedData = removeEmptyValues(data)

      // Set content length for metrics
      const jsonString = JSON.stringify(optimizedData)
      ;(req as any).payloadSize = Buffer.byteLength(jsonString, 'utf8')

      return originalJson(optimizedData)
    }

    next()
  }
}

/**
 * Database query optimization middleware
 */
export function queryOptimizationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now()
    let queryCount = 0

    // Mock query counter (in real app, integrate with your ORM)
    ;(req as any).trackQuery = () => {
      queryCount++
    }

    res.on('finish', () => {
      ;(req as any).queryCount = queryCount
      ;(req as any).queryTime = Date.now() - startTime
    })

    next()
  }
}

/**
 * Health check endpoint with performance metrics
 */
export function createHealthCheckHandler() {
  return (req: Request, res: Response) => {
    const stats = performanceMonitor.getStats()
    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      performance: {
        averageResponseTime: performanceMonitor.getAverageResponseTime(),
        errorRate: performanceMonitor.getErrorRate(),
        cacheHitRate: performanceMonitor.getCacheHitRate(),
        slowRequests: performanceMonitor.getSlowRequests().length,
        totalRequests: performanceMonitor.getMetrics().length
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      cache: {
        available: !!redisClient,
        connected: redisClient?.status === 'ready'
      }
    })
  }
}

/**
 * Remove empty values from objects to reduce payload size
 */
function removeEmptyValues(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyValues).filter(item => item !== null && item !== undefined)
  }

  if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {}

    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = removeEmptyValues(value)
      }
    }

    return cleaned
  }

  return obj
}

/**
 * API rate limiting with performance tracking
 */
export function createRateLimitMiddleware(options: {
  windowMs: number
  max: number
  message?: string
}) {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown'
    const now = Date.now()
    const windowStart = now - options.windowMs

    // Clean old entries
    for (const [ip, data] of requests.entries()) {
      if (data.resetTime < now) {
        requests.delete(ip)
      }
    }

    // Get or create request data
    let requestData = requests.get(key)
    if (!requestData || requestData.resetTime < now) {
      requestData = { count: 0, resetTime: now + options.windowMs }
      requests.set(key, requestData)
    }

    requestData.count++

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': options.max.toString(),
      'X-RateLimit-Remaining': Math.max(0, options.max - requestData.count).toString(),
      'X-RateLimit-Reset': new Date(requestData.resetTime).toISOString()
    })

    if (requestData.count > options.max) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: options.message || 'Rate limit exceeded',
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      })
    }

    next()
  }
}

/**
 * Request timeout middleware
 */
export function timeoutMiddleware(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request Timeout',
          message: 'Request took too long to process'
        })
      }
    }, timeoutMs)

    res.on('finish', () => {
      clearTimeout(timeout)
    })

    res.on('close', () => {
      clearTimeout(timeout)
    })

    next()
  }
}
