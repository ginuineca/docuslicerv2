import express from 'express'
import { z } from 'zod'
import { asyncHandler, ValidationError } from '../middleware/errorHandler'
import { RateLimitService } from '../services/rateLimitService'

const router = express.Router()
const rateLimitService = new RateLimitService(process.env.REDIS_URL)

// Validation schemas
const userTierSchema = z.object({
  name: z.string().min(1),
  rateLimits: z.object({
    perMinute: z.number().min(1),
    perHour: z.number().min(1),
    perDay: z.number().min(1),
    perMonth: z.number().min(1)
  }),
  quotas: z.object({
    daily: z.number().min(0).optional(),
    monthly: z.number().min(0).optional(),
    perOperation: z.record(z.number().min(0)).optional()
  }),
  features: z.array(z.string()),
  priority: z.number().min(1).max(10)
})

/**
 * Get user's current usage statistics
 */
router.get('/usage/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params
  const tier = req.query.tier as string || 'free'

  try {
    const stats = await rateLimitService.getUsageStats(userId, tier)
    
    res.json({
      success: true,
      userId,
      tier,
      usage: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new ValidationError(`Failed to get usage stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Check quota for a specific operation
 */
router.post('/check-quota', asyncHandler(async (req, res) => {
  const { userId, operation, tier = 'free' } = req.body

  if (!userId || !operation) {
    throw new ValidationError('userId and operation are required')
  }

  try {
    const quotaCheck = await rateLimitService.checkQuota(userId, operation, tier)
    
    res.json({
      success: true,
      allowed: quotaCheck.allowed,
      usage: quotaCheck.usage,
      limits: quotaCheck.limit,
      operation,
      tier,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new ValidationError(`Failed to check quota: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Increment quota usage (for testing or manual adjustments)
 */
router.post('/increment-quota', asyncHandler(async (req, res) => {
  const { userId, operation, tier = 'free' } = req.body

  if (!userId || !operation) {
    throw new ValidationError('userId and operation are required')
  }

  try {
    await rateLimitService.incrementQuota(userId, operation, tier)
    const updatedStats = await rateLimitService.getUsageStats(userId, tier)
    
    res.json({
      success: true,
      message: 'Quota incremented successfully',
      userId,
      operation,
      tier,
      updatedUsage: updatedStats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new ValidationError(`Failed to increment quota: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get all available user tiers
 */
router.get('/tiers', (req, res) => {
  const tiers = rateLimitService.getUserTiers()
  
  res.json({
    success: true,
    tiers: tiers.map(tier => ({
      ...tier,
      pricing: getTierPricing(tier.name) // Add pricing information
    })),
    count: tiers.length
  })
})

/**
 * Get specific user tier details
 */
router.get('/tiers/:tierName', (req, res) => {
  const { tierName } = req.params
  const tier = rateLimitService.getUserTier(tierName)
  
  if (!tier) {
    return res.status(404).json({
      success: false,
      message: 'Tier not found'
    })
  }
  
  res.json({
    success: true,
    tier: {
      ...tier,
      pricing: getTierPricing(tier.name)
    }
  })
})

/**
 * Create or update a user tier (admin only)
 */
router.put('/tiers/:tierName', asyncHandler(async (req, res) => {
  const { tierName } = req.params
  const tierData = userTierSchema.parse(req.body)
  
  // In a real application, you would check admin permissions here
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    })
  }
  
  rateLimitService.setUserTier(tierName, tierData)
  
  res.json({
    success: true,
    message: 'Tier updated successfully',
    tier: tierData
  })
}))

/**
 * Get rate limiting status for current request
 */
router.get('/status', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string
  const tier = req.headers['x-user-tier'] as string || 'free'
  const ip = req.ip || req.connection.remoteAddress
  
  const key = userId || ip || 'anonymous'
  
  // Get current rate limit status (simplified)
  const userTierData = rateLimitService.getUserTier(tier)
  
  if (!userTierData) {
    throw new ValidationError(`Unknown tier: ${tier}`)
  }
  
  const now = new Date()
  const stats = userId ? await rateLimitService.getUsageStats(userId, tier) : null
  
  res.json({
    success: true,
    status: {
      userId: userId || null,
      tier,
      key,
      limits: userTierData.rateLimits,
      quotas: stats?.quotas || null,
      features: userTierData.features,
      priority: userTierData.priority,
      timestamp: now.toISOString()
    }
  })
}))

/**
 * Get rate limiting and quota capabilities
 */
router.get('/capabilities', (req, res) => {
  const tiers = rateLimitService.getUserTiers()
  
  res.json({
    success: true,
    capabilities: {
      rateLimiting: {
        supported: true,
        algorithms: ['sliding-window', 'fixed-window'],
        storage: ['redis', 'memory'],
        features: [
          'Per-user rate limiting',
          'IP-based rate limiting',
          'Tiered rate limits',
          'Custom key generation',
          'Retry-After headers',
          'Rate limit headers'
        ]
      },
      quotas: {
        supported: true,
        types: ['daily', 'monthly', 'per-operation'],
        resetMethods: ['midnight', 'rolling'],
        features: [
          'Usage tracking',
          'Quota enforcement',
          'Operation-specific limits',
          'Tier-based quotas',
          'Real-time monitoring',
          'Usage analytics'
        ]
      },
      tiers: {
        available: tiers.map(tier => ({
          name: tier.name,
          priority: tier.priority,
          features: tier.features.length
        })),
        customTiers: true,
        features: [
          'Multiple tier support',
          'Custom tier creation',
          'Feature-based access',
          'Priority handling',
          'Upgrade/downgrade support'
        ]
      },
      monitoring: {
        supported: true,
        features: [
          'Real-time usage stats',
          'Historical data',
          'Usage patterns',
          'Quota alerts',
          'Rate limit violations',
          'Performance metrics'
        ]
      }
    },
    limits: {
      maxTiers: 10,
      maxOperationsPerTier: 50,
      maxRateLimitWindow: '1 hour',
      maxQuotaPeriod: '1 month'
    }
  })
})

/**
 * Get usage analytics for admin
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  // In a real application, you would check admin permissions here
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    })
  }
  
  // This would typically aggregate data from multiple users
  const analytics = {
    totalUsers: 1250, // Mock data
    activeUsers: 890,
    tierDistribution: {
      free: 800,
      basic: 300,
      premium: 120,
      enterprise: 30
    },
    quotaUtilization: {
      average: 65,
      byTier: {
        free: 85,
        basic: 70,
        premium: 55,
        enterprise: 40
      }
    },
    rateLimitViolations: {
      total: 1250,
      byTier: {
        free: 1000,
        basic: 200,
        premium: 40,
        enterprise: 10
      }
    },
    topOperations: [
      { operation: 'pdf-process', count: 15000, percentage: 45 },
      { operation: 'ai-operation', count: 8000, percentage: 24 },
      { operation: 'security-operation', count: 5000, percentage: 15 },
      { operation: 'collaboration', count: 3500, percentage: 10 },
      { operation: 'other', count: 2000, percentage: 6 }
    ]
  }
  
  res.json({
    success: true,
    analytics,
    generatedAt: new Date().toISOString()
  })
}))

/**
 * Health check for rate limiting service
 */
router.get('/health', (req, res) => {
  const tiers = rateLimitService.getUserTiers()
  
  res.json({
    success: true,
    status: 'healthy',
    service: 'rate-limiting',
    storage: process.env.REDIS_URL ? 'redis' : 'memory',
    availableTiers: tiers.length,
    features: {
      rateLimiting: true,
      quotas: true,
      tiers: true,
      analytics: true
    },
    timestamp: new Date().toISOString()
  })
})

/**
 * Test rate limiting (for development)
 */
router.get('/test/:userId', 
  rateLimitService.createRateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Test rate limit exceeded'
  }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Rate limit test passed',
      userId: req.params.userId,
      timestamp: new Date().toISOString()
    })
  }
)

/**
 * Test quota checking (for development)
 */
router.post('/test-quota',
  rateLimitService.createQuotaMiddleware('test-operation'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Quota test passed',
      operation: 'test-operation',
      timestamp: new Date().toISOString()
    })
  }
)

/**
 * Helper function to get tier pricing (mock data)
 */
function getTierPricing(tierName: string): any {
  const pricing = {
    free: {
      price: 0,
      currency: 'USD',
      period: 'month',
      features: ['Basic PDF processing', 'Limited AI features']
    },
    basic: {
      price: 9.99,
      currency: 'USD',
      period: 'month',
      features: ['Enhanced PDF processing', 'Basic AI features', 'Cloud storage', 'Email support']
    },
    premium: {
      price: 29.99,
      currency: 'USD',
      period: 'month',
      features: ['Advanced PDF processing', 'Full AI features', 'Collaboration tools', 'Priority support', 'Analytics']
    },
    enterprise: {
      price: 99.99,
      currency: 'USD',
      period: 'month',
      features: ['All features', 'Custom integrations', 'Dedicated support', 'SLA guarantee', 'Custom limits']
    }
  }
  
  return pricing[tierName as keyof typeof pricing] || null
}

export default router
