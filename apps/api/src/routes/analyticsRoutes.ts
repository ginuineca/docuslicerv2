import express from 'express'
import { z } from 'zod'
import { asyncHandler, ValidationError } from '../middleware/errorHandler'
import { AnalyticsService } from '../services/analyticsService'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

const router = express.Router()
const analyticsService = new AnalyticsService()

// Validation schemas
const trackEventSchema = z.object({
  eventType: z.enum(['page_view', 'file_upload', 'file_download', 'pdf_process', 'ai_operation', 'collaboration', 'security_operation', 'error']),
  category: z.enum(['user', 'system', 'performance', 'security', 'collaboration']),
  action: z.string().min(1),
  label: z.string().optional(),
  value: z.number().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  duration: z.number().optional()
})

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['day', 'week', 'month']).optional()
})

/**
 * Track an analytics event
 */
router.post('/track', asyncHandler(async (req, res) => {
  const eventData = trackEventSchema.parse(req.body)
  
  // Add IP address from request if not provided
  if (!eventData.ipAddress) {
    eventData.ipAddress = req.ip || req.connection.remoteAddress
  }
  
  // Add user agent from request if not provided
  if (!eventData.userAgent) {
    eventData.userAgent = req.get('User-Agent')
  }

  analyticsService.trackEvent(eventData)

  res.status(201).json({
    success: true,
    message: 'Event tracked successfully',
    eventType: eventData.eventType,
    action: eventData.action
  })
}))

/**
 * Get analytics dashboard
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const { period = 'week' } = req.query
  
  if (!['day', 'week', 'month'].includes(period as string)) {
    throw new ValidationError('Invalid period. Must be day, week, or month')
  }

  const dashboard = analyticsService.generateDashboard(period as 'day' | 'week' | 'month')

  res.json({
    success: true,
    dashboard,
    period,
    generatedAt: new Date().toISOString()
  })
}))

/**
 * Get usage metrics
 */
router.get('/metrics/usage', asyncHandler(async (req, res) => {
  const { startDate, endDate, period } = dateRangeSchema.parse(req.query)
  
  const { start, end } = getDateRange(startDate, endDate, period)
  const metrics = analyticsService.getUsageMetrics(start, end)

  res.json({
    success: true,
    metrics,
    period: {
      startDate: start,
      endDate: end
    }
  })
}))

/**
 * Get processing metrics
 */
router.get('/metrics/processing', asyncHandler(async (req, res) => {
  const { startDate, endDate, period } = dateRangeSchema.parse(req.query)
  
  const { start, end } = getDateRange(startDate, endDate, period)
  const metrics = analyticsService.getProcessingMetrics(start, end)

  res.json({
    success: true,
    metrics,
    period: {
      startDate: start,
      endDate: end
    }
  })
}))

/**
 * Get performance metrics
 */
router.get('/metrics/performance', asyncHandler(async (req, res) => {
  const { startDate, endDate, period } = dateRangeSchema.parse(req.query)
  
  const { start, end } = getDateRange(startDate, endDate, period)
  const metrics = analyticsService.getPerformanceMetrics(start, end)

  res.json({
    success: true,
    metrics,
    period: {
      startDate: start,
      endDate: end
    }
  })
}))

/**
 * Get security metrics
 */
router.get('/metrics/security', asyncHandler(async (req, res) => {
  const { startDate, endDate, period } = dateRangeSchema.parse(req.query)
  
  const { start, end } = getDateRange(startDate, endDate, period)
  const metrics = analyticsService.getSecurityMetrics(start, end)

  res.json({
    success: true,
    metrics,
    period: {
      startDate: start,
      endDate: end
    }
  })
}))

/**
 * Get collaboration metrics
 */
router.get('/metrics/collaboration', asyncHandler(async (req, res) => {
  const { startDate, endDate, period } = dateRangeSchema.parse(req.query)
  
  const { start, end } = getDateRange(startDate, endDate, period)
  const metrics = analyticsService.getCollaborationMetrics(start, end)

  res.json({
    success: true,
    metrics,
    period: {
      startDate: start,
      endDate: end
    }
  })
}))

/**
 * Get time series data for trends
 */
router.get('/trends/:metric', asyncHandler(async (req, res) => {
  const { metric } = req.params
  const { startDate, endDate, period, interval = 'day' } = req.query

  if (!['usage', 'processing', 'performance', 'errors'].includes(metric)) {
    throw new ValidationError('Invalid metric. Must be usage, processing, performance, or errors')
  }

  if (!['hour', 'day', 'week'].includes(interval as string)) {
    throw new ValidationError('Invalid interval. Must be hour, day, or week')
  }

  const { start, end } = getDateRange(startDate as string, endDate as string, period as string)
  const timeSeriesData = analyticsService.getTimeSeriesData(
    start,
    end,
    metric as 'usage' | 'processing' | 'performance' | 'errors',
    interval as 'hour' | 'day' | 'week'
  )

  res.json({
    success: true,
    metric,
    interval,
    data: timeSeriesData,
    period: {
      startDate: start,
      endDate: end
    }
  })
}))

/**
 * Get analytics summary
 */
router.get('/summary', asyncHandler(async (req, res) => {
  const summary = analyticsService.getSummary()

  res.json({
    success: true,
    summary,
    timestamp: new Date().toISOString()
  })
}))

/**
 * Export analytics data
 */
router.get('/export', asyncHandler(async (req, res) => {
  const { format = 'json' } = req.query

  if (!['json', 'csv'].includes(format as string)) {
    throw new ValidationError('Invalid format. Must be json or csv')
  }

  const exportData = await analyticsService.exportData(format as 'json' | 'csv')
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')
  const filename = `docuslicer-analytics-${timestamp}.${format}`

  res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(exportData)
}))

/**
 * Get real-time analytics
 */
router.get('/realtime', asyncHandler(async (req, res) => {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  const realtimeData = {
    activeUsers: analyticsService.getUsageMetrics(oneHourAgo, now).activeUsers,
    currentSessions: analyticsService.getUsageMetrics(oneHourAgo, now).totalSessions,
    recentEvents: analyticsService.getTimeSeriesData(oneHourAgo, now, 'usage', 'hour'),
    systemHealth: {
      responseTime: analyticsService.getPerformanceMetrics(oneHourAgo, now).responseTime.average,
      errorRate: analyticsService.getPerformanceMetrics(oneHourAgo, now).errorRate,
      memoryUsage: analyticsService.getPerformanceMetrics(oneHourAgo, now).memoryUsage.percentage
    }
  }

  res.json({
    success: true,
    realtime: realtimeData,
    timestamp: new Date().toISOString()
  })
}))

/**
 * Get top operations
 */
router.get('/insights/operations', asyncHandler(async (req, res) => {
  const { startDate, endDate, period, limit = 10 } = req.query
  
  const { start, end } = getDateRange(startDate as string, endDate as string, period as string)
  const dashboard = analyticsService.generateDashboard('week') // Use week as default for insights
  
  const topOperations = dashboard.insights.topOperations.slice(0, parseInt(limit as string))

  res.json({
    success: true,
    topOperations,
    period: {
      startDate: start,
      endDate: end
    }
  })
}))

/**
 * Get top users
 */
router.get('/insights/users', asyncHandler(async (req, res) => {
  const { startDate, endDate, period, limit = 10 } = req.query
  
  const { start, end } = getDateRange(startDate as string, endDate as string, period as string)
  const dashboard = analyticsService.generateDashboard('week')
  
  const topUsers = dashboard.insights.topUsers.slice(0, parseInt(limit as string))

  res.json({
    success: true,
    topUsers,
    period: {
      startDate: start,
      endDate: end
    }
  })
}))

/**
 * Get error patterns
 */
router.get('/insights/errors', asyncHandler(async (req, res) => {
  const { startDate, endDate, period } = req.query
  
  const { start, end } = getDateRange(startDate as string, endDate as string, period as string)
  const dashboard = analyticsService.generateDashboard('week')

  res.json({
    success: true,
    errorPatterns: dashboard.insights.errorPatterns,
    period: {
      startDate: start,
      endDate: end
    }
  })
}))

/**
 * Get recommendations
 */
router.get('/insights/recommendations', asyncHandler(async (req, res) => {
  const dashboard = analyticsService.generateDashboard('week')

  res.json({
    success: true,
    recommendations: dashboard.insights.recommendations,
    generatedAt: new Date().toISOString()
  })
}))

/**
 * Get analytics capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    capabilities: {
      tracking: {
        supported: true,
        eventTypes: ['page_view', 'file_upload', 'file_download', 'pdf_process', 'ai_operation', 'collaboration', 'security_operation', 'error'],
        categories: ['user', 'system', 'performance', 'security', 'collaboration'],
        features: [
          'Real-time event tracking',
          'Custom metadata support',
          'User session tracking',
          'IP and user agent capture'
        ]
      },
      metrics: {
        supported: true,
        types: ['usage', 'processing', 'performance', 'security', 'collaboration'],
        features: [
          'Time-based metrics',
          'Aggregated statistics',
          'Percentile calculations',
          'Trend analysis'
        ]
      },
      dashboard: {
        supported: true,
        periods: ['day', 'week', 'month'],
        features: [
          'Comprehensive overview',
          'Interactive charts',
          'Real-time updates',
          'Custom date ranges'
        ]
      },
      insights: {
        supported: true,
        features: [
          'Top operations analysis',
          'User behavior patterns',
          'Error pattern detection',
          'Automated recommendations'
        ]
      },
      export: {
        supported: true,
        formats: ['json', 'csv'],
        features: [
          'Full data export',
          'Filtered exports',
          'Scheduled exports',
          'Custom formatting'
        ]
      }
    },
    limits: {
      maxEventsInMemory: 100000,
      dataRetention: '90 days',
      realTimeWindow: '1 hour',
      maxExportSize: '10MB'
    }
  })
})

/**
 * Health check for analytics service
 */
router.get('/health', (req, res) => {
  const summary = analyticsService.getSummary()
  
  res.json({
    success: true,
    status: 'healthy',
    service: 'analytics',
    eventsTracked: summary.totalEvents,
    eventsToday: summary.eventsToday,
    activeUsers: summary.activeUsers,
    timestamp: new Date().toISOString()
  })
})

/**
 * Utility function to get date range
 */
function getDateRange(startDate?: string, endDate?: string, period?: string): { start: Date; end: Date } {
  const now = new Date()
  
  if (startDate && endDate) {
    return {
      start: new Date(startDate),
      end: new Date(endDate)
    }
  }
  
  switch (period) {
    case 'day':
      return {
        start: startOfDay(now),
        end: endOfDay(now)
      }
    case 'week':
      return {
        start: subDays(now, 7),
        end: now
      }
    case 'month':
      return {
        start: subDays(now, 30),
        end: now
      }
    default:
      return {
        start: subDays(now, 7), // Default to last week
        end: now
      }
  }
}

export default router
