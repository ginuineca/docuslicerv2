import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'DocuSlicer API',
    version: '1.0.0'
  });
});

// API routes
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'DocuSlicer API is running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// PDF processing placeholder endpoint
app.post('/api/pdf/upload', (req, res) => {
  res.json({ 
    message: 'PDF upload endpoint - coming soon!',
    status: 'placeholder'
  });
});

// Workflow management placeholder endpoint
app.get('/api/workflows', (req, res) => {
  res.json({ 
    message: 'Workflow management - coming soon!',
    workflows: []
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DocuSlicer API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
