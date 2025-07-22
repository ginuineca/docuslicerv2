import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { EventEmitter } from 'events'

export interface Organization {
  id: string
  name: string
  domain: string
  type: 'startup' | 'small_business' | 'enterprise' | 'government'
  industry: string
  size: 'small' | 'medium' | 'large' | 'enterprise'
  plan: 'basic' | 'professional' | 'enterprise' | 'custom'
  settings: OrganizationSettings
  billing: BillingInfo
  features: string[]
  limits: ResourceLimits
  status: 'active' | 'suspended' | 'trial' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationSettings {
  branding: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
    customDomain?: string
  }
  security: {
    ssoEnabled: boolean
    ssoProvider?: string
    mfaRequired: boolean
    passwordPolicy: PasswordPolicy
    sessionTimeout: number // minutes
    ipWhitelist: string[]
    dataRetention: number // days
  }
  compliance: {
    auditLogging: boolean
    dataEncryption: boolean
    backupRetention: number // days
    complianceFrameworks: string[] // HIPAA, SOX, GDPR, etc.
  }
  integrations: {
    allowedIntegrations: string[]
    webhookEndpoints: string[]
    apiKeys: ApiKeyConfig[]
  }
  notifications: {
    emailNotifications: boolean
    slackWebhook?: string
    teamsWebhook?: string
    customWebhooks: string[]
  }
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxAge: number // days
  preventReuse: number // number of previous passwords
}

export interface BillingInfo {
  plan: string
  billingCycle: 'monthly' | 'annual'
  seats: number
  usage: {
    documents: number
    storage: number // GB
    apiCalls: number
    bandwidth: number // GB
  }
  limits: {
    documents: number
    storage: number // GB
    apiCalls: number
    bandwidth: number // GB
  }
  nextBillingDate: Date
  paymentMethod: string
  billingContact: {
    name: string
    email: string
    phone?: string
  }
}

export interface ResourceLimits {
  maxUsers: number
  maxDocuments: number
  maxStorage: number // GB
  maxApiCalls: number
  maxWebhooks: number
  maxIntegrations: number
  processingTimeout: number // seconds
  concurrentProcessing: number
}

export interface ApiKeyConfig {
  id: string
  name: string
  key: string
  permissions: string[]
  rateLimit: number
  expiresAt?: Date
  lastUsed?: Date
  createdAt: Date
}

export interface User {
  id: string
  organizationId: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'manager' | 'user' | 'viewer'
  permissions: string[]
  department?: string
  title?: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  lastLogin?: Date
  mfaEnabled: boolean
  preferences: UserPreferences
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  notifications: {
    email: boolean
    browser: boolean
    mobile: boolean
  }
  dashboard: {
    layout: string
    widgets: string[]
  }
}

export interface AuditLog {
  id: string
  organizationId: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface EnterpriseMetrics {
  organizationId: string
  period: string
  metrics: {
    activeUsers: number
    documentsProcessed: number
    storageUsed: number // GB
    apiCalls: number
    errorRate: number
    averageProcessingTime: number
    complianceScore: number
    securityIncidents: number
    costSavings: number
    timesSaved: number // hours
  }
  trends: {
    userGrowth: number
    documentGrowth: number
    storageGrowth: number
    performanceImprovement: number
  }
  alerts: Alert[]
  timestamp: Date
}

export interface Alert {
  id: string
  type: 'usage' | 'security' | 'performance' | 'compliance' | 'billing'
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  data?: Record<string, any>
  acknowledged: boolean
  createdAt: Date
}

export class EnterpriseService extends EventEmitter {
  private dataDir: string
  private organizationsDir: string
  private usersDir: string
  private auditLogsDir: string
  private metricsDir: string

  constructor() {
    super()
    this.dataDir = path.join(process.cwd(), 'data', 'enterprise')
    this.organizationsDir = path.join(this.dataDir, 'organizations')
    this.usersDir = path.join(this.dataDir, 'users')
    this.auditLogsDir = path.join(this.dataDir, 'audit-logs')
    this.metricsDir = path.join(this.dataDir, 'metrics')
    this.initializeAsync()
  }

  private async initializeAsync(): Promise<void> {
    await this.initializeDirectories()
    await this.initializeDefaultOrganizations()
  }

  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
      await fs.mkdir(this.organizationsDir, { recursive: true })
      await fs.mkdir(this.usersDir, { recursive: true })
      await fs.mkdir(this.auditLogsDir, { recursive: true })
      await fs.mkdir(this.metricsDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create enterprise directories:', error)
    }
  }

  private async initializeDefaultOrganizations(): Promise<void> {
    try {
      const existingOrgs = await this.listOrganizations()
      if (existingOrgs.length === 0) {
        await this.createDefaultOrganizations()
      }
    } catch (error) {
      console.error('Failed to initialize default organizations:', error)
    }
  }

  /**
   * Create default demo organizations
   */
  private async createDefaultOrganizations(): Promise<void> {
    const defaultOrgs: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Acme Legal Services',
        domain: 'acmelegal.com',
        type: 'enterprise',
        industry: 'legal',
        size: 'large',
        plan: 'enterprise',
        settings: this.getDefaultSettings('enterprise'),
        billing: this.getDefaultBilling('enterprise', 50),
        features: ['sso', 'audit_logs', 'custom_branding', 'api_access', 'priority_support'],
        limits: this.getResourceLimits('enterprise'),
        status: 'active'
      },
      {
        name: 'MedTech Solutions',
        domain: 'medtechsolutions.com',
        type: 'enterprise',
        industry: 'healthcare',
        size: 'large',
        plan: 'enterprise',
        settings: this.getDefaultSettings('enterprise'),
        billing: this.getDefaultBilling('enterprise', 75),
        features: ['hipaa_compliance', 'sso', 'audit_logs', 'custom_branding', 'api_access'],
        limits: this.getResourceLimits('enterprise'),
        status: 'active'
      },
      {
        name: 'StartupCorp',
        domain: 'startupcorp.io',
        type: 'startup',
        industry: 'technology',
        size: 'small',
        plan: 'professional',
        settings: this.getDefaultSettings('professional'),
        billing: this.getDefaultBilling('professional', 10),
        features: ['api_access', 'webhooks', 'integrations'],
        limits: this.getResourceLimits('professional'),
        status: 'active'
      }
    ]

    for (const org of defaultOrgs) {
      await this.createOrganization(org)
    }
  }

  /**
   * Create a new organization
   */
  async createOrganization(orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    const organization: Organization = {
      ...orgData,
      id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const orgFile = path.join(this.organizationsDir, `${organization.id}.json`)
    await fs.writeFile(orgFile, JSON.stringify(organization, null, 2))

    // Create default admin user
    await this.createDefaultAdminUser(organization.id)

    // Log audit event
    await this.logAuditEvent({
      organizationId: organization.id,
      userId: 'system',
      action: 'organization.created',
      resource: 'organization',
      resourceId: organization.id,
      details: { name: organization.name, plan: organization.plan },
      ipAddress: '127.0.0.1',
      userAgent: 'system',
      severity: 'medium'
    })

    this.emit('organizationCreated', organization)
    return organization
  }

  /**
   * Get organization by ID
   */
  async getOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const orgFile = path.join(this.organizationsDir, `${organizationId}.json`)
      const data = await fs.readFile(orgFile, 'utf-8')
      const organization = JSON.parse(data)
      
      // Convert date strings back to Date objects
      organization.createdAt = new Date(organization.createdAt)
      organization.updatedAt = new Date(organization.updatedAt)
      organization.billing.nextBillingDate = new Date(organization.billing.nextBillingDate)
      
      return organization
    } catch (error) {
      return null
    }
  }

  /**
   * List all organizations
   */
  async listOrganizations(filters?: { status?: string; plan?: string; industry?: string }): Promise<Organization[]> {
    try {
      const files = await fs.readdir(this.organizationsDir)
      const orgFiles = files.filter(file => file.endsWith('.json'))
      
      const organizations: Organization[] = []
      
      for (const file of orgFiles) {
        try {
          const data = await fs.readFile(path.join(this.organizationsDir, file), 'utf-8')
          const organization = JSON.parse(data)
          
          // Convert date strings back to Date objects
          organization.createdAt = new Date(organization.createdAt)
          organization.updatedAt = new Date(organization.updatedAt)
          organization.billing.nextBillingDate = new Date(organization.billing.nextBillingDate)
          
          // Apply filters
          if (filters) {
            if (filters.status && organization.status !== filters.status) continue
            if (filters.plan && organization.plan !== filters.plan) continue
            if (filters.industry && organization.industry !== filters.industry) continue
          }
          
          organizations.push(organization)
        } catch (error) {
          // Skip invalid files
        }
      }
      
      return organizations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      return []
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(organizationId: string, updates: Partial<Organization>): Promise<Organization | null> {
    const organization = await this.getOrganization(organizationId)
    if (!organization) return null

    const updatedOrganization: Organization = {
      ...organization,
      ...updates,
      id: organization.id, // Prevent ID changes
      updatedAt: new Date()
    }

    const orgFile = path.join(this.organizationsDir, `${organizationId}.json`)
    await fs.writeFile(orgFile, JSON.stringify(updatedOrganization, null, 2))

    // Log audit event
    await this.logAuditEvent({
      organizationId,
      userId: 'system',
      action: 'organization.updated',
      resource: 'organization',
      resourceId: organizationId,
      details: updates,
      ipAddress: '127.0.0.1',
      userAgent: 'system',
      severity: 'low'
    })

    this.emit('organizationUpdated', updatedOrganization)
    return updatedOrganization
  }

  /**
   * Create default admin user for organization
   */
  private async createDefaultAdminUser(organizationId: string): Promise<User> {
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      permissions: ['*'], // All permissions
      status: 'active',
      mfaEnabled: false,
      preferences: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          browser: true,
          mobile: false
        },
        dashboard: {
          layout: 'default',
          widgets: ['overview', 'recent_documents', 'analytics']
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const userFile = path.join(this.usersDir, `${user.id}.json`)
    await fs.writeFile(userFile, JSON.stringify(user, null, 2))

    return user
  }

  /**
   * Log audit event
   */
  async logAuditEvent(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const auditLog: AuditLog = {
      ...event,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    // Create monthly audit log file
    const date = new Date()
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const auditFile = path.join(this.auditLogsDir, `${event.organizationId}_${monthKey}.json`)

    try {
      let auditLogs: AuditLog[] = []
      try {
        const data = await fs.readFile(auditFile, 'utf-8')
        auditLogs = JSON.parse(data)
      } catch (error) {
        // File doesn't exist, start with empty array
      }

      auditLogs.push(auditLog)
      await fs.writeFile(auditFile, JSON.stringify(auditLogs, null, 2))
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }

    this.emit('auditEvent', auditLog)
    return auditLog
  }

  /**
   * Get default organization settings
   */
  getDefaultSettings(plan: string): OrganizationSettings {
    const baseSettings: OrganizationSettings = {
      branding: {},
      security: {
        ssoEnabled: false,
        mfaRequired: false,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          maxAge: 90,
          preventReuse: 5
        },
        sessionTimeout: 480, // 8 hours
        ipWhitelist: [],
        dataRetention: 365
      },
      compliance: {
        auditLogging: plan === 'enterprise',
        dataEncryption: true,
        backupRetention: plan === 'enterprise' ? 2555 : 365, // 7 years for enterprise
        complianceFrameworks: []
      },
      integrations: {
        allowedIntegrations: [],
        webhookEndpoints: [],
        apiKeys: []
      },
      notifications: {
        emailNotifications: true,
        customWebhooks: []
      }
    }

    if (plan === 'enterprise') {
      baseSettings.security.ssoEnabled = true
      baseSettings.security.mfaRequired = true
      baseSettings.compliance.complianceFrameworks = ['SOC2', 'GDPR']
      baseSettings.integrations.allowedIntegrations = ['*']
    }

    return baseSettings
  }

  /**
   * Get default billing info
   */
  getDefaultBilling(plan: string, seats: number): BillingInfo {
    const planPricing: Record<string, number> = {
      basic: 29,
      professional: 99,
      enterprise: 299
    }

    return {
      plan,
      billingCycle: 'monthly',
      seats,
      usage: {
        documents: 0,
        storage: 0,
        apiCalls: 0,
        bandwidth: 0
      },
      limits: {
        documents: plan === 'enterprise' ? -1 : plan === 'professional' ? 10000 : 1000,
        storage: plan === 'enterprise' ? -1 : plan === 'professional' ? 100 : 10,
        apiCalls: plan === 'enterprise' ? -1 : plan === 'professional' ? 100000 : 10000,
        bandwidth: plan === 'enterprise' ? -1 : plan === 'professional' ? 100 : 10
      },
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      paymentMethod: 'credit_card',
      billingContact: {
        name: 'Billing Contact',
        email: 'billing@example.com'
      }
    }
  }

  /**
   * Get plan features
   */
  getPlanFeatures(plan: string): string[] {
    const features: Record<string, string[]> = {
      basic: ['document_processing', 'basic_analytics', 'email_support'],
      professional: ['document_processing', 'advanced_analytics', 'api_access', 'webhooks', 'priority_support'],
      enterprise: ['document_processing', 'advanced_analytics', 'api_access', 'webhooks', 'sso', 'audit_logs', 'custom_branding', 'dedicated_support'],
      custom: ['*'] // All features
    }
    return features[plan] || features.basic
  }

  /**
   * Get resource limits for plan
   */
  getResourceLimits(plan: string): ResourceLimits {
    const limits: Record<string, ResourceLimits> = {
      basic: {
        maxUsers: 5,
        maxDocuments: 1000,
        maxStorage: 10,
        maxApiCalls: 10000,
        maxWebhooks: 5,
        maxIntegrations: 3,
        processingTimeout: 60,
        concurrentProcessing: 2
      },
      professional: {
        maxUsers: 25,
        maxDocuments: 10000,
        maxStorage: 100,
        maxApiCalls: 100000,
        maxWebhooks: 25,
        maxIntegrations: 10,
        processingTimeout: 120,
        concurrentProcessing: 5
      },
      enterprise: {
        maxUsers: -1, // Unlimited
        maxDocuments: -1,
        maxStorage: -1,
        maxApiCalls: -1,
        maxWebhooks: -1,
        maxIntegrations: -1,
        processingTimeout: 300,
        concurrentProcessing: 20
      }
    }

    return limits[plan] || limits.basic
  }

  /**
   * Get enterprise metrics
   */
  async getEnterpriseMetrics(organizationId: string, period: string = 'month'): Promise<EnterpriseMetrics> {
    // Mock metrics for demo
    const baseMetrics = {
      activeUsers: Math.floor(Math.random() * 100) + 20,
      documentsProcessed: Math.floor(Math.random() * 5000) + 1000,
      storageUsed: Math.floor(Math.random() * 50) + 10,
      apiCalls: Math.floor(Math.random() * 50000) + 10000,
      errorRate: Math.random() * 2,
      averageProcessingTime: Math.random() * 5 + 2,
      complianceScore: Math.floor(Math.random() * 20) + 80,
      securityIncidents: Math.floor(Math.random() * 3),
      costSavings: Math.floor(Math.random() * 50000) + 10000,
      timesSaved: Math.floor(Math.random() * 500) + 100
    }

    return {
      organizationId,
      period,
      metrics: baseMetrics,
      trends: {
        userGrowth: Math.random() * 20 + 5,
        documentGrowth: Math.random() * 30 + 10,
        storageGrowth: Math.random() * 25 + 5,
        performanceImprovement: Math.random() * 15 + 5
      },
      alerts: await this.generateAlerts(organizationId, baseMetrics),
      timestamp: new Date()
    }
  }

  /**
   * Generate alerts based on metrics
   */
  private async generateAlerts(organizationId: string, metrics: any): Promise<Alert[]> {
    const alerts: Alert[] = []

    // Usage alerts
    if (metrics.storageUsed > 80) {
      alerts.push({
        id: `alert_${Date.now()}_storage`,
        type: 'usage',
        severity: 'warning',
        title: 'High Storage Usage',
        message: `Storage usage is at ${metrics.storageUsed}GB. Consider upgrading your plan.`,
        acknowledged: false,
        createdAt: new Date()
      })
    }

    // Performance alerts
    if (metrics.errorRate > 1) {
      alerts.push({
        id: `alert_${Date.now()}_errors`,
        type: 'performance',
        severity: 'error',
        title: 'High Error Rate',
        message: `Error rate is ${metrics.errorRate.toFixed(2)}%. Please check system status.`,
        acknowledged: false,
        createdAt: new Date()
      })
    }

    // Security alerts
    if (metrics.securityIncidents > 0) {
      alerts.push({
        id: `alert_${Date.now()}_security`,
        type: 'security',
        severity: 'critical',
        title: 'Security Incidents Detected',
        message: `${metrics.securityIncidents} security incident(s) detected. Immediate attention required.`,
        acknowledged: false,
        createdAt: new Date()
      })
    }

    return alerts
  }

  /**
   * Get audit logs for organization
   */
  async getAuditLogs(organizationId: string, options?: {
    startDate?: Date
    endDate?: Date
    userId?: string
    action?: string
    severity?: string
    limit?: number
  }): Promise<AuditLog[]> {
    try {
      const files = await fs.readdir(this.auditLogsDir)
      const orgFiles = files.filter(file => file.startsWith(`${organizationId}_`))
      
      let allLogs: AuditLog[] = []
      
      for (const file of orgFiles) {
        try {
          const data = await fs.readFile(path.join(this.auditLogsDir, file), 'utf-8')
          const logs = JSON.parse(data)
          allLogs.push(...logs)
        } catch (error) {
          // Skip invalid files
        }
      }

      // Convert date strings back to Date objects
      allLogs = allLogs.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }))

      // Apply filters
      if (options) {
        if (options.startDate) {
          allLogs = allLogs.filter(log => log.timestamp >= options.startDate!)
        }
        if (options.endDate) {
          allLogs = allLogs.filter(log => log.timestamp <= options.endDate!)
        }
        if (options.userId) {
          allLogs = allLogs.filter(log => log.userId === options.userId)
        }
        if (options.action) {
          allLogs = allLogs.filter(log => log.action.includes(options.action!))
        }
        if (options.severity) {
          allLogs = allLogs.filter(log => log.severity === options.severity)
        }
      }

      // Sort by timestamp (newest first)
      allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Apply limit
      if (options?.limit) {
        allLogs = allLogs.slice(0, options.limit)
      }

      return allLogs
    } catch (error) {
      return []
    }
  }
}
