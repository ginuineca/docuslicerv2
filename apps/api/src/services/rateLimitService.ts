import Redis from 'ioredis'
import { Request, Response, NextFunction } from 'express'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: Request) => string
  onLimitReached?: (req: Request, res: Response) => void
  message?: string
  statusCode?: number
}

export interface QuotaConfig {
  daily?: number
  monthly?: number
  perOperation?: Record<string, number>
  resetTime?: 'midnight' | 'rolling'
}

export interface UserTier {
  name: string
  rateLimits: {
    perMinute: number
    perHour: number
    perDay: number
    perMonth: number
  }
  quotas: QuotaConfig
  features: string[]
  priority: number
}

export interface UsageStats {
  requests: {
    total: number
    successful: number
    failed: number
    blocked: number
  }
  quotas: {
    daily: { used: number; limit: number; remaining: number }
    monthly: { used: number; limit: number; remaining: number }
  }
  operations: Record<string, { count: number; limit?: number }>
  resetTimes: {
    daily: Date
    monthly: Date
  }
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: Date
  retryAfter?: number
}

export class RateLimitService {
  private redis: Redis | null = null
  private memoryStore: Map<string, any> = new Map()
  private useRedis: boolean = false

  // Predefined user tiers
  private userTiers: Map<string, UserTier> = new Map([
    ['free', {
      name: 'Free',
      rateLimits: {
        perMinute: 10,
        perHour: 100,
        perDay: 1000,
        perMonth: 10000
      },
      quotas: {
        daily: 50,
        monthly: 1000,
        perOperation: {
          'pdf-process': 20,
          'ai-operation': 10,
          'security-operation': 5
        }
      },
      features: ['basic-processing', 'basic-ai'],
      priority: 1
    }],
    ['basic', {
      name: 'Basic',
      rateLimits: {
        perMinute: 50,
        perHour: 1000,
        perDay: 10000,
        perMonth: 100000
      },
      quotas: {
        daily: 500,
        monthly: 10000,
        perOperation: {
          'pdf-process': 200,
          'ai-operation': 100,
          'security-operation': 50
        }
      },
      features: ['basic-processing', 'basic-ai', 'collaboration', 'cloud-storage'],
      priority: 2
    }],
    ['premium', {
      name: 'Premium',
      rateLimits: {
        perMinute: 200,
        perHour: 5000,
        perDay: 50000,
        perMonth: 500000
      },
      quotas: {
        daily: 2000,
        monthly: 50000,
        perOperation: {
          'pdf-process': 1000,
          'ai-operation': 500,
          'security-operation': 200
        }
      },
      features: ['advanced-processing', 'advanced-ai', 'collaboration', 'cloud-storage', 'analytics', 'priority-support'],
      priority: 3
    }],
    ['enterprise', {
      name: 'Enterprise',
      rateLimits: {
        perMinute: 1000,
        perHour: 25000,
        perDay: 250000,
        perMonth: 2500000
      },
      quotas: {
        daily: 10000,
        monthly: 250000,
        perOperation: {
          'pdf-process': 5000,
          'ai-operation': 2500,
          'security-operation': 1000
        }
      },
      features: ['all-features', 'custom-integrations', 'dedicated-support', 'sla-guarantee'],
      priority: 4
    }]
  ])

  constructor(redisUrl?: string) {
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl)
        this.useRedis = true
        console.log('✅ Redis connected for rate limiting')
      } catch (error) {
        console.warn('⚠️ Redis connection failed, using memory store for rate limiting')
        this.useRedis = false
      }
    }
  }

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - config.windowMs
    const resetTime = new Date(now + config.windowMs)

    if (this.useRedis && this.redis) {
      return await this.checkRateLimitRedis(key, config, now, windowStart, resetTime)
    } else {
      return await this.checkRateLimitMemory(key, config, now, windowStart, resetTime)
    }
  }

  /**
   * Check quota usage for a user
   */
  async checkQuota(
    userId: string,
    operation: string,
    tier: string = 'free'
  ): Promise<{ allowed: boolean; usage: any; limit: any }> {
    const userTier = this.userTiers.get(tier)
    if (!userTier) {
      throw new Error(`Unknown user tier: ${tier}`)
    }

    const today = new Date()
    const dailyKey = `quota:${userId}:daily:${today.toISOString().split('T')[0]}`
    const monthlyKey = `quota:${userId}:monthly:${today.getFullYear()}-${today.getMonth() + 1}`
    const operationKey = `quota:${userId}:operation:${operation}:${today.toISOString().split('T')[0]}`

    // Get current usage
    const dailyUsage = await this.getCounter(dailyKey)
    const monthlyUsage = await this.getCounter(monthlyKey)
    const operationUsage = await this.getCounter(operationKey)

    // Check limits
    const dailyLimit = userTier.quotas.daily || Infinity
    const monthlyLimit = userTier.quotas.monthly || Infinity
    const operationLimit = userTier.quotas.perOperation?.[operation] || Infinity

    const allowed = dailyUsage < dailyLimit && 
                   monthlyUsage < monthlyLimit && 
                   operationUsage < operationLimit

    return {
      allowed,
      usage: {
        daily: dailyUsage,
        monthly: monthlyUsage,
        operation: operationUsage
      },
      limit: {
        daily: dailyLimit,
        monthly: monthlyLimit,
        operation: operationLimit
      }
    }
  }

  /**
   * Increment quota usage
   */
  async incrementQuota(
    userId: string,
    operation: string,
    tier: string = 'free'
  ): Promise<void> {
    const today = new Date()
    const dailyKey = `quota:${userId}:daily:${today.toISOString().split('T')[0]}`
    const monthlyKey = `quota:${userId}:monthly:${today.getFullYear()}-${today.getMonth() + 1}`
    const operationKey = `quota:${userId}:operation:${operation}:${today.toISOString().split('T')[0]}`

    // Increment counters
    await this.incrementCounter(dailyKey, 24 * 60 * 60) // 24 hours TTL
    await this.incrementCounter(monthlyKey, 31 * 24 * 60 * 60) // 31 days TTL
    await this.incrementCounter(operationKey, 24 * 60 * 60) // 24 hours TTL
  }

  /**
   * Get usage statistics for a user
   */
  async getUsageStats(userId: string, tier: string = 'free'): Promise<UsageStats> {
    const userTier = this.userTiers.get(tier)
    if (!userTier) {
      throw new Error(`Unknown user tier: ${tier}`)
    }

    const today = new Date()
    const dailyKey = `quota:${userId}:daily:${today.toISOString().split('T')[0]}`
    const monthlyKey = `quota:${userId}:monthly:${today.getFullYear()}-${today.getMonth() + 1}`

    const dailyUsage = await this.getCounter(dailyKey)
    const monthlyUsage = await this.getCounter(monthlyKey)

    // Get operation-specific usage
    const operations: Record<string, { count: number; limit?: number }> = {}
    for (const [operation, limit] of Object.entries(userTier.quotas.perOperation || {})) {
      const operationKey = `quota:${userId}:operation:${operation}:${today.toISOString().split('T')[0]}`
      const count = await this.getCounter(operationKey)
      operations[operation] = { count, limit }
    }

    // Calculate reset times
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    return {
      requests: {
        total: dailyUsage + monthlyUsage, // Simplified
        successful: Math.floor((dailyUsage + monthlyUsage) * 0.95), // Estimated
        failed: Math.floor((dailyUsage + monthlyUsage) * 0.05), // Estimated
        blocked: 0 // Would need separate tracking
      },
      quotas: {
        daily: {
          used: dailyUsage,
          limit: userTier.quotas.daily || 0,
          remaining: Math.max(0, (userTier.quotas.daily || 0) - dailyUsage)
        },
        monthly: {
          used: monthlyUsage,
          limit: userTier.quotas.monthly || 0,
          remaining: Math.max(0, (userTier.quotas.monthly || 0) - monthlyUsage)
        }
      },
      operations,
      resetTimes: {
        daily: tomorrow,
        monthly: nextMonth
      }
    }
  }

  /**
   * Create rate limiting middleware
   */
  createRateLimitMiddleware(config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = config.keyGenerator ? config.keyGenerator(req) : this.defaultKeyGenerator(req)
        const result = await this.checkRateLimit(key, config)

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxRequests)
        res.setHeader('X-RateLimit-Remaining', result.remaining)
        res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000))

        if (!result.allowed) {
          if (result.retryAfter) {
            res.setHeader('Retry-After', Math.ceil(result.retryAfter / 1000))
          }

          if (config.onLimitReached) {
            config.onLimitReached(req, res)
          }

          return res.status(config.statusCode || 429).json({
            success: false,
            error: 'Rate limit exceeded',
            message: config.message || 'Too many requests, please try again later',
            retryAfter: result.retryAfter ? Math.ceil(result.retryAfter / 1000) : undefined
          })
        }

        next()
      } catch (error) {
        console.error('Rate limiting error:', error)
        next() // Allow request to proceed on error
      }
    }
  }

  /**
   * Create quota checking middleware
   */
  createQuotaMiddleware(operation: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.headers['x-user-id'] as string
        const tier = req.headers['x-user-tier'] as string || 'free'

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'User ID is required for quota checking'
          })
        }

        const quotaCheck = await this.checkQuota(userId, operation, tier)

        // Add quota headers
        res.setHeader('X-Quota-Limit-Daily', quotaCheck.limit.daily)
        res.setHeader('X-Quota-Remaining-Daily', Math.max(0, quotaCheck.limit.daily - quotaCheck.usage.daily))
        res.setHeader('X-Quota-Limit-Monthly', quotaCheck.limit.monthly)
        res.setHeader('X-Quota-Remaining-Monthly', Math.max(0, quotaCheck.limit.monthly - quotaCheck.usage.monthly))

        if (!quotaCheck.allowed) {
          return res.status(429).json({
            success: false,
            error: 'Quota exceeded',
            message: 'You have exceeded your usage quota for this operation',
            usage: quotaCheck.usage,
            limits: quotaCheck.limit,
            upgradeUrl: '/pricing'
          })
        }

        // Increment quota on successful check
        await this.incrementQuota(userId, operation, tier)

        next()
      } catch (error) {
        console.error('Quota checking error:', error)
        next() // Allow request to proceed on error
      }
    }
  }

  /**
   * Get available user tiers
   */
  getUserTiers(): UserTier[] {
    return Array.from(this.userTiers.values())
  }

  /**
   * Get specific user tier
   */
  getUserTier(tierName: string): UserTier | undefined {
    return this.userTiers.get(tierName)
  }

  /**
   * Add or update user tier
   */
  setUserTier(tierName: string, tier: UserTier): void {
    this.userTiers.set(tierName, tier)
  }

  /**
   * Private helper methods
   */
  private async checkRateLimitRedis(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number,
    resetTime: Date
  ): Promise<RateLimitResult> {
    if (!this.redis) throw new Error('Redis not available')

    const pipeline = this.redis.pipeline()
    pipeline.zremrangebyscore(key, 0, windowStart)
    pipeline.zcard(key)
    pipeline.zadd(key, now, `${now}-${Math.random()}`)
    pipeline.expire(key, Math.ceil(config.windowMs / 1000))

    const results = await pipeline.exec()
    const count = results?.[1]?.[1] as number || 0

    const allowed = count < config.maxRequests
    const remaining = Math.max(0, config.maxRequests - count - 1)

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : config.windowMs
    }
  }

  private async checkRateLimitMemory(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number,
    resetTime: Date
  ): Promise<RateLimitResult> {
    let requests = this.memoryStore.get(key) || []
    
    // Remove old requests
    requests = requests.filter((timestamp: number) => timestamp > windowStart)
    
    // Add current request
    requests.push(now)
    
    // Store updated requests
    this.memoryStore.set(key, requests)

    const allowed = requests.length <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - requests.length)

    return {
      allowed,
      limit: config.maxRequests,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : config.windowMs
    }
  }

  private async getCounter(key: string): Promise<number> {
    if (this.useRedis && this.redis) {
      const value = await this.redis.get(key)
      return parseInt(value || '0', 10)
    } else {
      return this.memoryStore.get(key) || 0
    }
  }

  private async incrementCounter(key: string, ttlSeconds: number): Promise<number> {
    if (this.useRedis && this.redis) {
      const pipeline = this.redis.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, ttlSeconds)
      const results = await pipeline.exec()
      return results?.[0]?.[1] as number || 1
    } else {
      const current = this.memoryStore.get(key) || 0
      const newValue = current + 1
      this.memoryStore.set(key, newValue)
      
      // Simple TTL simulation for memory store
      setTimeout(() => {
        this.memoryStore.delete(key)
      }, ttlSeconds * 1000)
      
      return newValue
    }
  }

  private defaultKeyGenerator(req: Request): string {
    const userId = req.headers['x-user-id'] as string
    const ip = req.ip || req.connection.remoteAddress
    return userId || ip || 'anonymous'
  }

  /**
   * Clean up expired entries (for memory store)
   */
  cleanup(): void {
    if (!this.useRedis) {
      // Simple cleanup for memory store
      const now = Date.now()
      for (const [key, requests] of this.memoryStore.entries()) {
        if (Array.isArray(requests)) {
          const validRequests = requests.filter((timestamp: number) => now - timestamp < 3600000) // 1 hour
          if (validRequests.length === 0) {
            this.memoryStore.delete(key)
          } else {
            this.memoryStore.set(key, validRequests)
          }
        }
      }
    }
  }
}
