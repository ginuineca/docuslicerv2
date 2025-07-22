import express from 'express'
import { z } from 'zod'
import { asyncHandler, ValidationError } from '../middleware/errorHandler'
import { WebhookService } from '../services/webhookService'
import { trackEvent } from '../middleware/analyticsMiddleware'

const router = express.Router()
const webhookService = new WebhookService()

// Validation schemas
const webhookEndpointSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  secret: z.string().optional(),
  active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
  headers: z.record(z.string()).optional(),
  retryConfig: z.object({
    maxRetries: z.number().min(0).max(10).default(3),
    retryDelay: z.number().min(100).max(60000).default(1000),
    backoffMultiplier: z.number().min(1).max(5).default(2)
  }).optional(),
  filters: z.object({
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'regex']),
      value: z.string()
    })),
    logic: z.enum(['AND', 'OR']).default('AND')
  }).optional()
})

const webhookEventSchema = z.object({
  type: z.string().min(1),
  data: z.any(),
  source: z.string().default('api'),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

const integrationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['webhook', 'api', 'database', 'file', 'email', 'slack', 'teams', 'discord']),
  config: z.record(z.any()),
  active: z.boolean().default(true)
})

/**
 * Register a new webhook endpoint
 */
router.post('/webhooks', asyncHandler(async (req, res) => {
  const webhookData = webhookEndpointSchema.parse(req.body)
  
  try {
    const webhook = await webhookService.registerWebhook(webhookData)

    // Track webhook registration
    trackEvent('collaboration', 'system', 'webhook_registered', {
      userId: req.headers['x-user-id'] as string,
      webhookId: webhook.id,
      metadata: {
        url: webhook.url,
        events: webhook.events,
        hasSecret: !!webhook.secret,
        hasFilters: !!webhook.filters
      }
    })

    res.status(201).json({
      success: true,
      message: 'Webhook registered successfully',
      webhook: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt
      }
    })
  } catch (error) {
    throw new ValidationError(`Failed to register webhook: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get all webhooks
 */
router.get('/webhooks', asyncHandler(async (req, res) => {
  const webhooks = webhookService.getWebhooks()
  
  res.json({
    success: true,
    webhooks: webhooks.map(webhook => ({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
      createdAt: webhook.createdAt,
      updatedAt: webhook.updatedAt,
      hasSecret: !!webhook.secret,
      hasFilters: !!webhook.filters,
      metadata: webhook.metadata
    })),
    count: webhooks.length
  })
}))

/**
 * Get webhook by ID
 */
router.get('/webhooks/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const webhook = webhookService.getWebhook(id)

  if (!webhook) {
    return res.status(404).json({
      success: false,
      message: 'Webhook not found'
    })
  }

  res.json({
    success: true,
    webhook: {
      ...webhook,
      secret: webhook.secret ? '[REDACTED]' : undefined
    }
  })
}))

/**
 * Update webhook
 */
router.put('/webhooks/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const updates = webhookEndpointSchema.partial().parse(req.body)

  try {
    const webhook = await webhookService.updateWebhook(id, updates)

    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      })
    }

    res.json({
      success: true,
      message: 'Webhook updated successfully',
      webhook: {
        ...webhook,
        secret: webhook.secret ? '[REDACTED]' : undefined
      }
    })
  } catch (error) {
    throw new ValidationError(`Failed to update webhook: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Delete webhook
 */
router.delete('/webhooks/:id', asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const deleted = await webhookService.deleteWebhook(id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Webhook not found'
      })
    }

    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    })
  } catch (error) {
    throw new ValidationError(`Failed to delete webhook: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Trigger a webhook event
 */
router.post('/events', asyncHandler(async (req, res) => {
  const eventData = webhookEventSchema.parse(req.body)

  try {
    await webhookService.triggerEvent(eventData)

    res.status(202).json({
      success: true,
      message: 'Event triggered successfully',
      event: {
        type: eventData.type,
        source: eventData.source,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    throw new ValidationError(`Failed to trigger event: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get webhook deliveries
 */
router.get('/deliveries', asyncHandler(async (req, res) => {
  const { webhookId, status, limit = 50, offset = 0 } = req.query

  let deliveries = webhookService.getDeliveries(webhookId as string)

  // Filter by status if provided
  if (status) {
    deliveries = deliveries.filter(d => d.status === status)
  }

  // Apply pagination
  const total = deliveries.length
  const paginatedDeliveries = deliveries
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string))

  res.json({
    success: true,
    deliveries: paginatedDeliveries,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      hasMore: parseInt(offset as string) + parseInt(limit as string) < total
    }
  })
}))

/**
 * Get delivery by ID
 */
router.get('/deliveries/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const delivery = webhookService.getDelivery(id)

  if (!delivery) {
    return res.status(404).json({
      success: false,
      message: 'Delivery not found'
    })
  }

  res.json({
    success: true,
    delivery
  })
}))

/**
 * Retry a failed delivery
 */
router.post('/deliveries/:id/retry', asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const success = await webhookService.retryDelivery(id)

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found or cannot be retried'
      })
    }

    res.json({
      success: true,
      message: 'Delivery retry initiated'
    })
  } catch (error) {
    throw new ValidationError(`Failed to retry delivery: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Create integration
 */
router.post('/integrations', asyncHandler(async (req, res) => {
  const integrationData = integrationSchema.parse(req.body)

  try {
    const integration = await webhookService.createIntegration(integrationData)

    res.status(201).json({
      success: true,
      message: 'Integration created successfully',
      integration: {
        id: integration.id,
        name: integration.name,
        type: integration.type,
        active: integration.active,
        createdAt: integration.createdAt
      }
    })
  } catch (error) {
    throw new ValidationError(`Failed to create integration: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get all integrations
 */
router.get('/integrations', asyncHandler(async (req, res) => {
  const integrations = webhookService.getIntegrations()

  res.json({
    success: true,
    integrations: integrations.map(integration => ({
      id: integration.id,
      name: integration.name,
      type: integration.type,
      active: integration.active,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      lastUsed: integration.lastUsed,
      usageCount: integration.usageCount,
      successCount: integration.successCount,
      errorCount: integration.errorCount,
      successRate: integration.usageCount > 0 ? (integration.successCount / integration.usageCount) * 100 : 0
    })),
    count: integrations.length
  })
}))

/**
 * Execute integration
 */
router.post('/integrations/:id/execute', asyncHandler(async (req, res) => {
  const { id } = req.params
  const { data } = req.body

  try {
    const result = await webhookService.executeIntegration(id, data)

    res.json({
      success: true,
      message: 'Integration executed successfully',
      result
    })
  } catch (error) {
    throw new ValidationError(`Failed to execute integration: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get integration templates
 */
router.get('/templates', asyncHandler(async (req, res) => {
  const templates = webhookService.getIntegrationTemplates()

  res.json({
    success: true,
    templates: templates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      category: template.category,
      supportedEvents: template.supportedEvents,
      configSchema: template.configSchema,
      defaultConfig: template.defaultConfig,
      documentation: template.documentation
    })),
    count: templates.length
  })
}))

/**
 * Get webhook statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = webhookService.getWebhookStats()

  res.json({
    success: true,
    stats: {
      ...stats,
      successRate: stats.totalDeliveries > 0 ? (stats.successfulDeliveries / stats.totalDeliveries) * 100 : 0,
      failureRate: stats.totalDeliveries > 0 ? (stats.failedDeliveries / stats.totalDeliveries) * 100 : 0
    },
    timestamp: new Date().toISOString()
  })
}))

/**
 * Test webhook endpoint
 */
router.post('/test', asyncHandler(async (req, res) => {
  const { url, payload = { test: true, timestamp: new Date().toISOString() } } = req.body

  if (!url) {
    throw new ValidationError('URL is required for testing')
  }

  try {
    const axios = require('axios')
    const startTime = Date.now()
    
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DocuSlicer-Webhook-Test/1.0'
      },
      timeout: 10000,
      validateStatus: () => true
    })

    const duration = Date.now() - startTime

    res.json({
      success: true,
      test: {
        url,
        status: response.status,
        statusText: response.statusText,
        duration,
        responseHeaders: response.headers,
        responseData: response.data,
        success: response.status >= 200 && response.status < 300
      }
    })
  } catch (error) {
    res.json({
      success: false,
      test: {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }
    })
  }
}))

/**
 * Verify webhook signature
 */
router.post('/verify', asyncHandler(async (req, res) => {
  const { payload, signature, secret } = req.body

  if (!payload || !signature || !secret) {
    throw new ValidationError('payload, signature, and secret are required')
  }

  try {
    const isValid = webhookService.verifySignature(
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      signature,
      secret
    )

    res.json({
      success: true,
      valid: isValid,
      message: isValid ? 'Signature is valid' : 'Signature is invalid'
    })
  } catch (error) {
    throw new ValidationError(`Failed to verify signature: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get webhook capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    capabilities: {
      webhooks: {
        supported: true,
        features: [
          'Event-driven webhooks',
          'Signature verification',
          'Retry mechanism with exponential backoff',
          'Delivery tracking',
          'Event filtering',
          'Custom headers',
          'Metadata support'
        ],
        maxRetries: 10,
        maxRetryDelay: 60000,
        signatureAlgorithm: 'HMAC-SHA256'
      },
      integrations: {
        supported: true,
        types: ['webhook', 'api', 'database', 'file', 'email', 'slack', 'teams', 'discord'],
        templates: webhookService.getIntegrationTemplates().length,
        features: [
          'Pre-built integration templates',
          'Custom integrations',
          'Usage tracking',
          'Error handling',
          'Configuration validation'
        ]
      },
      events: {
        supported: true,
        features: [
          'Custom event types',
          'Event queuing',
          'Batch processing',
          'Event filtering',
          'Metadata support'
        ],
        commonEvents: [
          'document.created',
          'document.updated',
          'document.deleted',
          'document.processed',
          'document.shared',
          'user.created',
          'user.updated',
          'error.occurred',
          'system.maintenance'
        ]
      },
      delivery: {
        supported: true,
        features: [
          'Delivery tracking',
          'Status monitoring',
          'Response logging',
          'Performance metrics',
          'Manual retry',
          'Bulk operations'
        ],
        statuses: ['pending', 'success', 'failed', 'retrying']
      }
    },
    limits: {
      maxWebhooks: 100,
      maxIntegrations: 50,
      maxEventQueueSize: 10000,
      maxPayloadSize: '1MB',
      maxRetentionDays: 30
    }
  })
})

/**
 * Health check for webhook service
 */
router.get('/health', asyncHandler(async (req, res) => {
  const stats = webhookService.getWebhookStats()
  
  res.json({
    success: true,
    status: 'healthy',
    service: 'webhooks',
    stats: {
      activeWebhooks: stats.activeWebhooks,
      totalDeliveries: stats.totalDeliveries,
      successRate: stats.totalDeliveries > 0 ? (stats.successfulDeliveries / stats.totalDeliveries) * 100 : 100,
      averageResponseTime: Math.round(stats.averageResponseTime)
    },
    features: {
      webhooks: true,
      integrations: true,
      eventProcessing: true,
      deliveryTracking: true
    },
    timestamp: new Date().toISOString()
  })
}))

export default router
