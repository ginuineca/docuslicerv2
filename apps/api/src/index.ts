import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import pdfRoutes from './routes/pdfRoutes';
import fileRoutes from './routes/fileRoutes';
import templateRoutes from './routes/templateRoutes';
import queueRoutes from './routes/queueRoutes';
import securityRoutes from './routes/securityRoutes';
import cloudRoutes from './routes/cloudRoutes';
// import advancedOcrRoutes from './routes/advancedOcrRoutes'; // Temporarily disabled due to canvas dependency
import collaborationRoutes, { setCollaborationService } from './routes/collaborationRoutes';
import { CollaborationService } from './services/collaborationService';
import analyticsRoutes from './routes/analyticsRoutes';
import rateLimitRoutes from './routes/rateLimitRoutes';
import { RateLimitService } from './services/rateLimitService';
import searchRoutes from './routes/searchRoutes';
import webhookRoutes from './routes/webhookRoutes';
import documentIntelligenceRoutes from './routes/documentIntelligenceRoutes';
import industrySolutionsRoutes from './routes/industrySolutionsRoutes';
import enterpriseRoutes from './routes/enterpriseRoutes';
import workflowRoutes from './routes/workflowRoutes';
import {
  performanceMiddleware,
  timeoutMiddleware,
  rateLimitMiddleware,
  compressionMiddleware,
  createHealthCheckHandler
} from './middleware/performance';
import {
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
  securityHeadersMiddleware,
  corsPreflightHandler
} from './middleware/errorHandler';
import {
  analyticsTrackingMiddleware,
  performanceTrackingMiddleware,
  analyticsHeadersMiddleware,
  errorTrackingMiddleware
} from './middleware/analyticsMiddleware';
import {
  performanceMiddleware,
  cacheMiddleware,
  responseOptimizationMiddleware,
  queryOptimizationMiddleware,
  createHealthCheckHandler,
  createRateLimitMiddleware,
  timeoutMiddleware
} from './middleware/performance';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3001;

// Initialize rate limiting service early
const rateLimitService = new RateLimitService(process.env.REDIS_URL);

// Request tracking and security middleware
app.use(requestIdMiddleware);
app.use(securityHeadersMiddleware);
app.use(corsPreflightHandler);

// Analytics middleware
app.use(analyticsHeadersMiddleware);
app.use(analyticsTrackingMiddleware);
app.use(performanceTrackingMiddleware);

// Performance and monitoring middleware
app.use(performanceMiddleware);
app.use(responseOptimizationMiddleware());
app.use(queryOptimizationMiddleware());
app.use(timeoutMiddleware(30000)); // 30 second timeout
app.use(createRateLimitMiddleware({
  windowMs: 60000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: 'Too many requests from this IP'
}));

// Security and CORS middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enhanced health check endpoint with performance metrics
app.get('/health', createHealthCheckHandler());
app.get('/api/health', createHealthCheckHandler());

// API routes
app.get('/api/status', (req, res) => {
  res.json({
    message: 'DocuSlicer API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// PDF processing routes with rate limiting
app.use('/api/pdf',
  rateLimitService.createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many PDF processing requests'
  }),
  pdfRoutes
);

// File management routes
app.use('/api/files', fileRoutes);

// Template management routes with caching
app.use('/api/templates',
  cacheMiddleware({
    ttl: 300, // 5 minutes cache
    condition: (req) => req.method === 'GET'
  }),
  templateRoutes
);

// Queue management routes
app.use('/api/queue', queueRoutes);

// Security features routes with rate limiting
app.use('/api/security',
  rateLimitService.createRateLimitMiddleware({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 50,
    message: 'Too many security operation requests'
  }),
  securityRoutes
);

// Cloud storage routes
app.use('/api/cloud', cloudRoutes);

// Advanced OCR routes - temporarily disabled due to canvas dependency
// app.use('/api/ocr', advancedOcrRoutes);

// Initialize collaboration service
const collaborationService = new CollaborationService(io);
setCollaborationService(collaborationService);

// Collaboration routes
app.use('/api/collaboration', collaborationRoutes);

// Analytics routes
app.use('/api/analytics', analyticsRoutes);

// Rate limiting and quota routes
app.use('/api/rate-limit', rateLimitRoutes);

// Search and indexing routes
app.use('/api/search', searchRoutes);

// Webhook and integration routes
app.use('/api/webhooks', webhookRoutes);

// Document Intelligence routes
app.use('/api/intelligence', documentIntelligenceRoutes);

// Industry Solutions routes
app.use('/api/industry', industrySolutionsRoutes);

// Enterprise routes
app.use('/api/enterprise', enterpriseRoutes);

// Workflow routes
app.use('/api/workflow', workflowRoutes);

// 404 handler for unmatched routes
app.use('*', notFoundHandler);

// Error tracking middleware
app.use(errorTrackingMiddleware);

// Global error handling middleware (must be last)
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`🚀 DocuSlicer API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 WebSocket server ready for real-time collaboration`);
});

// Cleanup inactive sessions every 5 minutes
setInterval(() => {
  collaborationService.cleanupInactiveSessions();
}, 5 * 60 * 1000);

// Global process error handlers for production
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // In production, you might want to restart the process
  if (process.env.NODE_ENV === 'production') {
    console.error('🔄 Shutting down due to uncaught exception...');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to restart the process
  if (process.env.NODE_ENV === 'production') {
    console.error('🔄 Shutting down due to unhandled rejection...');
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
