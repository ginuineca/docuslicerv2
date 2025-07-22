import { Request, Response, NextFunction } from 'express'
import { AnalyticsService } from '../services/analyticsService'

// Create a global analytics service instance
const analyticsService = new AnalyticsService()

/**
 * Middleware to automatically track API requests
 */
export function analyticsTrackingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now()
  
  // Track the request
  const originalSend = res.send
  res.send = function(data) {
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Determine event type based on the request
    let eventType: 'page_view' | 'file_upload' | 'file_download' | 'pdf_process' | 'ai_operation' | 'collaboration' | 'security_operation' | 'error' = 'page_view'
    let category: 'user' | 'system' | 'performance' | 'security' | 'collaboration' = 'system'
    let action = `${req.method} ${req.path}`
    
    // Categorize based on URL patterns
    if (req.path.includes('/pdf/')) {
      eventType = 'pdf_process'
      category = 'user'
      
      if (req.path.includes('/ai-')) {
        eventType = 'ai_operation'
      }
    } else if (req.path.includes('/security/')) {
      eventType = 'security_operation'
      category = 'security'
    } else if (req.path.includes('/collaboration/')) {
      eventType = 'collaboration'
      category = 'collaboration'
    } else if (req.path.includes('/upload') || req.method === 'POST' && req.headers['content-type']?.includes('multipart')) {
      eventType = 'file_upload'
      category = 'user'
    } else if (req.path.includes('/download') || req.headers['content-disposition']?.includes('attachment')) {
      eventType = 'file_download'
      category = 'user'
    }
    
    // Check if this is an error response
    if (res.statusCode >= 400) {
      eventType = 'error'
      category = 'system'
    }
    
    // Extract metadata
    const metadata: Record<string, any> = {
      statusCode: res.statusCode,
      method: req.method,
      path: req.path,
      query: req.query,
      contentLength: res.get('content-length'),
      responseTime: duration
    }
    
    // Add file-specific metadata if available
    if (req.file) {
      metadata.fileSize = req.file.size
      metadata.fileName = req.file.originalname
      metadata.mimeType = req.file.mimetype
    }
    
    // Add error details if this is an error
    if (res.statusCode >= 400) {
      try {
        const responseData = JSON.parse(data.toString())
        if (responseData.error) {
          metadata.error = responseData.error
          metadata.errorMessage = responseData.message
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    
    // Track the event
    analyticsService.trackEvent({
      eventType,
      category,
      action,
      userId: req.headers['x-user-id'] as string, // Assuming user ID is passed in header
      sessionId: req.headers['x-session-id'] as string, // Assuming session ID is passed in header
      metadata,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      duration
    })
    
    return originalSend.call(this, data)
  }
  
  next()
}

/**
 * Middleware to track specific events with custom data
 */
export function trackCustomEvent(
  eventType: 'page_view' | 'file_upload' | 'file_download' | 'pdf_process' | 'ai_operation' | 'collaboration' | 'security_operation' | 'error',
  category: 'user' | 'system' | 'performance' | 'security' | 'collaboration',
  action: string,
  metadata?: Record<string, any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    analyticsService.trackEvent({
      eventType,
      category,
      action,
      userId: req.headers['x-user-id'] as string,
      sessionId: req.headers['x-session-id'] as string,
      metadata: {
        ...metadata,
        path: req.path,
        method: req.method,
        query: req.query
      },
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    })
    
    next()
  }
}

/**
 * Middleware to track performance metrics
 */
export function performanceTrackingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint()
  const startMemory = process.memoryUsage()
  
  const originalSend = res.send
  res.send = function(data) {
    const endTime = process.hrtime.bigint()
    const endMemory = process.memoryUsage()
    
    const duration = Number(endTime - startTime) / 1000000 // Convert to milliseconds
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed
    
    // Track performance event
    analyticsService.trackEvent({
      eventType: 'page_view',
      category: 'performance',
      action: 'api_request',
      metadata: {
        endpoint: `${req.method} ${req.path}`,
        responseTime: duration,
        memoryDelta,
        statusCode: res.statusCode,
        contentLength: res.get('content-length'),
        memoryUsage: {
          heapUsed: endMemory.heapUsed,
          heapTotal: endMemory.heapTotal,
          external: endMemory.external,
          rss: endMemory.rss
        }
      },
      duration,
      userId: req.headers['x-user-id'] as string,
      sessionId: req.headers['x-session-id'] as string,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    })
    
    return originalSend.call(this, data)
  }
  
  next()
}

/**
 * Middleware to track user sessions
 */
export function sessionTrackingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.headers['x-session-id'] as string
  const userId = req.headers['x-user-id'] as string
  
  if (sessionId && userId) {
    // Track session activity
    analyticsService.trackEvent({
      eventType: 'page_view',
      category: 'user',
      action: 'session_activity',
      userId,
      sessionId,
      metadata: {
        endpoint: `${req.method} ${req.path}`,
        timestamp: new Date().toISOString()
      },
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    })
  }
  
  next()
}

/**
 * Middleware to track errors
 */
export function errorTrackingMiddleware(error: any, req: Request, res: Response, next: NextFunction): void {
  // Track the error
  analyticsService.trackEvent({
    eventType: 'error',
    category: 'system',
    action: 'unhandled_error',
    metadata: {
      error: error.name || 'UnknownError',
      message: error.message,
      stack: error.stack,
      endpoint: `${req.method} ${req.path}`,
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString()
    },
    userId: req.headers['x-user-id'] as string,
    sessionId: req.headers['x-session-id'] as string,
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip || req.connection.remoteAddress
  })
  
  next(error)
}

/**
 * Get the analytics service instance
 */
export function getAnalyticsService(): AnalyticsService {
  return analyticsService
}

/**
 * Track a custom event from anywhere in the application
 */
export function trackEvent(
  eventType: 'page_view' | 'file_upload' | 'file_download' | 'pdf_process' | 'ai_operation' | 'collaboration' | 'security_operation' | 'error',
  category: 'user' | 'system' | 'performance' | 'security' | 'collaboration',
  action: string,
  options?: {
    userId?: string
    sessionId?: string
    metadata?: Record<string, any>
    duration?: number
    value?: number
    label?: string
  }
): void {
  analyticsService.trackEvent({
    eventType,
    category,
    action,
    ...options
  })
}

/**
 * Middleware to add analytics headers to responses
 */
export function analyticsHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Add analytics-related headers
  res.setHeader('X-Analytics-Enabled', 'true')
  res.setHeader('X-Analytics-Version', '1.0')
  
  // Add request ID for tracking
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  res.setHeader('X-Request-ID', requestId)
  
  next()
}

/**
 * Middleware to track API usage patterns
 */
export function usagePatternMiddleware(req: Request, res: Response, next: NextFunction): void {
  const hour = new Date().getHours()
  const dayOfWeek = new Date().getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isBusinessHours = hour >= 9 && hour <= 17
  
  // Track usage patterns
  analyticsService.trackEvent({
    eventType: 'page_view',
    category: 'user',
    action: 'usage_pattern',
    metadata: {
      hour,
      dayOfWeek,
      isWeekend,
      isBusinessHours,
      endpoint: `${req.method} ${req.path}`,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer')
    },
    userId: req.headers['x-user-id'] as string,
    sessionId: req.headers['x-session-id'] as string,
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip || req.connection.remoteAddress
  })
  
  next()
}

export default {
  analyticsTrackingMiddleware,
  trackCustomEvent,
  performanceTrackingMiddleware,
  sessionTrackingMiddleware,
  errorTrackingMiddleware,
  analyticsHeadersMiddleware,
  usagePatternMiddleware,
  getAnalyticsService,
  trackEvent
}
