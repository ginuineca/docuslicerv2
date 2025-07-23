import { Server as SocketIOServer, Socket } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer'
  status: 'online' | 'away' | 'offline'
  lastSeen: Date
  cursor?: {
    x: number
    y: number
    page: number
  }
}

export interface CollaborationSession {
  id: string
  documentId: string
  documentName: string
  createdAt: Date
  updatedAt: Date
  users: Map<string, User>
  activities: Activity[]
  permissions: SessionPermissions
  settings: SessionSettings
}

export interface Activity {
  id: string
  userId: string
  userName: string
  type: 'join' | 'leave' | 'edit' | 'comment' | 'annotation' | 'share' | 'download'
  description: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface SessionPermissions {
  allowEditing: boolean
  allowCommenting: boolean
  allowDownloading: boolean
  allowSharing: boolean
  requireApproval: boolean
}

export interface SessionSettings {
  maxUsers: number
  autoSave: boolean
  showCursors: boolean
  showUserList: boolean
  notifyOnJoin: boolean
  sessionTimeout: number // minutes
}

export interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  position: {
    page: number
    x: number
    y: number
    width?: number
    height?: number
  }
  timestamp: Date
  replies: CommentReply[]
  resolved: boolean
  tags: string[]
}

export interface CommentReply {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  timestamp: Date
}

export interface Annotation {
  id: string
  userId: string
  userName: string
  type: 'highlight' | 'underline' | 'strikethrough' | 'note' | 'drawing'
  position: {
    page: number
    x: number
    y: number
    width: number
    height: number
  }
  content?: string
  style: {
    color: string
    opacity: number
    strokeWidth?: number
  }
  timestamp: Date
}

export interface DocumentChange {
  id: string
  userId: string
  userName: string
  type: 'text' | 'annotation' | 'comment' | 'structure'
  operation: 'insert' | 'delete' | 'update' | 'move'
  position: {
    page: number
    x?: number
    y?: number
  }
  content: any
  timestamp: Date
  applied: boolean
}

export interface PresenceInfo {
  userId: string
  userName: string
  userAvatar?: string
  cursor: {
    x: number
    y: number
    page: number
  }
  selection?: {
    startPage: number
    startX: number
    startY: number
    endPage: number
    endX: number
    endY: number
  }
  lastActivity: Date
}

export class CollaborationService {
  private io?: SocketIOServer
  private sessions: Map<string, CollaborationSession>
  private userSockets: Map<string, Socket>
  private documentSessions: Map<string, string[]> // documentId -> sessionIds
  private tempDir: string

  constructor(io?: SocketIOServer) {
    this.io = io
    this.sessions = new Map()
    this.userSockets = new Map()
    this.documentSessions = new Map()
    this.tempDir = path.join(process.cwd(), 'temp', 'collaboration')
    this.ensureTempDir()
    this.setupSocketHandlers()
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create collaboration temp directory:', error)
    }
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.io) {
      console.warn('Socket.IO not available - real-time features disabled')
      return
    }

    this.io.on('connection', (socket: Socket) => {
      console.log(`User connected: ${socket.id}`)

      // Join collaboration session
      socket.on('join-session', async (data: {
        sessionId: string
        user: Omit<User, 'id' | 'status' | 'lastSeen'>
      }) => {
        try {
          await this.handleUserJoin(socket, data.sessionId, data.user)
        } catch (error) {
          socket.emit('error', { message: 'Failed to join session' })
        }
      })

      // Leave collaboration session
      socket.on('leave-session', async (sessionId: string) => {
        try {
          await this.handleUserLeave(socket, sessionId)
        } catch (error) {
          console.error('Error leaving session:', error)
        }
      })

      // Handle cursor movement
      socket.on('cursor-move', (data: {
        sessionId: string
        cursor: { x: number; y: number; page: number }
      }) => {
        this.handleCursorMove(socket, data.sessionId, data.cursor)
      })

      // Handle text selection
      socket.on('text-select', (data: {
        sessionId: string
        selection: {
          startPage: number
          startX: number
          startY: number
          endPage: number
          endX: number
          endY: number
        }
      }) => {
        this.handleTextSelection(socket, data.sessionId, data.selection)
      })

      // Handle comments
      socket.on('add-comment', async (data: {
        sessionId: string
        comment: Omit<Comment, 'id' | 'timestamp' | 'replies' | 'resolved'>
      }) => {
        try {
          await this.handleAddComment(socket, data.sessionId, data.comment)
        } catch (error) {
          socket.emit('error', { message: 'Failed to add comment' })
        }
      })

      socket.on('reply-comment', async (data: {
        sessionId: string
        commentId: string
        reply: Omit<CommentReply, 'id' | 'timestamp'>
      }) => {
        try {
          await this.handleReplyComment(socket, data.sessionId, data.commentId, data.reply)
        } catch (error) {
          socket.emit('error', { message: 'Failed to reply to comment' })
        }
      })

      socket.on('resolve-comment', async (data: {
        sessionId: string
        commentId: string
      }) => {
        try {
          await this.handleResolveComment(socket, data.sessionId, data.commentId)
        } catch (error) {
          socket.emit('error', { message: 'Failed to resolve comment' })
        }
      })

      // Handle annotations
      socket.on('add-annotation', async (data: {
        sessionId: string
        annotation: Omit<Annotation, 'id' | 'timestamp'>
      }) => {
        try {
          await this.handleAddAnnotation(socket, data.sessionId, data.annotation)
        } catch (error) {
          socket.emit('error', { message: 'Failed to add annotation' })
        }
      })

      socket.on('update-annotation', async (data: {
        sessionId: string
        annotationId: string
        updates: Partial<Annotation>
      }) => {
        try {
          await this.handleUpdateAnnotation(socket, data.sessionId, data.annotationId, data.updates)
        } catch (error) {
          socket.emit('error', { message: 'Failed to update annotation' })
        }
      })

      socket.on('delete-annotation', async (data: {
        sessionId: string
        annotationId: string
      }) => {
        try {
          await this.handleDeleteAnnotation(socket, data.sessionId, data.annotationId)
        } catch (error) {
          socket.emit('error', { message: 'Failed to delete annotation' })
        }
      })

      // Handle document changes
      socket.on('document-change', async (data: {
        sessionId: string
        change: Omit<DocumentChange, 'id' | 'timestamp' | 'applied'>
      }) => {
        try {
          await this.handleDocumentChange(socket, data.sessionId, data.change)
        } catch (error) {
          socket.emit('error', { message: 'Failed to apply document change' })
        }
      })

      // Handle typing indicators
      socket.on('typing-start', (data: { sessionId: string }) => {
        this.handleTypingStart(socket, data.sessionId)
      })

      socket.on('typing-stop', (data: { sessionId: string }) => {
        this.handleTypingStop(socket, data.sessionId)
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket)
      })
    })
  }

  /**
   * Create a new collaboration session
   */
  async createSession(
    documentId: string,
    documentName: string,
    creator: Omit<User, 'id' | 'status' | 'lastSeen'>,
    permissions: SessionPermissions = {
      allowEditing: true,
      allowCommenting: true,
      allowDownloading: true,
      allowSharing: true,
      requireApproval: false
    },
    settings: SessionSettings = {
      maxUsers: 10,
      autoSave: true,
      showCursors: true,
      showUserList: true,
      notifyOnJoin: true,
      sessionTimeout: 60
    }
  ): Promise<CollaborationSession> {
    const sessionId = uuidv4()
    const creatorUser: User = {
      ...creator,
      id: uuidv4(),
      status: 'online',
      lastSeen: new Date()
    }

    const session: CollaborationSession = {
      id: sessionId,
      documentId,
      documentName,
      createdAt: new Date(),
      updatedAt: new Date(),
      users: new Map([[creatorUser.id, creatorUser]]),
      activities: [{
        id: uuidv4(),
        userId: creatorUser.id,
        userName: creatorUser.name,
        type: 'join',
        description: `${creatorUser.name} created the collaboration session`,
        timestamp: new Date()
      }],
      permissions,
      settings
    }

    this.sessions.set(sessionId, session)

    // Track document sessions
    const docSessions = this.documentSessions.get(documentId) || []
    docSessions.push(sessionId)
    this.documentSessions.set(documentId, docSessions)

    return session
  }

  /**
   * Get collaboration session
   */
  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Get all sessions for a document
   */
  getDocumentSessions(documentId: string): CollaborationSession[] {
    const sessionIds = this.documentSessions.get(documentId) || []
    return sessionIds
      .map(id => this.sessions.get(id))
      .filter((session): session is CollaborationSession => session !== undefined)
  }

  /**
   * Join a collaboration session
   */
  async joinSession(sessionId: string, user: Omit<User, 'status' | 'lastSeen'>): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    // Add user to session
    const fullUser: User = {
      ...user,
      status: 'online',
      lastSeen: new Date()
    }

    session.participants.set(user.id, fullUser)
    session.updatedAt = new Date()

    // Add activity
    session.activities.push({
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user-joined',
      userId: user.id,
      userName: user.name,
      timestamp: new Date(),
      data: { userName: user.name }
    })

    console.log(`User ${user.name} joined session ${sessionId}`)
  }

  /**
   * Leave a collaboration session
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const user = session.participants.get(userId)
    if (!user) {
      throw new Error(`User ${userId} not found in session ${sessionId}`)
    }

    // Remove user from session
    session.participants.delete(userId)
    session.updatedAt = new Date()

    // Add activity
    session.activities.push({
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user-left',
      userId,
      userName: user.name,
      timestamp: new Date(),
      data: { userName: user.name }
    })

    // Remove user socket mapping
    this.userSockets.delete(userId)

    console.log(`User ${user.name} left session ${sessionId}`)
  }

  /**
   * Handle user joining a session
   */
  private async handleUserJoin(
    socket: Socket,
    sessionId: string,
    userData: Omit<User, 'id' | 'status' | 'lastSeen'>
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    // Check if session is full
    if (session.users.size >= session.settings.maxUsers) {
      throw new Error('Session is full')
    }

    const user: User = {
      ...userData,
      id: socket.id,
      status: 'online',
      lastSeen: new Date()
    }

    // Add user to session
    session.users.set(user.id, user)
    this.userSockets.set(user.id, socket)

    // Join socket room
    socket.join(sessionId)

    // Add activity
    const activity: Activity = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      type: 'join',
      description: `${user.name} joined the session`,
      timestamp: new Date()
    }
    session.activities.push(activity)
    session.updatedAt = new Date()

    // Notify other users
    socket.to(sessionId).emit('user-joined', {
      user,
      activity,
      totalUsers: session.users.size
    })

    // Send session data to the new user
    socket.emit('session-joined', {
      session: this.serializeSession(session),
      userId: user.id
    })

    console.log(`User ${user.name} joined session ${sessionId}`)
  }

  /**
   * Handle user leaving a session
   */
  private async handleUserLeave(socket: Socket, sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const user = session.users.get(socket.id)
    if (!user) return

    // Remove user from session
    session.users.delete(socket.id)
    this.userSockets.delete(socket.id)

    // Leave socket room
    socket.leave(sessionId)

    // Add activity
    const activity: Activity = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      type: 'leave',
      description: `${user.name} left the session`,
      timestamp: new Date()
    }
    session.activities.push(activity)
    session.updatedAt = new Date()

    // Notify other users
    socket.to(sessionId).emit('user-left', {
      userId: user.id,
      activity,
      totalUsers: session.users.size
    })

    // Clean up empty sessions
    if (session.users.size === 0) {
      this.sessions.delete(sessionId)
      
      // Remove from document sessions
      const docSessions = this.documentSessions.get(session.documentId) || []
      const updatedSessions = docSessions.filter(id => id !== sessionId)
      if (updatedSessions.length === 0) {
        this.documentSessions.delete(session.documentId)
      } else {
        this.documentSessions.set(session.documentId, updatedSessions)
      }
    }

    console.log(`User ${user.name} left session ${sessionId}`)
  }

  /**
   * Handle user disconnection
   */
  private handleUserDisconnect(socket: Socket): void {
    // Find all sessions this user was in
    for (const [sessionId, session] of this.sessions) {
      if (session.users.has(socket.id)) {
        this.handleUserLeave(socket, sessionId)
      }
    }

    console.log(`User disconnected: ${socket.id}`)
  }

  /**
   * Handle cursor movement
   */
  private handleCursorMove(
    socket: Socket,
    sessionId: string,
    cursor: { x: number; y: number; page: number }
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const user = session.users.get(socket.id)
    if (!user) return

    // Update user cursor
    user.cursor = cursor
    user.lastSeen = new Date()

    // Broadcast cursor position to other users
    socket.to(sessionId).emit('cursor-moved', {
      userId: user.id,
      userName: user.name,
      cursor
    })
  }

  /**
   * Handle text selection
   */
  private handleTextSelection(
    socket: Socket,
    sessionId: string,
    selection: {
      startPage: number
      startX: number
      startY: number
      endPage: number
      endX: number
      endY: number
    }
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const user = session.users.get(socket.id)
    if (!user) return

    user.lastSeen = new Date()

    // Broadcast selection to other users
    socket.to(sessionId).emit('text-selected', {
      userId: user.id,
      userName: user.name,
      selection
    })
  }

  /**
   * Handle adding a comment
   */
  private async handleAddComment(
    socket: Socket,
    sessionId: string,
    commentData: Omit<Comment, 'id' | 'timestamp' | 'replies' | 'resolved'>
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.permissions.allowCommenting) return

    const user = session.users.get(socket.id)
    if (!user) return

    const comment: Comment = {
      ...commentData,
      id: uuidv4(),
      timestamp: new Date(),
      replies: [],
      resolved: false
    }

    // Add activity
    const activity: Activity = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      type: 'comment',
      description: `${user.name} added a comment`,
      timestamp: new Date(),
      metadata: { commentId: comment.id }
    }
    session.activities.push(activity)
    session.updatedAt = new Date()

    // Broadcast comment to all users in session
    if (this.io) {
      this.io.to(sessionId).emit('comment-added', {
        comment,
        activity
      })
    }
  }

  /**
   * Handle replying to a comment
   */
  private async handleReplyComment(
    socket: Socket,
    sessionId: string,
    commentId: string,
    replyData: Omit<CommentReply, 'id' | 'timestamp'>
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.permissions.allowCommenting) return

    const user = session.users.get(socket.id)
    if (!user) return

    const reply: CommentReply = {
      ...replyData,
      id: uuidv4(),
      timestamp: new Date()
    }

    // Add activity
    const activity: Activity = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      type: 'comment',
      description: `${user.name} replied to a comment`,
      timestamp: new Date(),
      metadata: { commentId, replyId: reply.id }
    }
    session.activities.push(activity)
    session.updatedAt = new Date()

    // Broadcast reply to all users in session
    if (this.io) {
      this.io.to(sessionId).emit('comment-replied', {
        commentId,
        reply,
        activity
      })
    }
  }

  /**
   * Handle resolving a comment
   */
  private async handleResolveComment(
    socket: Socket,
    sessionId: string,
    commentId: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const user = session.users.get(socket.id)
    if (!user) return

    // Add activity
    const activity: Activity = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      type: 'comment',
      description: `${user.name} resolved a comment`,
      timestamp: new Date(),
      metadata: { commentId }
    }
    session.activities.push(activity)
    session.updatedAt = new Date()

    // Broadcast resolution to all users in session
    if (this.io) {
      this.io.to(sessionId).emit('comment-resolved', {
        commentId,
        activity
      })
    }
  }

  /**
   * Handle adding an annotation
   */
  private async handleAddAnnotation(
    socket: Socket,
    sessionId: string,
    annotationData: Omit<Annotation, 'id' | 'timestamp'>
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.permissions.allowEditing) return

    const user = session.users.get(socket.id)
    if (!user) return

    const annotation: Annotation = {
      ...annotationData,
      id: uuidv4(),
      timestamp: new Date()
    }

    // Add activity
    const activity: Activity = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      type: 'annotation',
      description: `${user.name} added an annotation`,
      timestamp: new Date(),
      metadata: { annotationId: annotation.id, annotationType: annotation.type }
    }
    session.activities.push(activity)
    session.updatedAt = new Date()

    // Broadcast annotation to all users in session
    if (this.io) {
      this.io.to(sessionId).emit('annotation-added', {
        annotation,
        activity
      })
    }
  }

  /**
   * Handle updating an annotation
   */
  private async handleUpdateAnnotation(
    socket: Socket,
    sessionId: string,
    annotationId: string,
    updates: Partial<Annotation>
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.permissions.allowEditing) return

    const user = session.users.get(socket.id)
    if (!user) return

    // Add activity
    const activity: Activity = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      type: 'annotation',
      description: `${user.name} updated an annotation`,
      timestamp: new Date(),
      metadata: { annotationId }
    }
    session.activities.push(activity)
    session.updatedAt = new Date()

    // Broadcast update to all users in session
    if (this.io) {
      this.io.to(sessionId).emit('annotation-updated', {
        annotationId,
        updates,
        activity
      })
    }
  }

  /**
   * Handle deleting an annotation
   */
  private async handleDeleteAnnotation(
    socket: Socket,
    sessionId: string,
    annotationId: string
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.permissions.allowEditing) return

    const user = session.users.get(socket.id)
    if (!user) return

    // Add activity
    const activity: Activity = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      type: 'annotation',
      description: `${user.name} deleted an annotation`,
      timestamp: new Date(),
      metadata: { annotationId }
    }
    session.activities.push(activity)
    session.updatedAt = new Date()

    // Broadcast deletion to all users in session
    if (this.io) {
      this.io.to(sessionId).emit('annotation-deleted', {
        annotationId,
        activity
      })
    }
  }

  /**
   * Handle document changes
   */
  private async handleDocumentChange(
    socket: Socket,
    sessionId: string,
    changeData: Omit<DocumentChange, 'id' | 'timestamp' | 'applied'>
  ): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session || !session.permissions.allowEditing) return

    const user = session.users.get(socket.id)
    if (!user) return

    const change: DocumentChange = {
      ...changeData,
      id: uuidv4(),
      timestamp: new Date(),
      applied: true
    }

    // Add activity
    const activity: Activity = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      type: 'edit',
      description: `${user.name} made changes to the document`,
      timestamp: new Date(),
      metadata: { changeId: change.id, changeType: change.type }
    }
    session.activities.push(activity)
    session.updatedAt = new Date()

    // Broadcast change to all users in session
    socket.to(sessionId).emit('document-changed', {
      change,
      activity
    })
  }

  /**
   * Handle typing start
   */
  private handleTypingStart(socket: Socket, sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const user = session.users.get(socket.id)
    if (!user) return

    socket.to(sessionId).emit('typing-started', {
      userId: user.id,
      userName: user.name
    })
  }

  /**
   * Handle typing stop
   */
  private handleTypingStop(socket: Socket, sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) return

    const user = session.users.get(socket.id)
    if (!user) return

    socket.to(sessionId).emit('typing-stopped', {
      userId: user.id,
      userName: user.name
    })
  }

  /**
   * Serialize session for client
   */
  private serializeSession(session: CollaborationSession): any {
    return {
      id: session.id,
      documentId: session.documentId,
      documentName: session.documentName,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      users: Array.from(session.users.values()),
      activities: session.activities.slice(-50), // Last 50 activities
      permissions: session.permissions,
      settings: session.settings
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): {
    totalUsers: number
    activeUsers: number
    totalActivities: number
    sessionDuration: number
  } | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const now = new Date()
    const activeUsers = Array.from(session.users.values()).filter(
      user => user.status === 'online' && 
      (now.getTime() - user.lastSeen.getTime()) < 5 * 60 * 1000 // 5 minutes
    ).length

    return {
      totalUsers: session.users.size,
      activeUsers,
      totalActivities: session.activities.length,
      sessionDuration: now.getTime() - session.createdAt.getTime()
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Clean up inactive sessions
   */
  cleanupInactiveSessions(): void {
    const now = new Date()
    const sessionsToDelete: string[] = []

    for (const [sessionId, session] of this.sessions) {
      const inactiveTime = now.getTime() - session.updatedAt.getTime()
      const timeoutMs = session.settings.sessionTimeout * 60 * 1000

      if (inactiveTime > timeoutMs && session.users.size === 0) {
        sessionsToDelete.push(sessionId)
      }
    }

    for (const sessionId of sessionsToDelete) {
      const session = this.sessions.get(sessionId)
      if (session) {
        this.sessions.delete(sessionId)
        
        // Remove from document sessions
        const docSessions = this.documentSessions.get(session.documentId) || []
        const updatedSessions = docSessions.filter(id => id !== sessionId)
        if (updatedSessions.length === 0) {
          this.documentSessions.delete(session.documentId)
        } else {
          this.documentSessions.set(session.documentId, updatedSessions)
        }
      }
    }

    if (sessionsToDelete.length > 0) {
      console.log(`Cleaned up ${sessionsToDelete.length} inactive sessions`)
    }
  }
}
