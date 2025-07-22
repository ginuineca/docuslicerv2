import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { z } from 'zod'
import { asyncHandler, ValidationError } from '../middleware/errorHandler'
import { SearchService, SearchDocument } from '../services/searchService'
import { trackEvent } from '../middleware/analyticsMiddleware'

const router = express.Router()
const searchService = new SearchService(process.env.ELASTICSEARCH_URL)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'search')
    await fs.mkdir(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
})

// Validation schemas
const searchQuerySchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    fileType: z.array(z.string()).optional(),
    dateRange: z.object({
      from: z.string().datetime(),
      to: z.string().datetime()
    }).optional(),
    author: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    language: z.array(z.string()).optional(),
    category: z.array(z.string()).optional(),
    minFileSize: z.number().min(0).optional(),
    maxFileSize: z.number().min(0).optional(),
    minPageCount: z.number().min(0).optional(),
    maxPageCount: z.number().min(0).optional()
  }).optional(),
  sort: z.object({
    field: z.enum(['relevance', 'date', 'title', 'fileSize', 'pageCount']),
    order: z.enum(['asc', 'desc'])
  }).optional(),
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20)
  }).optional(),
  highlight: z.boolean().optional(),
  facets: z.array(z.string()).optional()
})

const indexDocumentSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  metadata: z.object({
    fileType: z.string(),
    fileSize: z.number().min(0),
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    language: z.string().optional(),
    pageCount: z.number().min(0).optional(),
    wordCount: z.number().min(0).optional(),
    category: z.string().optional(),
    source: z.string().optional()
  }),
  extractedData: z.object({
    entities: z.array(z.object({
      text: z.string(),
      type: z.string(),
      confidence: z.number().min(0).max(1)
    })).optional(),
    keywords: z.array(z.object({
      text: z.string(),
      score: z.number().min(0).max(1)
    })).optional(),
    summary: z.string().optional(),
    sentiment: z.object({
      score: z.number().min(-1).max(1),
      label: z.enum(['positive', 'negative', 'neutral'])
    }).optional()
  }).optional(),
  permissions: z.object({
    userId: z.string(),
    access: z.enum(['public', 'private', 'shared']),
    sharedWith: z.array(z.string()).optional()
  }).optional()
})

/**
 * Search documents
 */
router.post('/search', asyncHandler(async (req, res) => {
  const searchQuery = searchQuerySchema.parse(req.body)
  
  // Convert date strings to Date objects
  if (searchQuery.filters?.dateRange) {
    searchQuery.filters.dateRange = {
      from: new Date(searchQuery.filters.dateRange.from),
      to: new Date(searchQuery.filters.dateRange.to)
    }
  }

  try {
    const results = await searchService.search(searchQuery)

    // Track search event
    trackEvent('page_view', 'user', 'search', {
      userId: req.headers['x-user-id'] as string,
      query: searchQuery.query,
      resultsCount: results.total,
      queryTime: results.queryTime,
      filters: searchQuery.filters,
      metadata: {
        hasFilters: !!searchQuery.filters,
        hasFacets: !!searchQuery.facets?.length,
        page: results.page
      }
    })

    res.json({
      success: true,
      results,
      query: searchQuery
    })
  } catch (error) {
    throw new ValidationError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Index a single document
 */
router.post('/index', asyncHandler(async (req, res) => {
  const documentData = indexDocumentSchema.parse(req.body)
  
  const document: SearchDocument = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: documentData.title,
    content: documentData.content,
    metadata: {
      ...documentData.metadata,
      createdAt: new Date(),
      modifiedAt: new Date()
    },
    extractedData: documentData.extractedData,
    permissions: documentData.permissions
  }

  try {
    await searchService.indexDocument(document)

    // Track indexing event
    trackEvent('pdf_process', 'system', 'document_indexed', {
      userId: req.headers['x-user-id'] as string,
      documentId: document.id,
      metadata: {
        fileType: document.metadata.fileType,
        fileSize: document.metadata.fileSize,
        hasExtractedData: !!document.extractedData
      }
    })

    res.status(201).json({
      success: true,
      message: 'Document indexed successfully',
      document: {
        id: document.id,
        title: document.title,
        metadata: document.metadata
      }
    })
  } catch (error) {
    throw new ValidationError(`Indexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Index document from uploaded file
 */
router.post('/index-file', 
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file uploaded')
    }

    const { title, author, tags, category, language } = req.body
    
    try {
      // Read file content (simplified - in production you'd use proper text extraction)
      const fileContent = await fs.readFile(req.file.path, 'utf-8')
      
      // Extract keywords and entities
      const keywords = searchService.extractKeywords(fileContent)
      const entities = searchService.extractEntities(fileContent)
      
      const document: SearchDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: title || req.file.originalname,
        content: fileContent,
        metadata: {
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          createdAt: new Date(),
          modifiedAt: new Date(),
          author: author || undefined,
          tags: tags ? tags.split(',').map((tag: string) => tag.trim()) : [],
          language: language || undefined,
          pageCount: 1, // Simplified
          wordCount: fileContent.split(/\s+/).length,
          category: category || undefined,
          source: 'upload'
        },
        extractedData: {
          keywords,
          entities
        },
        permissions: {
          userId: req.headers['x-user-id'] as string || 'anonymous',
          access: 'private'
        }
      }

      await searchService.indexDocument(document)

      // Clean up uploaded file
      await fs.unlink(req.file.path)

      // Track indexing event
      trackEvent('file_upload', 'user', 'file_indexed', {
        userId: req.headers['x-user-id'] as string,
        documentId: document.id,
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          keywordsExtracted: keywords.length,
          entitiesExtracted: entities.length
        }
      })

      res.status(201).json({
        success: true,
        message: 'File indexed successfully',
        document: {
          id: document.id,
          title: document.title,
          metadata: document.metadata,
          extractedData: {
            keywordsCount: keywords.length,
            entitiesCount: entities.length
          }
        }
      })
    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(req.file.path).catch(() => {})
      throw new ValidationError(`File indexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
)

/**
 * Get document by ID
 */
router.get('/documents/:documentId', asyncHandler(async (req, res) => {
  const { documentId } = req.params
  const document = searchService.getDocument(documentId)

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    })
  }

  // Check permissions (simplified)
  const userId = req.headers['x-user-id'] as string
  if (document.permissions?.access === 'private' && document.permissions.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    })
  }

  res.json({
    success: true,
    document
  })
}))

/**
 * Update document
 */
router.put('/documents/:documentId', asyncHandler(async (req, res) => {
  const { documentId } = req.params
  const updates = indexDocumentSchema.partial().parse(req.body)
  
  const existingDocument = searchService.getDocument(documentId)
  if (!existingDocument) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    })
  }

  // Check permissions
  const userId = req.headers['x-user-id'] as string
  if (existingDocument.permissions?.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    })
  }

  const updatedDocument: SearchDocument = {
    ...existingDocument,
    ...updates,
    metadata: {
      ...existingDocument.metadata,
      ...updates.metadata,
      modifiedAt: new Date()
    }
  }

  try {
    await searchService.indexDocument(updatedDocument)

    res.json({
      success: true,
      message: 'Document updated successfully',
      document: {
        id: updatedDocument.id,
        title: updatedDocument.title,
        metadata: updatedDocument.metadata
      }
    })
  } catch (error) {
    throw new ValidationError(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Delete document
 */
router.delete('/documents/:documentId', asyncHandler(async (req, res) => {
  const { documentId } = req.params
  const document = searchService.getDocument(documentId)

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    })
  }

  // Check permissions
  const userId = req.headers['x-user-id'] as string
  if (document.permissions?.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    })
  }

  try {
    await searchService.deleteDocument(documentId)

    // Track deletion event
    trackEvent('pdf_process', 'user', 'document_deleted', {
      userId,
      documentId,
      metadata: {
        title: document.title,
        fileType: document.metadata.fileType
      }
    })

    res.json({
      success: true,
      message: 'Document deleted successfully'
    })
  } catch (error) {
    throw new ValidationError(`Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get search suggestions
 */
router.get('/suggest', asyncHandler(async (req, res) => {
  const { q } = req.query
  
  if (!q || typeof q !== 'string') {
    throw new ValidationError('Query parameter "q" is required')
  }

  // Simple suggestion implementation
  const searchResults = await searchService.search({
    query: q,
    pagination: { page: 1, limit: 5 }
  })

  const suggestions = searchResults.suggestions || []

  res.json({
    success: true,
    query: q,
    suggestions,
    count: suggestions.length
  })
}))

/**
 * Extract keywords from text
 */
router.post('/extract-keywords', asyncHandler(async (req, res) => {
  const { text, maxKeywords = 10 } = req.body

  if (!text || typeof text !== 'string') {
    throw new ValidationError('Text is required')
  }

  try {
    const keywords = searchService.extractKeywords(text, maxKeywords)

    res.json({
      success: true,
      keywords,
      count: keywords.length,
      text: {
        length: text.length,
        wordCount: text.split(/\s+/).length
      }
    })
  } catch (error) {
    throw new ValidationError(`Keyword extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Extract entities from text
 */
router.post('/extract-entities', asyncHandler(async (req, res) => {
  const { text } = req.body

  if (!text || typeof text !== 'string') {
    throw new ValidationError('Text is required')
  }

  try {
    const entities = searchService.extractEntities(text)

    res.json({
      success: true,
      entities,
      count: entities.length,
      byType: entities.reduce((acc, entity) => {
        acc[entity.type] = (acc[entity.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    })
  } catch (error) {
    throw new ValidationError(`Entity extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get index statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    const stats = await searchService.getIndexStats()

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new ValidationError(`Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Reindex all documents
 */
router.post('/reindex', asyncHandler(async (req, res) => {
  // Check admin permissions
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    })
  }

  try {
    await searchService.reindexAll()

    res.json({
      success: true,
      message: 'Reindexing completed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new ValidationError(`Reindexing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get search capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    capabilities: {
      search: {
        supported: true,
        engines: ['elasticsearch', 'lunr', 'fuse.js'],
        features: [
          'Full-text search',
          'Fuzzy matching',
          'Boolean queries',
          'Phrase matching',
          'Wildcard search',
          'Faceted search',
          'Highlighting',
          'Suggestions'
        ]
      },
      indexing: {
        supported: true,
        features: [
          'Real-time indexing',
          'Batch indexing',
          'Document updates',
          'Automatic reindexing',
          'Metadata extraction',
          'Content analysis'
        ]
      },
      filtering: {
        supported: true,
        filters: [
          'File type',
          'Date range',
          'Author',
          'Tags',
          'Language',
          'Category',
          'File size',
          'Page count'
        ]
      },
      sorting: {
        supported: true,
        fields: ['relevance', 'date', 'title', 'fileSize', 'pageCount']
      },
      analytics: {
        supported: true,
        features: [
          'Search analytics',
          'Popular queries',
          'Result click tracking',
          'Performance metrics',
          'Usage patterns'
        ]
      },
      textProcessing: {
        supported: true,
        features: [
          'Keyword extraction',
          'Entity recognition',
          'Language detection',
          'Sentiment analysis',
          'Text summarization'
        ]
      }
    },
    limits: {
      maxDocuments: 1000000,
      maxDocumentSize: '50MB',
      maxQueryLength: 1000,
      maxResultsPerPage: 100,
      maxFacets: 20
    }
  })
})

/**
 * Health check for search service
 */
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const stats = await searchService.getIndexStats()
    
    res.json({
      success: true,
      status: 'healthy',
      service: 'search',
      indexHealth: stats.indexHealth,
      totalDocuments: stats.totalDocuments,
      storage: process.env.ELASTICSEARCH_URL ? 'elasticsearch' : 'local',
      features: {
        fullTextSearch: true,
        facetedSearch: true,
        suggestions: true,
        analytics: true
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: 'search',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}))

export default router
