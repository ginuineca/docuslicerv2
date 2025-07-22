import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { z } from 'zod'
import { asyncHandler, ValidationError } from '../middleware/errorHandler'
import { DocumentIntelligenceService } from '../services/documentIntelligenceService'
import { trackEvent } from '../middleware/analyticsMiddleware'
import { webhookEventService } from '../services/webhookEventService'

const router = express.Router()
const intelligenceService = new DocumentIntelligenceService()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'intelligence')
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
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.html']
    const fileExt = path.extname(file.originalname).toLowerCase()
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true)
    } else {
      cb(new Error(`Unsupported file type: ${fileExt}. Supported types: ${allowedTypes.join(', ')}`))
    }
  }
})

/**
 * Analyze document intelligence
 */
router.post('/analyze', 
  upload.single('document'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No document file uploaded')
    }

    const startTime = Date.now()
    const userId = req.headers['x-user-id'] as string
    const sessionId = req.headers['x-session-id'] as string

    try {
      // Perform document analysis
      const analysis = await intelligenceService.analyzeDocument(req.file.path, req.file.originalname)

      // Clean up uploaded file
      await fs.unlink(req.file.path)

      // Track analytics event
      trackEvent('ai_operation', 'user', 'document_intelligence_analysis', {
        userId,
        sessionId,
        documentId: analysis.id,
        metadata: {
          fileName: analysis.fileName,
          fileType: analysis.fileType,
          fileSize: analysis.fileSize,
          processingTime: analysis.processingTime,
          documentType: analysis.classification.primaryType,
          riskLevel: analysis.riskAssessment.overallRisk,
          entitiesFound: analysis.extractedData.entities.length,
          keyTermsFound: analysis.extractedData.keyTerms.length
        },
        duration: Date.now() - startTime
      })

      // Trigger webhook event
      await webhookEventService.triggerAIOperationCompleted({
        operationType: 'document_intelligence_analysis',
        documentId: analysis.id,
        results: {
          documentType: analysis.classification.primaryType,
          riskLevel: analysis.riskAssessment.overallRisk,
          confidence: analysis.confidence,
          entitiesCount: analysis.extractedData.entities.length,
          keyTermsCount: analysis.extractedData.keyTerms.length
        },
        processingTime: analysis.processingTime,
        confidence: analysis.confidence,
        userId,
        sessionId
      })

      res.status(201).json({
        success: true,
        message: 'Document analysis completed successfully',
        analysis: {
          id: analysis.id,
          fileName: analysis.fileName,
          fileType: analysis.fileType,
          fileSize: analysis.fileSize,
          pageCount: analysis.pageCount,
          wordCount: analysis.wordCount,
          language: analysis.language,
          confidence: analysis.confidence,
          processingTime: analysis.processingTime,
          classification: analysis.classification,
          riskAssessment: {
            overallRisk: analysis.riskAssessment.overallRisk,
            riskScore: analysis.riskAssessment.riskScore,
            riskFactors: analysis.riskAssessment.riskFactors
          },
          insights: {
            summary: analysis.insights.summary,
            keyPoints: analysis.insights.keyPoints.slice(0, 5), // Limit for API response
            actionItems: analysis.insights.actionItems,
            suggestedWorkflows: analysis.insights.suggestedWorkflows
          },
          extractedData: {
            entities: analysis.extractedData.entities.slice(0, 10), // Limit for API response
            keyTerms: analysis.extractedData.keyTerms.slice(0, 10),
            dates: analysis.extractedData.dates.slice(0, 5),
            amounts: analysis.extractedData.amounts.slice(0, 5),
            contacts: analysis.extractedData.contacts.slice(0, 5),
            addresses: analysis.extractedData.addresses.slice(0, 3)
          },
          createdAt: analysis.createdAt
        }
      })

    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(req.file.path).catch(() => {})
      
      // Track error event
      trackEvent('error', 'system', 'document_intelligence_error', {
        userId,
        sessionId,
        metadata: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      throw new ValidationError(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
)

/**
 * Get analysis by ID
 */
router.get('/analysis/:analysisId', asyncHandler(async (req, res) => {
  const { analysisId } = req.params
  
  try {
    const analysis = await intelligenceService.getAnalysis(analysisId)
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      })
    }

    res.json({
      success: true,
      analysis
    })
  } catch (error) {
    throw new ValidationError(`Failed to retrieve analysis: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Contract intelligence analysis
 */
router.post('/analyze/contract',
  upload.single('contract'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No contract file uploaded')
    }

    const userId = req.headers['x-user-id'] as string
    const sessionId = req.headers['x-session-id'] as string

    try {
      // Perform general analysis first
      const analysis = await intelligenceService.analyzeDocument(req.file.path, req.file.originalname)
      
      // Clean up uploaded file
      await fs.unlink(req.file.path)

      // Enhanced contract-specific analysis
      const contractAnalysis = {
        ...analysis,
        contractSpecific: {
          parties: analysis.extractedData.entities.filter(e => e.type === 'PERSON' || e.type === 'ORGANIZATION'),
          keyDates: analysis.extractedData.dates.filter(d => ['effective_date', 'expiration', 'deadline'].includes(d.type)),
          financialTerms: analysis.extractedData.amounts,
          riskFactors: analysis.riskAssessment.riskFactors,
          missingClauses: analysis.riskAssessment.riskFactors
            .filter(rf => rf.factor.includes('Missing'))
            .map(rf => rf.description),
          recommendedActions: analysis.insights.actionItems.filter(ai => ai.priority === 'high')
        }
      }

      res.json({
        success: true,
        message: 'Contract analysis completed successfully',
        contractAnalysis: {
          id: contractAnalysis.id,
          fileName: contractAnalysis.fileName,
          classification: contractAnalysis.classification,
          riskAssessment: contractAnalysis.riskAssessment,
          contractSpecific: contractAnalysis.contractSpecific,
          insights: contractAnalysis.insights,
          processingTime: contractAnalysis.processingTime,
          createdAt: contractAnalysis.createdAt
        }
      })

    } catch (error) {
      await fs.unlink(req.file.path).catch(() => {})
      throw new ValidationError(`Contract analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
)

/**
 * Invoice intelligence analysis
 */
router.post('/analyze/invoice',
  upload.single('invoice'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No invoice file uploaded')
    }

    const userId = req.headers['x-user-id'] as string
    const sessionId = req.headers['x-session-id'] as string

    try {
      const analysis = await intelligenceService.analyzeDocument(req.file.path, req.file.originalname)
      
      await fs.unlink(req.file.path)

      // Enhanced invoice-specific analysis
      const invoiceAnalysis = {
        ...analysis,
        invoiceSpecific: {
          vendor: analysis.extractedData.entities.find(e => e.type === 'ORGANIZATION'),
          invoiceNumber: analysis.extractedData.keyTerms.find(kt => kt.term.includes('invoice')),
          amounts: analysis.extractedData.amounts,
          dueDate: analysis.extractedData.dates.find(d => d.type === 'deadline'),
          lineItems: analysis.extractedData.tables,
          taxInformation: analysis.extractedData.amounts.filter(a => a.type === 'tax'),
          paymentTerms: analysis.extractedData.keyTerms.filter(kt => kt.category === 'financial'),
          anomalies: analysis.riskAssessment.riskFactors.filter(rf => rf.severity === 'high')
        }
      }

      res.json({
        success: true,
        message: 'Invoice analysis completed successfully',
        invoiceAnalysis: {
          id: invoiceAnalysis.id,
          fileName: invoiceAnalysis.fileName,
          classification: invoiceAnalysis.classification,
          riskAssessment: invoiceAnalysis.riskAssessment,
          invoiceSpecific: invoiceAnalysis.invoiceSpecific,
          insights: invoiceAnalysis.insights,
          processingTime: invoiceAnalysis.processingTime,
          createdAt: invoiceAnalysis.createdAt
        }
      })

    } catch (error) {
      await fs.unlink(req.file.path).catch(() => {})
      throw new ValidationError(`Invoice analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
)

/**
 * Compliance check
 */
router.post('/compliance-check',
  upload.single('document'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No document file uploaded')
    }

    const { regulations = [] } = req.body
    const userId = req.headers['x-user-id'] as string

    try {
      const analysis = await intelligenceService.analyzeDocument(req.file.path, req.file.originalname)
      
      await fs.unlink(req.file.path)

      const complianceReport = {
        documentId: analysis.id,
        fileName: analysis.fileName,
        complianceCheck: analysis.complianceCheck,
        riskAssessment: analysis.riskAssessment,
        recommendations: [
          ...analysis.complianceCheck.dataPrivacy.recommendations,
          ...analysis.riskAssessment.riskFactors.map(rf => rf.recommendation)
        ],
        complianceScore: Math.max(0, 100 - analysis.riskAssessment.riskScore),
        checkedAt: new Date()
      }

      res.json({
        success: true,
        message: 'Compliance check completed successfully',
        complianceReport
      })

    } catch (error) {
      await fs.unlink(req.file.path).catch(() => {})
      throw new ValidationError(`Compliance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
)

/**
 * Risk assessment
 */
router.post('/risk-assessment',
  upload.single('document'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No document file uploaded')
    }

    const userId = req.headers['x-user-id'] as string

    try {
      const analysis = await intelligenceService.analyzeDocument(req.file.path, req.file.originalname)
      
      await fs.unlink(req.file.path)

      const riskReport = {
        documentId: analysis.id,
        fileName: analysis.fileName,
        riskAssessment: analysis.riskAssessment,
        mitigationStrategies: analysis.riskAssessment.riskFactors.map(rf => ({
          risk: rf.factor,
          severity: rf.severity,
          mitigation: rf.recommendation,
          priority: rf.severity === 'high' ? 'immediate' : rf.severity === 'medium' ? 'short-term' : 'long-term'
        })),
        overallRecommendation: analysis.riskAssessment.overallRisk === 'critical' ? 
          'Immediate review required - do not proceed without legal counsel' :
          analysis.riskAssessment.overallRisk === 'high' ?
          'Careful review recommended before proceeding' :
          'Standard review process can be followed',
        assessedAt: new Date()
      }

      res.json({
        success: true,
        message: 'Risk assessment completed successfully',
        riskReport
      })

    } catch (error) {
      await fs.unlink(req.file.path).catch(() => {})
      throw new ValidationError(`Risk assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
)

/**
 * Extract specific data types
 */
router.post('/extract/:dataType',
  upload.single('document'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No document file uploaded')
    }

    const { dataType } = req.params
    const allowedTypes = ['entities', 'dates', 'amounts', 'contacts', 'addresses', 'tables', 'key-terms']
    
    if (!allowedTypes.includes(dataType)) {
      await fs.unlink(req.file.path).catch(() => {})
      throw new ValidationError(`Invalid data type. Allowed types: ${allowedTypes.join(', ')}`)
    }

    try {
      const analysis = await intelligenceService.analyzeDocument(req.file.path, req.file.originalname)
      
      await fs.unlink(req.file.path)

      let extractedData: any
      switch (dataType) {
        case 'entities':
          extractedData = analysis.extractedData.entities
          break
        case 'dates':
          extractedData = analysis.extractedData.dates
          break
        case 'amounts':
          extractedData = analysis.extractedData.amounts
          break
        case 'contacts':
          extractedData = analysis.extractedData.contacts
          break
        case 'addresses':
          extractedData = analysis.extractedData.addresses
          break
        case 'tables':
          extractedData = analysis.extractedData.tables
          break
        case 'key-terms':
          extractedData = analysis.extractedData.keyTerms
          break
      }

      res.json({
        success: true,
        message: `${dataType} extraction completed successfully`,
        documentId: analysis.id,
        fileName: analysis.fileName,
        dataType,
        extractedData,
        count: Array.isArray(extractedData) ? extractedData.length : 1,
        processingTime: analysis.processingTime
      })

    } catch (error) {
      await fs.unlink(req.file.path).catch(() => {})
      throw new ValidationError(`Data extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
)

/**
 * Get analytics statistics
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  try {
    const stats = await intelligenceService.getAnalyticsStats()
    
    res.json({
      success: true,
      analytics: {
        ...stats,
        insights: {
          mostCommonDocumentType: Object.entries(stats.documentTypes)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none',
          averageRiskLevel: Object.entries(stats.riskDistribution)
            .reduce((acc, [risk, count]) => {
              const riskValue = risk === 'low' ? 1 : risk === 'medium' ? 2 : risk === 'high' ? 3 : 4
              return acc + (riskValue * count)
            }, 0) / stats.totalAnalyses || 0,
          processingEfficiency: stats.averageProcessingTime < 5000 ? 'excellent' :
                               stats.averageProcessingTime < 10000 ? 'good' :
                               stats.averageProcessingTime < 20000 ? 'fair' : 'needs improvement'
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new ValidationError(`Failed to get analytics: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get document intelligence capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    capabilities: {
      documentTypes: {
        supported: ['PDF', 'DOCX', 'TXT', 'HTML'],
        maxFileSize: '50MB',
        features: [
          'Text extraction',
          'Metadata extraction',
          'Multi-language support',
          'Table detection'
        ]
      },
      intelligence: {
        supported: true,
        features: [
          'Entity recognition (Person, Organization, Location)',
          'Key term extraction with importance scoring',
          'Date and amount extraction',
          'Contact and address extraction',
          'Document classification',
          'Risk assessment',
          'Compliance checking',
          'Business insights generation'
        ]
      },
      analysis: {
        contractAnalysis: {
          supported: true,
          features: [
            'Party identification',
            'Key date extraction',
            'Financial terms analysis',
            'Risk factor assessment',
            'Missing clause detection'
          ]
        },
        invoiceAnalysis: {
          supported: true,
          features: [
            'Vendor identification',
            'Amount extraction',
            'Due date detection',
            'Line item analysis',
            'Tax calculation verification',
            'Anomaly detection'
          ]
        },
        complianceCheck: {
          supported: true,
          features: [
            'PII detection',
            'PHI detection',
            'Regulatory compliance assessment',
            'Data privacy recommendations',
            'Retention policy suggestions'
          ]
        },
        riskAssessment: {
          supported: true,
          features: [
            'Risk scoring (0-100)',
            'Risk factor identification',
            'Severity classification',
            'Mitigation recommendations',
            'Compliance issue detection'
          ]
        }
      },
      languages: {
        supported: ['English', 'Spanish', 'French'],
        detection: 'Automatic language detection',
        confidence: 'Language confidence scoring'
      },
      output: {
        formats: ['JSON', 'Structured data'],
        features: [
          'Detailed analysis reports',
          'Executive summaries',
          'Action item generation',
          'Workflow recommendations',
          'Business impact assessment'
        ]
      }
    },
    limits: {
      maxFileSize: '50MB',
      maxProcessingTime: '60 seconds',
      supportedFormats: ['.pdf', '.docx', '.txt', '.html'],
      maxAnalysesPerDay: 1000
    }
  })
})

/**
 * Test document intelligence with sample text
 */
router.post('/test', asyncHandler(async (req, res) => {
  const { text, fileName = 'test-document.txt' } = req.body

  if (!text || typeof text !== 'string') {
    throw new ValidationError('Text content is required and must be a string')
  }

  const userId = req.headers['x-user-id'] as string || 'test-user'
  const sessionId = req.headers['x-session-id'] as string || 'test-session'

  try {
    // Create a temporary file for testing
    const tempDir = path.join(process.cwd(), 'temp')
    await fs.mkdir(tempDir, { recursive: true })
    const tempFile = path.join(tempDir, `test-${Date.now()}.txt`)
    await fs.writeFile(tempFile, text, 'utf-8')

    // Perform analysis
    const analysis = await intelligenceService.analyzeDocument(tempFile, fileName)

    // Clean up temp file
    await fs.unlink(tempFile)

    res.json({
      success: true,
      message: 'Document intelligence test completed successfully',
      analysis: {
        id: analysis.id,
        fileName: analysis.fileName,
        classification: analysis.classification,
        riskAssessment: {
          overallRisk: analysis.riskAssessment.overallRisk,
          riskScore: analysis.riskAssessment.riskScore,
          riskFactors: analysis.riskAssessment.riskFactors.slice(0, 3)
        },
        insights: {
          summary: analysis.insights.summary,
          keyPoints: analysis.insights.keyPoints.slice(0, 3),
          actionItems: analysis.insights.actionItems.slice(0, 3)
        },
        extractedData: {
          entities: analysis.extractedData.entities.slice(0, 5),
          keyTerms: analysis.extractedData.keyTerms.slice(0, 5),
          dates: analysis.extractedData.dates.slice(0, 3),
          amounts: analysis.extractedData.amounts.slice(0, 3)
        },
        processingTime: analysis.processingTime,
        confidence: analysis.confidence
      }
    })

  } catch (error) {
    throw new ValidationError(`Document intelligence test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Health check for document intelligence service
 */
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const stats = await intelligenceService.getAnalyticsStats()
    
    res.json({
      success: true,
      status: 'healthy',
      service: 'document-intelligence',
      stats: {
        totalAnalyses: stats.totalAnalyses,
        averageProcessingTime: Math.round(stats.averageProcessingTime),
        documentTypes: Object.keys(stats.documentTypes).length
      },
      features: {
        textExtraction: true,
        entityRecognition: true,
        documentClassification: true,
        riskAssessment: true,
        complianceChecking: true,
        businessInsights: true
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: 'document-intelligence',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}))

export default router
