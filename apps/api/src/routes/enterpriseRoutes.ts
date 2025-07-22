import express from 'express'
import { z } from 'zod'
import { asyncHandler, ValidationError } from '../middleware/errorHandler'
import { EnterpriseService } from '../services/enterpriseService'
import { trackEvent } from '../middleware/analyticsMiddleware'

const router = express.Router()
const enterpriseService = new EnterpriseService()

// Validation schemas
const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  domain: z.string().min(1).max(100),
  type: z.enum(['startup', 'small_business', 'enterprise', 'government']),
  industry: z.string().min(1).max(50),
  size: z.enum(['small', 'medium', 'large', 'enterprise']),
  plan: z.enum(['basic', 'professional', 'enterprise', 'custom'])
})

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  domain: z.string().min(1).max(100).optional(),
  type: z.enum(['startup', 'small_business', 'enterprise', 'government']).optional(),
  industry: z.string().min(1).max(50).optional(),
  size: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
  plan: z.enum(['basic', 'professional', 'enterprise', 'custom']).optional(),
  status: z.enum(['active', 'suspended', 'trial', 'cancelled']).optional()
})

/**
 * Get all organizations
 */
router.get('/organizations', asyncHandler(async (req, res) => {
  const { status, plan, industry } = req.query
  
  try {
    const organizations = await enterpriseService.listOrganizations({
      status: status as string,
      plan: plan as string,
      industry: industry as string
    })
    
    res.json({
      success: true,
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        domain: org.domain,
        type: org.type,
        industry: org.industry,
        size: org.size,
        plan: org.plan,
        status: org.status,
        features: org.features,
        billing: {
          plan: org.billing.plan,
          seats: org.billing.seats,
          nextBillingDate: org.billing.nextBillingDate
        },
        createdAt: org.createdAt
      })),
      total: organizations.length,
      filters: { status, plan, industry }
    })
  } catch (error) {
    throw new ValidationError(`Failed to get organizations: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get specific organization
 */
router.get('/organizations/:organizationId', asyncHandler(async (req, res) => {
  const { organizationId } = req.params
  
  try {
    const organization = await enterpriseService.getOrganization(organizationId)
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      })
    }

    res.json({
      success: true,
      organization
    })
  } catch (error) {
    throw new ValidationError(`Failed to get organization: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Create new organization
 */
router.post('/organizations', asyncHandler(async (req, res) => {
  const validatedData = createOrganizationSchema.parse(req.body)
  const userId = req.headers['x-user-id'] as string || 'system'
  const sessionId = req.headers['x-session-id'] as string || 'system'

  try {
    // Create organization with default settings
    const organizationData = {
      ...validatedData,
      settings: enterpriseService['getDefaultSettings'](validatedData.plan),
      billing: enterpriseService['getDefaultBilling'](validatedData.plan, 1),
      features: enterpriseService['getPlanFeatures'](validatedData.plan),
      limits: enterpriseService['getResourceLimits'](validatedData.plan),
      status: 'trial' as const
    }

    const organization = await enterpriseService.createOrganization(organizationData)

    // Track analytics event
    trackEvent('enterprise', 'organization', 'created', {
      userId,
      sessionId,
      organizationId: organization.id,
      metadata: {
        name: organization.name,
        plan: organization.plan,
        industry: organization.industry,
        size: organization.size
      }
    })

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        domain: organization.domain,
        plan: organization.plan,
        status: organization.status,
        createdAt: organization.createdAt
      }
    })

  } catch (error) {
    throw new ValidationError(`Failed to create organization: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Update organization
 */
router.put('/organizations/:organizationId', asyncHandler(async (req, res) => {
  const { organizationId } = req.params
  const validatedData = updateOrganizationSchema.parse(req.body)
  const userId = req.headers['x-user-id'] as string || 'system'
  const sessionId = req.headers['x-session-id'] as string || 'system'

  try {
    const updatedOrganization = await enterpriseService.updateOrganization(organizationId, validatedData)
    
    if (!updatedOrganization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      })
    }

    // Track analytics event
    trackEvent('enterprise', 'organization', 'updated', {
      userId,
      sessionId,
      organizationId,
      metadata: validatedData
    })

    res.json({
      success: true,
      message: 'Organization updated successfully',
      organization: updatedOrganization
    })

  } catch (error) {
    throw new ValidationError(`Failed to update organization: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get organization metrics
 */
router.get('/organizations/:organizationId/metrics', asyncHandler(async (req, res) => {
  const { organizationId } = req.params
  const { period = 'month' } = req.query
  
  try {
    const organization = await enterpriseService.getOrganization(organizationId)
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      })
    }

    const metrics = await enterpriseService.getEnterpriseMetrics(organizationId, period as string)
    
    res.json({
      success: true,
      metrics,
      organization: {
        id: organization.id,
        name: organization.name,
        plan: organization.plan
      }
    })
  } catch (error) {
    throw new ValidationError(`Failed to get metrics: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get organization audit logs
 */
router.get('/organizations/:organizationId/audit-logs', asyncHandler(async (req, res) => {
  const { organizationId } = req.params
  const { 
    startDate, 
    endDate, 
    userId, 
    action, 
    severity, 
    limit = '100' 
  } = req.query
  
  try {
    const organization = await enterpriseService.getOrganization(organizationId)
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      })
    }

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      userId: userId as string,
      action: action as string,
      severity: severity as string,
      limit: parseInt(limit as string)
    }

    const auditLogs = await enterpriseService.getAuditLogs(organizationId, options)
    
    res.json({
      success: true,
      auditLogs,
      total: auditLogs.length,
      filters: options,
      organization: {
        id: organization.id,
        name: organization.name
      }
    })
  } catch (error) {
    throw new ValidationError(`Failed to get audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get enterprise dashboard data
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const { organizationId } = req.query
  
  try {
    let organizations
    if (organizationId) {
      const org = await enterpriseService.getOrganization(organizationId as string)
      organizations = org ? [org] : []
    } else {
      organizations = await enterpriseService.listOrganizations()
    }

    const dashboardData = {
      summary: {
        totalOrganizations: organizations.length,
        activeOrganizations: organizations.filter(org => org.status === 'active').length,
        trialOrganizations: organizations.filter(org => org.status === 'trial').length,
        enterpriseOrganizations: organizations.filter(org => org.plan === 'enterprise').length,
        totalUsers: organizations.reduce((sum, org) => sum + org.billing.seats, 0),
        totalRevenue: organizations.reduce((sum, org) => {
          const planPricing = { basic: 29, professional: 99, enterprise: 299, custom: 500 }
          return sum + (planPricing[org.plan as keyof typeof planPricing] || 0) * org.billing.seats
        }, 0)
      },
      planDistribution: {
        basic: organizations.filter(org => org.plan === 'basic').length,
        professional: organizations.filter(org => org.plan === 'professional').length,
        enterprise: organizations.filter(org => org.plan === 'enterprise').length,
        custom: organizations.filter(org => org.plan === 'custom').length
      },
      industryDistribution: organizations.reduce((acc, org) => {
        acc[org.industry] = (acc[org.industry] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      recentOrganizations: organizations
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
        .map(org => ({
          id: org.id,
          name: org.name,
          plan: org.plan,
          status: org.status,
          createdAt: org.createdAt
        })),
      alerts: [
        {
          type: 'info',
          message: `${organizations.filter(org => org.status === 'trial').length} organizations in trial period`,
          count: organizations.filter(org => org.status === 'trial').length
        },
        {
          type: 'warning',
          message: `${organizations.filter(org => org.billing.nextBillingDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length} organizations with billing due within 7 days`,
          count: organizations.filter(org => org.billing.nextBillingDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length
        }
      ]
    }

    res.json({
      success: true,
      dashboard: dashboardData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new ValidationError(`Failed to get dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get enterprise capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    capabilities: {
      organizationManagement: {
        supported: true,
        features: [
          'Multi-tenant architecture',
          'Organization-level settings',
          'Custom branding and domains',
          'Flexible billing and plans',
          'Resource limits and quotas',
          'Status management'
        ]
      },
      userManagement: {
        supported: true,
        features: [
          'Role-based access control',
          'Department and title management',
          'User preferences and settings',
          'Multi-factor authentication',
          'Session management',
          'User activity tracking'
        ]
      },
      security: {
        supported: true,
        features: [
          'Single Sign-On (SSO)',
          'Multi-factor authentication',
          'Password policies',
          'IP whitelisting',
          'Session timeout controls',
          'Data encryption at rest and in transit'
        ]
      },
      compliance: {
        supported: true,
        features: [
          'Comprehensive audit logging',
          'Data retention policies',
          'Compliance framework support',
          'Backup and recovery',
          'Privacy controls',
          'Regulatory reporting'
        ]
      },
      analytics: {
        supported: true,
        features: [
          'Organization-level metrics',
          'Usage analytics and trends',
          'Performance monitoring',
          'Cost analysis and optimization',
          'Custom dashboards',
          'Real-time alerts'
        ]
      },
      integrations: {
        supported: true,
        features: [
          'API key management',
          'Webhook configurations',
          'Third-party integrations',
          'Custom integration support',
          'Rate limiting and quotas',
          'Integration monitoring'
        ]
      }
    },
    plans: {
      basic: {
        name: 'Basic',
        price: 29,
        features: ['Up to 5 users', 'Basic support', 'Standard features'],
        limits: {
          users: 5,
          documents: 1000,
          storage: '10GB',
          apiCalls: 10000
        }
      },
      professional: {
        name: 'Professional',
        price: 99,
        features: ['Up to 25 users', 'Priority support', 'Advanced features', 'API access'],
        limits: {
          users: 25,
          documents: 10000,
          storage: '100GB',
          apiCalls: 100000
        }
      },
      enterprise: {
        name: 'Enterprise',
        price: 299,
        features: ['Unlimited users', 'Dedicated support', 'All features', 'SSO', 'Audit logs'],
        limits: {
          users: 'Unlimited',
          documents: 'Unlimited',
          storage: 'Unlimited',
          apiCalls: 'Unlimited'
        }
      },
      custom: {
        name: 'Custom',
        price: 'Contact us',
        features: ['Custom requirements', 'On-premise deployment', 'Custom integrations'],
        limits: {
          users: 'Custom',
          documents: 'Custom',
          storage: 'Custom',
          apiCalls: 'Custom'
        }
      }
    },
    complianceFrameworks: [
      'SOC 2 Type II',
      'GDPR',
      'HIPAA',
      'SOX',
      'PCI DSS',
      'ISO 27001',
      'CCPA'
    ]
  })
})

/**
 * Health check for enterprise service
 */
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const organizations = await enterpriseService.listOrganizations()
    
    res.json({
      success: true,
      status: 'healthy',
      service: 'enterprise',
      stats: {
        totalOrganizations: organizations.length,
        activeOrganizations: organizations.filter(org => org.status === 'active').length,
        enterpriseOrganizations: organizations.filter(org => org.plan === 'enterprise').length,
        totalUsers: organizations.reduce((sum, org) => sum + org.billing.seats, 0)
      },
      features: {
        organizationManagement: true,
        userManagement: true,
        auditLogging: true,
        enterpriseMetrics: true,
        complianceSupport: true,
        ssoIntegration: true,
        customBranding: true,
        apiManagement: true
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: 'enterprise',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}))

export default router
