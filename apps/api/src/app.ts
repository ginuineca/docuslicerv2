import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pdfRoutes from './routes/pdfRoutes';
import fileRoutes from './routes/fileRoutes';
import templateRoutes from './routes/templateRoutes';
import queueRoutes from './routes/queueRoutes';
import securityRoutes from './routes/securityRoutes';
import cloudRoutes from './routes/cloudRoutes';
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

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://docuslicer.com', 'https://www.docuslicer.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Handle preflight requests
app.options('*', corsPreflightHandler);

// Request parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Performance and analytics middleware
app.use(requestIdMiddleware);
app.use(securityHeadersMiddleware);
app.use(compressionMiddleware);
app.use(performanceMiddleware);
app.use(analyticsTrackingMiddleware);
app.use(performanceTrackingMiddleware);
app.use(analyticsHeadersMiddleware);

// Rate limiting
const rateLimitService = new RateLimitService();
app.use(rateLimitMiddleware(rateLimitService));

// Timeout middleware
app.use(timeoutMiddleware);

// Health check endpoint
app.get('/health', createHealthCheckHandler());
app.get('/api/health', createHealthCheckHandler());

// API Routes
app.use('/api/documents', pdfRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/cloud', cloudRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/rate-limit', rateLimitRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/ai', documentIntelligenceRoutes);
app.use('/api/industry', industrySolutionsRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/workflows', workflowRoutes);

// Initialize collaboration service (without socket.io for testing)
const collaborationService = new CollaborationService();
setCollaborationService(collaborationService);

// Error tracking middleware
app.use(errorTrackingMiddleware);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export { app };
