import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import multer from 'multer'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: any
}

export class AppError extends Error implements ApiError {
  public statusCode: number
  public code: string
  public details?: any
  public isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// Predefined error classes
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string, details?: any) {
    super(`${service} service is currently unavailable`, 503, 'SERVICE_UNAVAILABLE', details)
  }
}

/**
 * Async error handler wrapper
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500
  let code = 'INTERNAL_ERROR'
  let message = 'Internal server error'
  let details: any = undefined

  // Log the error
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Handle different error types
  if (error instanceof AppError) {
    // Custom application errors
    statusCode = error.statusCode
    code = error.code
    message = error.message
    details = error.details
  } else if (error instanceof ZodError) {
    // Zod validation errors
    statusCode = 400
    code = 'VALIDATION_ERROR'
    message = 'Validation failed'
    details = {
      issues: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }))
    }
  } else if (error instanceof multer.MulterError) {
    // Multer file upload errors
    statusCode = 400
    code = 'FILE_UPLOAD_ERROR'
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size too large'
        details = { maxSize: '50MB' }
        break
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded'
        break
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field'
        break
      default:
        message = 'File upload error'
    }
  } else if (error.name === 'CastError') {
    // Database cast errors
    statusCode = 400
    code = 'INVALID_ID'
    message = 'Invalid ID format'
  } else if (error.name === 'ValidationError') {
    // Database validation errors
    statusCode = 400
    code = 'VALIDATION_ERROR'
    message = 'Validation failed'
    details = error.message
  } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    // MongoDB errors
    statusCode = 500
    code = 'DATABASE_ERROR'
    message = 'Database operation failed'
  } else if (error.message.includes('ENOENT')) {
    // File not found errors
    statusCode = 404
    code = 'FILE_NOT_FOUND'
    message = 'File not found'
  } else if (error.message.includes('EACCES')) {
    // Permission errors
    statusCode = 403
    code = 'PERMISSION_DENIED'
    message = 'Permission denied'
  } else if (error.message.includes('EMFILE') || error.message.includes('ENFILE')) {
    // Too many open files
    statusCode = 503
    code = 'RESOURCE_EXHAUSTED'
    message = 'Server resources exhausted'
  } else if (error.message.includes('timeout')) {
    // Timeout errors
    statusCode = 408
    code = 'TIMEOUT'
    message = 'Request timeout'
  }

  // Prepare error response
  const errorResponse: any = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] || 'unknown'
    }
  }

  // Add details in development mode or for validation errors
  if (process.env.NODE_ENV === 'development' || statusCode === 400) {
    if (details) {
      errorResponse.error.details = details
    }
    
    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.stack = error.stack
    }
  }

  // Add helpful suggestions for common errors
  switch (code) {
    case 'FILE_NOT_FOUND':
      errorResponse.error.suggestion = 'Please check if the file exists and the path is correct'
      break
    case 'VALIDATION_ERROR':
      errorResponse.error.suggestion = 'Please check the request data format and required fields'
      break
    case 'RATE_LIMIT_EXCEEDED':
      errorResponse.error.suggestion = 'Please wait before making more requests'
      break
    case 'SERVICE_UNAVAILABLE':
      errorResponse.error.suggestion = 'Please try again later or contact support'
      break
  }

  res.status(statusCode).json(errorResponse)
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`)
  next(error)
}

/**
 * Validation middleware factory
 */
export function validate(schema: any, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req[property])
      req[property] = validated
      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * File validation middleware
 */
export function validateFile(
  allowedTypes: string[] = ['application/pdf'],
  maxSize: number = 50 * 1024 * 1024 // 50MB
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file && !req.files) {
      return next(new ValidationError('No file uploaded'))
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.file]) : [req.file]

    for (const file of files) {
      if (!file) continue

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return next(new ValidationError(
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
          { receivedType: file.mimetype, allowedTypes }
        ))
      }

      // Check file size
      if (file.size > maxSize) {
        return next(new ValidationError(
          `File size too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`,
          { receivedSize: file.size, maxSize }
        ))
      }
    }

    next()
  }
}

/**
 * Request ID middleware
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  req.headers['x-request-id'] = requestId as string
  res.setHeader('X-Request-ID', requestId)
  
  next()
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block')
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  next()
}

/**
 * CORS preflight handler
 */
export function corsPreflightHandler(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID')
    res.setHeader('Access-Control-Max-Age', '86400') // 24 hours
    res.status(204).end()
  } else {
    next()
  }
}
