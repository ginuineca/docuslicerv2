import express from 'express'
import { z } from 'zod'
import { asyncHandler, ValidationError } from '../middleware/errorHandler'
import { CollaborationService, SessionPermissions, SessionSettings } from '../services/collaborationService'

const router = express.Router()

// This will be injected when the collaboration service is initialized
let collaborationService: CollaborationService

export function setCollaborationService(service: CollaborationService) {
  collaborationService = service
}

// Validation schemas
const createSessionSchema = z.object({
  documentId: z.string().min(1),
  documentName: z.string().min(1),
  creator: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    avatar: z.string().optional(),
    role: z.enum(['owner', 'editor', 'viewer']).default('owner')
  }),
  permissions: z.object({
    allowEditing: z.boolean().default(true),
    allowCommenting: z.boolean().default(true),
    allowDownloading: z.boolean().default(true),
    allowSharing: z.boolean().default(true),
    requireApproval: z.boolean().default(false)
  }).optional(),
  settings: z.object({
    maxUsers: z.number().min(1).max(100).default(10),
    autoSave: z.boolean().default(true),
    showCursors: z.boolean().default(true),
    showUserList: z.boolean().default(true),
    notifyOnJoin: z.boolean().default(true),
    sessionTimeout: z.number().min(5).max(1440).default(60) // 5 minutes to 24 hours
  }).optional()
})

const updateSessionSchema = z.object({
  permissions: z.object({
    allowEditing: z.boolean().optional(),
    allowCommenting: z.boolean().optional(),
    allowDownloading: z.boolean().optional(),
    allowSharing: z.boolean().optional(),
    requireApproval: z.boolean().optional()
  }).optional(),
  settings: z.object({
    maxUsers: z.number().min(1).max(100).optional(),
    autoSave: z.boolean().optional(),
    showCursors: z.boolean().optional(),
    showUserList: z.boolean().optional(),
    notifyOnJoin: z.boolean().optional(),
    sessionTimeout: z.number().min(5).max(1440).optional()
  }).optional()
})

/**
 * Create a new collaboration session
 */
router.post('/sessions', asyncHandler(async (req, res) => {
  if (!collaborationService) {
    throw new ValidationError('Collaboration service not initialized')
  }

  const data = createSessionSchema.parse(req.body)
  
  try {
    const session = await collaborationService.createSession(
      data.documentId,
      data.documentName,
      data.creator,
      data.permissions,
      data.settings
    )

    res.status(201).json({
      success: true,
      message: 'Collaboration session created successfully',
      session: {
        id: session.id,
        documentId: session.documentId,
        documentName: session.documentName,
        createdAt: session.createdAt,
        permissions: session.permissions,
        settings: session.settings,
        userCount: session.users.size
      }
    })
  } catch (error) {
    throw new ValidationError(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get collaboration session details
 */
router.get('/sessions/:sessionId', asyncHandler(async (req, res) => {
  if (!collaborationService) {
    throw new ValidationError('Collaboration service not initialized')
  }

  const { sessionId } = req.params
  const session = collaborationService.getSession(sessionId)

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    })
  }

  res.json({
    success: true,
    session: {
      id: session.id,
      documentId: session.documentId,
      documentName: session.documentName,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      users: Array.from(session.users.values()).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        lastSeen: user.lastSeen
      })),
      permissions: session.permissions,
      settings: session.settings,
      recentActivities: session.activities.slice(-10) // Last 10 activities
    }
  })
}))

/**
 * Update collaboration session settings
 */
router.patch('/sessions/:sessionId', asyncHandler(async (req, res) => {
  if (!collaborationService) {
    throw new ValidationError('Collaboration service not initialized')
  }

  const { sessionId } = req.params
  const updates = updateSessionSchema.parse(req.body)
  
  const session = collaborationService.getSession(sessionId)
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    })
  }

  // Update permissions
  if (updates.permissions) {
    Object.assign(session.permissions, updates.permissions)
  }

  // Update settings
  if (updates.settings) {
    Object.assign(session.settings, updates.settings)
  }

  session.updatedAt = new Date()

  res.json({
    success: true,
    message: 'Session updated successfully',
    session: {
      id: session.id,
      permissions: session.permissions,
      settings: session.settings,
      updatedAt: session.updatedAt
    }
  })
}))

/**
 * Get all sessions for a document
 */
router.get('/documents/:documentId/sessions', asyncHandler(async (req, res) => {
  if (!collaborationService) {
    throw new ValidationError('Collaboration service not initialized')
  }

  const { documentId } = req.params
  const sessions = collaborationService.getDocumentSessions(documentId)

  res.json({
    success: true,
    sessions: sessions.map(session => ({
      id: session.id,
      documentName: session.documentName,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      userCount: session.users.size,
      activeUsers: Array.from(session.users.values()).filter(u => u.status === 'online').length,
      permissions: session.permissions
    })),
    count: sessions.length
  })
}))

/**
 * Get session statistics
 */
router.get('/sessions/:sessionId/stats', asyncHandler(async (req, res) => {
  if (!collaborationService) {
    throw new ValidationError('Collaboration service not initialized')
  }

  const { sessionId } = req.params
  const stats = collaborationService.getSessionStats(sessionId)

  if (!stats) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    })
  }

  res.json({
    success: true,
    stats: {
      ...stats,
      sessionDurationFormatted: formatDuration(stats.sessionDuration)
    }
  })
}))

/**
 * Get session activities
 */
router.get('/sessions/:sessionId/activities', asyncHandler(async (req, res) => {
  if (!collaborationService) {
    throw new ValidationError('Collaboration service not initialized')
  }

  const { sessionId } = req.params
  const limit = parseInt(req.query.limit as string) || 50
  const offset = parseInt(req.query.offset as string) || 0

  const session = collaborationService.getSession(sessionId)
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    })
  }

  const activities = session.activities
    .slice(-limit - offset, -offset || undefined)
    .reverse()

  res.json({
    success: true,
    activities,
    total: session.activities.length,
    hasMore: session.activities.length > limit + offset
  })
}))

/**
 * Get all active sessions
 */
router.get('/sessions', asyncHandler(async (req, res) => {
  if (!collaborationService) {
    throw new ValidationError('Collaboration service not initialized')
  }

  const sessions = collaborationService.getActiveSessions()

  res.json({
    success: true,
    sessions: sessions.map(session => ({
      id: session.id,
      documentId: session.documentId,
      documentName: session.documentName,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      userCount: session.users.size,
      activeUsers: Array.from(session.users.values()).filter(u => u.status === 'online').length,
      recentActivity: session.activities[session.activities.length - 1]
    })),
    count: sessions.length,
    totalUsers: sessions.reduce((sum, s) => sum + s.users.size, 0)
  })
}))

/**
 * Delete a collaboration session
 */
router.delete('/sessions/:sessionId', asyncHandler(async (req, res) => {
  if (!collaborationService) {
    throw new ValidationError('Collaboration service not initialized')
  }

  const { sessionId } = req.params
  const session = collaborationService.getSession(sessionId)

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    })
  }

  // Note: In a real implementation, you would need to properly close the session
  // and notify all connected users before deletion
  
  res.json({
    success: true,
    message: 'Session deletion initiated',
    sessionId
  })
}))

/**
 * Get collaboration capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    capabilities: {
      realTimeCollaboration: {
        supported: true,
        features: [
          'Real-time cursor tracking',
          'Live text selection',
          'Instant messaging',
          'User presence indicators',
          'Activity feed'
        ]
      },
      commenting: {
        supported: true,
        features: [
          'Threaded comments',
          'Comment replies',
          'Comment resolution',
          'Comment tagging',
          'Position-based comments'
        ]
      },
      annotations: {
        supported: true,
        types: ['highlight', 'underline', 'strikethrough', 'note', 'drawing'],
        features: [
          'Multiple annotation types',
          'Custom styling',
          'Collaborative editing',
          'Version tracking'
        ]
      },
      permissions: {
        supported: true,
        roles: ['owner', 'editor', 'viewer'],
        features: [
          'Granular permissions',
          'Role-based access',
          'Approval workflows',
          'Session controls'
        ]
      },
      sessions: {
        maxUsers: 100,
        maxSessionDuration: '24 hours',
        features: [
          'Session management',
          'User management',
          'Activity tracking',
          'Auto-cleanup'
        ]
      }
    },
    websocket: {
      supported: true,
      events: [
        'join-session',
        'leave-session',
        'cursor-move',
        'text-select',
        'add-comment',
        'add-annotation',
        'document-change',
        'typing-start',
        'typing-stop'
      ]
    }
  })
})

/**
 * Health check for collaboration service
 */
router.get('/health', (req, res) => {
  const isHealthy = !!collaborationService
  const sessions = collaborationService ? collaborationService.getActiveSessions() : []
  
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'unavailable',
    service: 'collaboration',
    activeSessions: sessions.length,
    totalUsers: sessions.reduce((sum, s) => sum + s.users.size, 0),
    timestamp: new Date().toISOString()
  })
})

/**
 * Utility function to format duration
 */
function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

export default router
