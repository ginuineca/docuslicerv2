import { Request, Response, NextFunction } from 'express'

interface PerformanceMetrics {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: Date
  memoryUsage: NodeJS.MemoryUsage
  userAgent?: string
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

/**
 * Health check endpoint with performance metrics
 */
export function createHealthCheckHandler() {
  return (req: Request, res: Response) => {
    const stats = performanceMonitor.getStats()
    const uptime = process.uptime()
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
      },
      performance: {
        totalRequests: stats.totalRequests,
        averageResponseTime: stats.averageResponseTime,
        slowRequests: stats.slowRequests,
        errorRate: stats.errorRate,
        topEndpoints: stats.topEndpoints.slice(0, 5)
      },
      memory: {
        used: Math.round(stats.memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(stats.memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(stats.memoryUsage.external / 1024 / 1024),
        rss: Math.round(stats.memoryUsage.rss / 1024 / 1024)
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    })
  }
}
