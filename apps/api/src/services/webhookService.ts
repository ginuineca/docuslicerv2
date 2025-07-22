import axios, { AxiosResponse } from 'axios'
import crypto from 'crypto'
import CryptoJS from 'crypto-js'
import cron from 'node-cron'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'

export interface WebhookEndpoint {
  id: string
  url: string
  events: string[]
  secret?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
  metadata?: Record<string, any>
  headers?: Record<string, string>
  retryConfig?: {
    maxRetries: number
    retryDelay: number
    backoffMultiplier: number
  }
  filters?: {
    conditions: Array<{
      field: string
      operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex'
      value: string
    }>
    logic: 'AND' | 'OR'
  }
}

export interface WebhookEvent {
  id: string
  type: string
  data: any
  timestamp: Date
  source: string
  userId?: string
  sessionId?: string
  metadata?: Record<string, any>
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  eventId: string
  url: string
  status: 'pending' | 'success' | 'failed' | 'retrying'
  attempts: number
  lastAttemptAt?: Date
  nextRetryAt?: Date
  responseStatus?: number
  responseBody?: string
  errorMessage?: string
  duration?: number
  createdAt: Date
}

export interface Integration {
  id: string
  name: string
  type: 'webhook' | 'api' | 'database' | 'file' | 'email' | 'slack' | 'teams' | 'discord'
  config: Record<string, any>
  active: boolean
  createdAt: Date
  updatedAt: Date
  lastUsed?: Date
  usageCount: number
  errorCount: number
  successCount: number
}

export interface IntegrationTemplate {
  id: string
  name: string
  description: string
  type: string
  configSchema: Record<string, any>
  defaultConfig: Record<string, any>
  supportedEvents: string[]
  documentation: string
  category: 'communication' | 'storage' | 'analytics' | 'automation' | 'crm' | 'other'
}

export class WebhookService {
  private webhooks: Map<string, WebhookEndpoint> = new Map()
  private deliveries: Map<string, WebhookDelivery> = new Map()
  private integrations: Map<string, Integration> = new Map()
  private eventQueue: WebhookEvent[] = []
  private isProcessing: boolean = false
  private dataDir: string
  private retryScheduler: Map<string, NodeJS.Timeout> = new Map()

  // Predefined integration templates
  private templates: IntegrationTemplate[] = [
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send notifications to Slack channels',
      type: 'webhook',
      configSchema: {
        webhookUrl: { type: 'string', required: true },
        channel: { type: 'string', required: false },
        username: { type: 'string', required: false }
      },
      defaultConfig: {
        username: 'DocuSlicer Bot'
      },
      supportedEvents: ['document.processed', 'document.shared', 'error.occurred'],
      documentation: 'https://api.slack.com/messaging/webhooks',
      category: 'communication'
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Send notifications to Microsoft Teams channels',
      type: 'webhook',
      configSchema: {
        webhookUrl: { type: 'string', required: true }
      },
      defaultConfig: {},
      supportedEvents: ['document.processed', 'document.shared', 'error.occurred'],
      documentation: 'https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook',
      category: 'communication'
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Send notifications to Discord channels',
      type: 'webhook',
      configSchema: {
        webhookUrl: { type: 'string', required: true },
        username: { type: 'string', required: false },
        avatarUrl: { type: 'string', required: false }
      },
      defaultConfig: {
        username: 'DocuSlicer'
      },
      supportedEvents: ['document.processed', 'document.shared', 'error.occurred'],
      documentation: 'https://discord.com/developers/docs/resources/webhook',
      category: 'communication'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect to thousands of apps via Zapier',
      type: 'webhook',
      configSchema: {
        webhookUrl: { type: 'string', required: true }
      },
      defaultConfig: {},
      supportedEvents: ['*'],
      documentation: 'https://zapier.com/apps/webhook/integrations',
      category: 'automation'
    },
    {
      id: 'email',
      name: 'Email Notifications',
      description: 'Send email notifications',
      type: 'email',
      configSchema: {
        to: { type: 'array', required: true },
        subject: { type: 'string', required: false },
        template: { type: 'string', required: false }
      },
      defaultConfig: {
        subject: 'DocuSlicer Notification'
      },
      supportedEvents: ['document.processed', 'document.shared', 'error.occurred'],
      documentation: 'Built-in email service',
      category: 'communication'
    }
  ]

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'webhooks')
    this.ensureDataDir()
    this.loadData()
    this.startProcessing()
    this.scheduleCleanup()
  }

  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create webhooks data directory:', error)
    }
  }

  /**
   * Register a new webhook endpoint
   */
  async registerWebhook(webhook: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt'>): Promise<WebhookEndpoint> {
    const newWebhook: WebhookEndpoint = {
      ...webhook,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      retryConfig: webhook.retryConfig || {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      }
    }

    this.webhooks.set(newWebhook.id, newWebhook)
    await this.saveData()

    console.log(`✅ Webhook registered: ${newWebhook.url}`)
    return newWebhook
  }

  /**
   * Update an existing webhook
   */
  async updateWebhook(id: string, updates: Partial<WebhookEndpoint>): Promise<WebhookEndpoint | null> {
    const webhook = this.webhooks.get(id)
    if (!webhook) return null

    const updatedWebhook = {
      ...webhook,
      ...updates,
      id,
      updatedAt: new Date()
    }

    this.webhooks.set(id, updatedWebhook)
    await this.saveData()

    return updatedWebhook
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(id: string): Promise<boolean> {
    const deleted = this.webhooks.delete(id)
    if (deleted) {
      await this.saveData()
      console.log(`🗑️ Webhook deleted: ${id}`)
    }
    return deleted
  }

  /**
   * Get all webhooks
   */
  getWebhooks(): WebhookEndpoint[] {
    return Array.from(this.webhooks.values())
  }

  /**
   * Get webhook by ID
   */
  getWebhook(id: string): WebhookEndpoint | undefined {
    return this.webhooks.get(id)
  }

  /**
   * Trigger a webhook event
   */
  async triggerEvent(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<void> {
    const webhookEvent: WebhookEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date()
    }

    this.eventQueue.push(webhookEvent)
    console.log(`📡 Event queued: ${event.type}`)

    // Process immediately if not already processing
    if (!this.isProcessing) {
      this.processEventQueue()
    }
  }

  /**
   * Process the event queue
   */
  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return

    this.isProcessing = true

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      await this.processEvent(event)
    }

    this.isProcessing = false
  }

  /**
   * Process a single event
   */
  private async processEvent(event: WebhookEvent): Promise<void> {
    const relevantWebhooks = Array.from(this.webhooks.values()).filter(webhook => 
      webhook.active && 
      (webhook.events.includes(event.type) || webhook.events.includes('*')) &&
      this.matchesFilters(event, webhook.filters)
    )

    for (const webhook of relevantWebhooks) {
      await this.deliverWebhook(webhook, event)
    }
  }

  /**
   * Check if event matches webhook filters
   */
  private matchesFilters(event: WebhookEvent, filters?: WebhookEndpoint['filters']): boolean {
    if (!filters || !filters.conditions.length) return true

    const results = filters.conditions.map(condition => {
      const fieldValue = this.getNestedValue(event, condition.field)
      if (fieldValue === undefined) return false

      const value = String(fieldValue).toLowerCase()
      const conditionValue = condition.value.toLowerCase()

      switch (condition.operator) {
        case 'equals':
          return value === conditionValue
        case 'contains':
          return value.includes(conditionValue)
        case 'startsWith':
          return value.startsWith(conditionValue)
        case 'endsWith':
          return value.endsWith(conditionValue)
        case 'regex':
          try {
            return new RegExp(condition.value, 'i').test(value)
          } catch {
            return false
          }
        default:
          return false
      }
    })

    return filters.logic === 'OR' ? results.some(r => r) : results.every(r => r)
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Deliver webhook to endpoint
   */
  private async deliverWebhook(webhook: WebhookEndpoint, event: WebhookEvent): Promise<void> {
    const delivery: WebhookDelivery = {
      id: uuidv4(),
      webhookId: webhook.id,
      eventId: event.id,
      url: webhook.url,
      status: 'pending',
      attempts: 0,
      createdAt: new Date()
    }

    this.deliveries.set(delivery.id, delivery)

    await this.attemptDelivery(delivery, webhook, event)
  }

  /**
   * Attempt webhook delivery
   */
  private async attemptDelivery(delivery: WebhookDelivery, webhook: WebhookEndpoint, event: WebhookEvent): Promise<void> {
    delivery.attempts++
    delivery.lastAttemptAt = new Date()
    delivery.status = 'pending'

    const startTime = Date.now()

    try {
      const payload = {
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: event.timestamp.toISOString(),
        source: event.source,
        userId: event.userId,
        sessionId: event.sessionId,
        metadata: event.metadata
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'DocuSlicer-Webhook/1.0',
        'X-DocuSlicer-Event': event.type,
        'X-DocuSlicer-Delivery': delivery.id,
        ...webhook.headers
      }

      // Add signature if secret is provided
      if (webhook.secret) {
        const signature = this.generateSignature(JSON.stringify(payload), webhook.secret)
        headers['X-DocuSlicer-Signature'] = signature
      }

      const response: AxiosResponse = await axios.post(webhook.url, payload, {
        headers,
        timeout: 30000,
        validateStatus: () => true // Don't throw on non-2xx status codes
      })

      delivery.duration = Date.now() - startTime
      delivery.responseStatus = response.status
      delivery.responseBody = JSON.stringify(response.data).substring(0, 1000) // Limit response body size

      if (response.status >= 200 && response.status < 300) {
        delivery.status = 'success'
        console.log(`✅ Webhook delivered successfully: ${webhook.url} (${response.status})`)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

    } catch (error) {
      delivery.duration = Date.now() - startTime
      delivery.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      delivery.status = 'failed'

      console.error(`❌ Webhook delivery failed: ${webhook.url} - ${delivery.errorMessage}`)

      // Schedule retry if within retry limits
      const retryConfig = webhook.retryConfig!
      if (delivery.attempts < retryConfig.maxRetries) {
        const retryDelay = retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, delivery.attempts - 1)
        delivery.nextRetryAt = new Date(Date.now() + retryDelay)
        delivery.status = 'retrying'

        console.log(`🔄 Scheduling retry ${delivery.attempts}/${retryConfig.maxRetries} in ${retryDelay}ms`)

        const timeoutId = setTimeout(() => {
          this.attemptDelivery(delivery, webhook, event)
          this.retryScheduler.delete(delivery.id)
        }, retryDelay)

        this.retryScheduler.set(delivery.id, timeoutId)
      }
    }

    this.deliveries.set(delivery.id, delivery)
    await this.saveData()
  }

  /**
   * Generate webhook signature
   */
  private generateSignature(payload: string, secret: string): string {
    return `sha256=${CryptoJS.HmacSHA256(payload, secret).toString(CryptoJS.enc.Hex)}`
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }

  /**
   * Get webhook deliveries
   */
  getDeliveries(webhookId?: string): WebhookDelivery[] {
    const deliveries = Array.from(this.deliveries.values())
    return webhookId ? deliveries.filter(d => d.webhookId === webhookId) : deliveries
  }

  /**
   * Get delivery by ID
   */
  getDelivery(id: string): WebhookDelivery | undefined {
    return this.deliveries.get(id)
  }

  /**
   * Retry a failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<boolean> {
    const delivery = this.deliveries.get(deliveryId)
    if (!delivery || delivery.status === 'success') return false

    const webhook = this.webhooks.get(delivery.webhookId)
    if (!webhook) return false

    // Find the original event (simplified - in production you'd store events)
    const mockEvent: WebhookEvent = {
      id: delivery.eventId,
      type: 'manual_retry',
      data: { deliveryId },
      timestamp: new Date(),
      source: 'webhook_service'
    }

    await this.attemptDelivery(delivery, webhook, mockEvent)
    return true
  }

  /**
   * Integration management
   */
  async createIntegration(integration: Omit<Integration, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'errorCount' | 'successCount'>): Promise<Integration> {
    const newIntegration: Integration = {
      ...integration,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      errorCount: 0,
      successCount: 0
    }

    this.integrations.set(newIntegration.id, newIntegration)
    await this.saveData()

    return newIntegration
  }

  /**
   * Get all integrations
   */
  getIntegrations(): Integration[] {
    return Array.from(this.integrations.values())
  }

  /**
   * Get integration templates
   */
  getIntegrationTemplates(): IntegrationTemplate[] {
    return this.templates
  }

  /**
   * Execute integration
   */
  async executeIntegration(integrationId: string, data: any): Promise<any> {
    const integration = this.integrations.get(integrationId)
    if (!integration || !integration.active) {
      throw new Error('Integration not found or inactive')
    }

    try {
      let result: any

      switch (integration.type) {
        case 'webhook':
          result = await this.executeWebhookIntegration(integration, data)
          break
        case 'email':
          result = await this.executeEmailIntegration(integration, data)
          break
        case 'slack':
          result = await this.executeSlackIntegration(integration, data)
          break
        default:
          throw new Error(`Unsupported integration type: ${integration.type}`)
      }

      // Update usage statistics
      integration.usageCount++
      integration.successCount++
      integration.lastUsed = new Date()
      integration.updatedAt = new Date()

      this.integrations.set(integrationId, integration)
      await this.saveData()

      return result

    } catch (error) {
      // Update error statistics
      integration.usageCount++
      integration.errorCount++
      integration.lastUsed = new Date()
      integration.updatedAt = new Date()

      this.integrations.set(integrationId, integration)
      await this.saveData()

      throw error
    }
  }

  /**
   * Execute webhook integration
   */
  private async executeWebhookIntegration(integration: Integration, data: any): Promise<any> {
    const response = await axios.post(integration.config.url, data, {
      headers: integration.config.headers || {},
      timeout: 30000
    })

    return {
      status: response.status,
      data: response.data
    }
  }

  /**
   * Execute email integration
   */
  private async executeEmailIntegration(integration: Integration, data: any): Promise<any> {
    // Simplified email integration - in production you'd use a proper email service
    console.log(`📧 Email would be sent to: ${integration.config.to.join(', ')}`)
    console.log(`Subject: ${integration.config.subject}`)
    console.log(`Data:`, data)

    return {
      status: 'sent',
      recipients: integration.config.to,
      subject: integration.config.subject
    }
  }

  /**
   * Execute Slack integration
   */
  private async executeSlackIntegration(integration: Integration, data: any): Promise<any> {
    const payload = {
      text: data.message || JSON.stringify(data),
      channel: integration.config.channel,
      username: integration.config.username || 'DocuSlicer Bot'
    }

    const response = await axios.post(integration.config.webhookUrl, payload)

    return {
      status: response.status,
      data: response.data
    }
  }

  /**
   * Get webhook statistics
   */
  getWebhookStats(): {
    totalWebhooks: number
    activeWebhooks: number
    totalDeliveries: number
    successfulDeliveries: number
    failedDeliveries: number
    averageResponseTime: number
  } {
    const webhooks = Array.from(this.webhooks.values())
    const deliveries = Array.from(this.deliveries.values())

    const successfulDeliveries = deliveries.filter(d => d.status === 'success').length
    const failedDeliveries = deliveries.filter(d => d.status === 'failed').length
    const deliveriesWithDuration = deliveries.filter(d => d.duration !== undefined)
    const averageResponseTime = deliveriesWithDuration.length > 0 
      ? deliveriesWithDuration.reduce((sum, d) => sum + (d.duration || 0), 0) / deliveriesWithDuration.length
      : 0

    return {
      totalWebhooks: webhooks.length,
      activeWebhooks: webhooks.filter(w => w.active).length,
      totalDeliveries: deliveries.length,
      successfulDeliveries,
      failedDeliveries,
      averageResponseTime
    }
  }

  /**
   * Start background processing
   */
  private startProcessing(): void {
    // Process event queue every 5 seconds
    setInterval(() => {
      if (!this.isProcessing && this.eventQueue.length > 0) {
        this.processEventQueue()
      }
    }, 5000)
  }

  /**
   * Schedule cleanup of old deliveries
   */
  private scheduleCleanup(): void {
    // Clean up old deliveries daily at midnight
    cron.schedule('0 0 * * *', () => {
      this.cleanupOldDeliveries()
    })
  }

  /**
   * Clean up old deliveries
   */
  private async cleanupOldDeliveries(): Promise<void> {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const deliveries = Array.from(this.deliveries.entries())
    let cleanedCount = 0

    for (const [id, delivery] of deliveries) {
      if (delivery.createdAt < cutoffDate) {
        this.deliveries.delete(id)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      await this.saveData()
      console.log(`🧹 Cleaned up ${cleanedCount} old webhook deliveries`)
    }
  }

  /**
   * Load data from disk
   */
  private async loadData(): Promise<void> {
    try {
      const webhooksFile = path.join(this.dataDir, 'webhooks.json')
      const deliveriesFile = path.join(this.dataDir, 'deliveries.json')
      const integrationsFile = path.join(this.dataDir, 'integrations.json')

      // Load webhooks
      try {
        const webhooksData = await fs.readFile(webhooksFile, 'utf-8')
        const webhooks = JSON.parse(webhooksData)
        webhooks.forEach((webhook: any) => {
          webhook.createdAt = new Date(webhook.createdAt)
          webhook.updatedAt = new Date(webhook.updatedAt)
          this.webhooks.set(webhook.id, webhook)
        })
        console.log(`Loaded ${this.webhooks.size} webhooks`)
      } catch (error) {
        console.log('No existing webhooks found')
      }

      // Load deliveries
      try {
        const deliveriesData = await fs.readFile(deliveriesFile, 'utf-8')
        const deliveries = JSON.parse(deliveriesData)
        deliveries.forEach((delivery: any) => {
          delivery.createdAt = new Date(delivery.createdAt)
          if (delivery.lastAttemptAt) delivery.lastAttemptAt = new Date(delivery.lastAttemptAt)
          if (delivery.nextRetryAt) delivery.nextRetryAt = new Date(delivery.nextRetryAt)
          this.deliveries.set(delivery.id, delivery)
        })
        console.log(`Loaded ${this.deliveries.size} webhook deliveries`)
      } catch (error) {
        console.log('No existing deliveries found')
      }

      // Load integrations
      try {
        const integrationsData = await fs.readFile(integrationsFile, 'utf-8')
        const integrations = JSON.parse(integrationsData)
        integrations.forEach((integration: any) => {
          integration.createdAt = new Date(integration.createdAt)
          integration.updatedAt = new Date(integration.updatedAt)
          if (integration.lastUsed) integration.lastUsed = new Date(integration.lastUsed)
          this.integrations.set(integration.id, integration)
        })
        console.log(`Loaded ${this.integrations.size} integrations`)
      } catch (error) {
        console.log('No existing integrations found')
      }

    } catch (error) {
      console.error('Failed to load webhook data:', error)
    }
  }

  /**
   * Save data to disk
   */
  private async saveData(): Promise<void> {
    try {
      const webhooksFile = path.join(this.dataDir, 'webhooks.json')
      const deliveriesFile = path.join(this.dataDir, 'deliveries.json')
      const integrationsFile = path.join(this.dataDir, 'integrations.json')

      await Promise.all([
        fs.writeFile(webhooksFile, JSON.stringify(Array.from(this.webhooks.values()), null, 2)),
        fs.writeFile(deliveriesFile, JSON.stringify(Array.from(this.deliveries.values()), null, 2)),
        fs.writeFile(integrationsFile, JSON.stringify(Array.from(this.integrations.values()), null, 2))
      ])
    } catch (error) {
      console.error('Failed to save webhook data:', error)
    }
  }
}
