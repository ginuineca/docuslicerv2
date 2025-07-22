import { WebhookService } from './webhookService'

export class WebhookEventService {
  private webhookService: WebhookService

  constructor() {
    this.webhookService = new WebhookService()
  }

  /**
   * Trigger document processed event
   */
  async triggerDocumentProcessed(data: {
    documentId: string
    fileName: string
    fileSize: number
    processingTime: number
    operations: string[]
    userId?: string
    sessionId?: string
  }): Promise<void> {
    await this.webhookService.triggerEvent({
      type: 'document.processed',
      data: {
        document: {
          id: data.documentId,
          fileName: data.fileName,
          fileSize: data.fileSize,
          processingTime: data.processingTime,
          operations: data.operations
        },
        timestamp: new Date().toISOString()
      },
      source: 'pdf_service',
      userId: data.userId,
      sessionId: data.sessionId,
      metadata: {
        operationCount: data.operations.length,
        avgProcessingTime: data.processingTime
      }
    })
  }

  /**
   * Trigger document shared event
   */
  async triggerDocumentShared(data: {
    documentId: string
    fileName: string
    sharedWith: string[]
    permissions: string[]
    userId?: string
    sessionId?: string
  }): Promise<void> {
    await this.webhookService.triggerEvent({
      type: 'document.shared',
      data: {
        document: {
          id: data.documentId,
          fileName: data.fileName
        },
        sharing: {
          sharedWith: data.sharedWith,
          permissions: data.permissions,
          sharedAt: new Date().toISOString()
        }
      },
      source: 'collaboration_service',
      userId: data.userId,
      sessionId: data.sessionId,
      metadata: {
        recipientCount: data.sharedWith.length,
        permissionCount: data.permissions.length
      }
    })
  }

  /**
   * Trigger user created event
   */
  async triggerUserCreated(data: {
    userId: string
    email: string
    name: string
    tier: string
  }): Promise<void> {
    await this.webhookService.triggerEvent({
      type: 'user.created',
      data: {
        user: {
          id: data.userId,
          email: data.email,
          name: data.name,
          tier: data.tier,
          createdAt: new Date().toISOString()
        }
      },
      source: 'auth_service',
      userId: data.userId,
      metadata: {
        userTier: data.tier
      }
    })
  }

  /**
   * Trigger error occurred event
   */
  async triggerErrorOccurred(data: {
    error: string
    message: string
    stack?: string
    context?: Record<string, any>
    userId?: string
    sessionId?: string
  }): Promise<void> {
    await this.webhookService.triggerEvent({
      type: 'error.occurred',
      data: {
        error: {
          type: data.error,
          message: data.message,
          stack: data.stack,
          timestamp: new Date().toISOString(),
          context: data.context
        }
      },
      source: 'error_handler',
      userId: data.userId,
      sessionId: data.sessionId,
      metadata: {
        errorType: data.error,
        hasStack: !!data.stack,
        hasContext: !!data.context
      }
    })
  }

  /**
   * Trigger AI operation completed event
   */
  async triggerAIOperationCompleted(data: {
    operationType: string
    documentId: string
    results: any
    processingTime: number
    confidence?: number
    userId?: string
    sessionId?: string
  }): Promise<void> {
    await this.webhookService.triggerEvent({
      type: 'ai.operation.completed',
      data: {
        operation: {
          type: data.operationType,
          documentId: data.documentId,
          results: data.results,
          processingTime: data.processingTime,
          confidence: data.confidence,
          completedAt: new Date().toISOString()
        }
      },
      source: 'ai_service',
      userId: data.userId,
      sessionId: data.sessionId,
      metadata: {
        operationType: data.operationType,
        hasResults: !!data.results,
        confidence: data.confidence,
        processingTime: data.processingTime
      }
    })
  }

  /**
   * Trigger security operation event
   */
  async triggerSecurityOperation(data: {
    operationType: string
    documentId: string
    securityLevel: string
    success: boolean
    userId?: string
    sessionId?: string
  }): Promise<void> {
    await this.webhookService.triggerEvent({
      type: 'security.operation',
      data: {
        operation: {
          type: data.operationType,
          documentId: data.documentId,
          securityLevel: data.securityLevel,
          success: data.success,
          timestamp: new Date().toISOString()
        }
      },
      source: 'security_service',
      userId: data.userId,
      sessionId: data.sessionId,
      metadata: {
        operationType: data.operationType,
        securityLevel: data.securityLevel,
        success: data.success
      }
    })
  }

  /**
   * Trigger collaboration session event
   */
  async triggerCollaborationSession(data: {
    sessionId: string
    eventType: 'started' | 'ended' | 'user_joined' | 'user_left'
    participants: string[]
    documentId?: string
    userId?: string
  }): Promise<void> {
    await this.webhookService.triggerEvent({
      type: `collaboration.session.${data.eventType}`,
      data: {
        session: {
          id: data.sessionId,
          eventType: data.eventType,
          participants: data.participants,
          documentId: data.documentId,
          timestamp: new Date().toISOString()
        }
      },
      source: 'collaboration_service',
      userId: data.userId,
      sessionId: data.sessionId,
      metadata: {
        participantCount: data.participants.length,
        hasDocument: !!data.documentId,
        eventType: data.eventType
      }
    })
  }

  /**
   * Trigger cloud storage event
   */
  async triggerCloudStorageEvent(data: {
    eventType: 'uploaded' | 'downloaded' | 'synced' | 'deleted'
    provider: string
    fileName: string
    fileSize: number
    userId?: string
    sessionId?: string
  }): Promise<void> {
    await this.webhookService.triggerEvent({
      type: `cloud.storage.${data.eventType}`,
      data: {
        file: {
          name: data.fileName,
          size: data.fileSize,
          provider: data.provider,
          timestamp: new Date().toISOString()
        },
        operation: {
          type: data.eventType,
          provider: data.provider
        }
      },
      source: 'cloud_service',
      userId: data.userId,
      sessionId: data.sessionId,
      metadata: {
        provider: data.provider,
        eventType: data.eventType,
        fileSize: data.fileSize
      }
    })
  }

  /**
   * Trigger quota exceeded event
   */
  async triggerQuotaExceeded(data: {
    quotaType: string
    limit: number
    current: number
    userId: string
    tier: string
  }): Promise<void> {
    await this.webhookService.triggerEvent({
      type: 'quota.exceeded',
      data: {
        quota: {
          type: data.quotaType,
          limit: data.limit,
          current: data.current,
          percentage: (data.current / data.limit) * 100,
          timestamp: new Date().toISOString()
        },
        user: {
          id: data.userId,
          tier: data.tier
        }
      },
      source: 'rate_limit_service',
      userId: data.userId,
      metadata: {
        quotaType: data.quotaType,
        exceedPercentage: ((data.current - data.limit) / data.limit) * 100,
        userTier: data.tier
      }
    })
  }

  /**
   * Trigger system maintenance event
   */
  async triggerSystemMaintenance(data: {
    eventType: 'started' | 'completed' | 'scheduled'
    maintenanceType: string
    estimatedDuration?: number
    affectedServices: string[]
  }): Promise<void> {
    await this.webhookService.triggerEvent({
      type: 'system.maintenance',
      data: {
        maintenance: {
          type: data.maintenanceType,
          eventType: data.eventType,
          estimatedDuration: data.estimatedDuration,
          affectedServices: data.affectedServices,
          timestamp: new Date().toISOString()
        }
      },
      source: 'system',
      metadata: {
        maintenanceType: data.maintenanceType,
        eventType: data.eventType,
        serviceCount: data.affectedServices.length,
        hasEstimatedDuration: !!data.estimatedDuration
      }
    })
  }

  /**
   * Trigger batch operation completed event
   */
  async triggerBatchOperationCompleted(data: {
    batchId: string
    operationType: string
    totalItems: number
    successCount: number
    failureCount: number
    processingTime: number
    userId?: string
    sessionId?: string
  }): Promise<void> {
    await this.webhookService.triggerEvent({
      type: 'batch.operation.completed',
      data: {
        batch: {
          id: data.batchId,
          operationType: data.operationType,
          totalItems: data.totalItems,
          successCount: data.successCount,
          failureCount: data.failureCount,
          processingTime: data.processingTime,
          successRate: (data.successCount / data.totalItems) * 100,
          completedAt: new Date().toISOString()
        }
      },
      source: 'batch_service',
      userId: data.userId,
      sessionId: data.sessionId,
      metadata: {
        operationType: data.operationType,
        totalItems: data.totalItems,
        successRate: (data.successCount / data.totalItems) * 100,
        hasFailures: data.failureCount > 0
      }
    })
  }

  /**
   * Get the webhook service instance
   */
  getWebhookService(): WebhookService {
    return this.webhookService
  }
}

// Export a singleton instance
export const webhookEventService = new WebhookEventService()
