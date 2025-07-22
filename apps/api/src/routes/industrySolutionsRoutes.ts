import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { z } from 'zod'
import { asyncHandler, ValidationError } from '../middleware/errorHandler'
import { IndustrySolutionsService } from '../services/industrySolutionsService'
import { trackEvent } from '../middleware/analyticsMiddleware'
import { webhookEventService } from '../services/webhookEventService'

const router = express.Router()
const industryService = new IndustrySolutionsService()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'industry')
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
 * Get all industry solutions
 */
router.get('/solutions', asyncHandler(async (req, res) => {
  const { industry } = req.query
  
  try {
    const solutions = await industryService.listSolutions(industry as string)
    
    res.json({
      success: true,
      solutions: solutions.map(solution => ({
        id: solution.id,
        name: solution.name,
        industry: solution.industry,
        description: solution.description,
        features: solution.features,
        pricing: solution.pricing,
        createdAt: solution.createdAt
      })),
      total: solutions.length
    })
  } catch (error) {
    throw new ValidationError(`Failed to get solutions: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get specific industry solution
 */
router.get('/solutions/:solutionId', asyncHandler(async (req, res) => {
  const { solutionId } = req.params
  
  try {
    const solution = await industryService.getSolution(solutionId)
    
    if (!solution) {
      return res.status(404).json({
        success: false,
        message: 'Solution not found'
      })
    }

    res.json({
      success: true,
      solution
    })
  } catch (error) {
    throw new ValidationError(`Failed to get solution: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Process document with industry-specific analysis
 */
router.post('/process/:industry',
  upload.single('document'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No document file uploaded')
    }

    const { industry } = req.params
    const { solutionId } = req.body
    const userId = req.headers['x-user-id'] as string
    const sessionId = req.headers['x-session-id'] as string

    const allowedIndustries = ['legal', 'healthcare', 'real_estate', 'financial_services', 'manufacturing', 'education']
    if (!allowedIndustries.includes(industry)) {
      await fs.unlink(req.file.path).catch(() => {})
      throw new ValidationError(`Invalid industry. Allowed industries: ${allowedIndustries.join(', ')}`)
    }

    const startTime = Date.now()

    try {
      // Process document with industry-specific analysis
      const result = await industryService.processDocumentForIndustry(
        req.file.path,
        req.file.originalname,
        industry,
        solutionId
      )

      // Clean up uploaded file
      await fs.unlink(req.file.path)

      const processingTime = Date.now() - startTime

      // Track analytics event
      trackEvent('industry_processing', 'user', 'document_processed', {
        userId,
        sessionId,
        documentId: result.analysis.id,
        metadata: {
          industry,
          solutionId,
          fileName: result.analysis.fileName,
          fileType: result.analysis.fileType,
          fileSize: result.analysis.fileSize,
          processingTime,
          documentType: result.analysis.classification.primaryType,
          riskLevel: result.analysis.riskAssessment.overallRisk,
          complianceStatus: result.complianceStatus.overall,
          automationOpportunities: result.automationOpportunities.length
        },
        duration: processingTime
      })

      // Trigger webhook event
      await webhookEventService.triggerAIOperationCompleted({
        operationType: 'industry_document_processing',
        documentId: result.analysis.id,
        results: {
          industry,
          documentType: result.analysis.classification.primaryType,
          riskLevel: result.analysis.riskAssessment.overallRisk,
          complianceStatus: result.complianceStatus.overall,
          recommendationsCount: result.recommendations.length,
          automationOpportunities: result.automationOpportunities.length
        },
        processingTime,
        confidence: result.analysis.confidence,
        userId,
        sessionId
      })

      res.status(201).json({
        success: true,
        message: `${industry} document processing completed successfully`,
        result: {
          documentId: result.analysis.id,
          fileName: result.analysis.fileName,
          industry,
          classification: result.analysis.classification,
          riskAssessment: {
            overallRisk: result.analysis.riskAssessment.overallRisk,
            riskScore: result.analysis.riskAssessment.riskScore,
            riskFactors: result.analysis.riskAssessment.riskFactors.slice(0, 5)
          },
          industryInsights: result.industryInsights,
          recommendations: result.recommendations.slice(0, 10),
          complianceStatus: result.complianceStatus,
          automationOpportunities: result.automationOpportunities.slice(0, 8),
          extractedData: {
            entities: result.analysis.extractedData.entities.slice(0, 10),
            keyTerms: result.analysis.extractedData.keyTerms.slice(0, 10),
            dates: result.analysis.extractedData.dates.slice(0, 5),
            amounts: result.analysis.extractedData.amounts.slice(0, 5),
            contacts: result.analysis.extractedData.contacts.slice(0, 5)
          },
          processingTime,
          createdAt: result.analysis.createdAt
        }
      })

    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(req.file.path).catch(() => {})
      
      // Track error event
      trackEvent('error', 'system', 'industry_processing_error', {
        userId,
        sessionId,
        metadata: {
          industry,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      throw new ValidationError(`Industry document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  })
)

/**
 * Test industry processing with sample text
 */
router.post('/test/:industry', asyncHandler(async (req, res) => {
  const { industry } = req.params
  const { text, fileName = 'test-document.txt', solutionId } = req.body
  
  if (!text || typeof text !== 'string') {
    throw new ValidationError('Text content is required and must be a string')
  }

  const allowedIndustries = ['legal', 'healthcare', 'real_estate', 'financial_services', 'manufacturing', 'education']
  if (!allowedIndustries.includes(industry)) {
    throw new ValidationError(`Invalid industry. Allowed industries: ${allowedIndustries.join(', ')}`)
  }

  const userId = req.headers['x-user-id'] as string || 'test-user'
  const sessionId = req.headers['x-session-id'] as string || 'test-session'

  try {
    // Create a temporary file for testing
    const tempDir = path.join(process.cwd(), 'temp')
    await fs.mkdir(tempDir, { recursive: true })
    const tempFile = path.join(tempDir, `test-${Date.now()}.txt`)
    await fs.writeFile(tempFile, text, 'utf-8')

    // Process with industry-specific analysis
    const result = await industryService.processDocumentForIndustry(tempFile, fileName, industry, solutionId)

    // Clean up temp file
    await fs.unlink(tempFile)

    res.json({
      success: true,
      message: `${industry} document test completed successfully`,
      result: {
        documentId: result.analysis.id,
        fileName: result.analysis.fileName,
        industry,
        classification: result.analysis.classification,
        riskAssessment: {
          overallRisk: result.analysis.riskAssessment.overallRisk,
          riskScore: result.analysis.riskAssessment.riskScore,
          riskFactors: result.analysis.riskAssessment.riskFactors.slice(0, 3)
        },
        industryInsights: result.industryInsights,
        recommendations: result.recommendations.slice(0, 5),
        complianceStatus: result.complianceStatus,
        automationOpportunities: result.automationOpportunities.slice(0, 5),
        processingTime: result.analysis.processingTime,
        confidence: result.analysis.confidence
      }
    })

  } catch (error) {
    throw new ValidationError(`Industry test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get industry analytics
 */
router.get('/analytics', asyncHandler(async (req, res) => {
  const { industry } = req.query
  
  try {
    const analytics = await industryService.getIndustryAnalytics(industry as string)
    
    res.json({
      success: true,
      analytics,
      summary: {
        totalIndustries: analytics.length,
        totalUsers: analytics.reduce((sum, a) => sum + a.activeUsers, 0),
        totalDocuments: analytics.reduce((sum, a) => sum + a.documentVolume, 0),
        averageComplianceScore: analytics.reduce((sum, a) => sum + a.complianceScore, 0) / analytics.length,
        averageAutomationRate: analytics.reduce((sum, a) => sum + a.automationRate, 0) / analytics.length,
        totalTimeSaved: analytics.reduce((sum, a) => sum + a.timesSaved, 0),
        totalCostSavings: analytics.reduce((sum, a) => sum + a.costSavings, 0)
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    throw new ValidationError(`Failed to get analytics: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get industry capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    capabilities: {
      industries: {
        supported: [
          {
            id: 'legal',
            name: 'Legal Services',
            description: 'Legal practice management and document processing',
            features: [
              'Contract analysis and review',
              'Case document organization',
              'E-discovery preparation',
              'Court filing integration',
              'Billable time tracking',
              'Compliance monitoring'
            ]
          },
          {
            id: 'healthcare',
            name: 'Healthcare',
            description: 'HIPAA-compliant healthcare document management',
            features: [
              'HIPAA compliance monitoring',
              'Patient record management',
              'Insurance claim processing',
              'PHI protection',
              'Regulatory reporting',
              'Quality assurance tracking'
            ]
          },
          {
            id: 'real_estate',
            name: 'Real Estate',
            description: 'Real estate transaction and document management',
            features: [
              'Property disclosure automation',
              'Contract package assembly',
              'Closing document management',
              'Multi-party coordination',
              'Transaction timeline tracking',
              'Commission calculations'
            ]
          },
          {
            id: 'financial_services',
            name: 'Financial Services',
            description: 'Regulatory-compliant financial document processing',
            features: [
              'Risk assessment automation',
              'Regulatory reporting',
              'Client onboarding (KYC)',
              'Audit documentation',
              'Compliance monitoring',
              'Anti-money laundering (AML)'
            ]
          }
        ]
      },
      processing: {
        documentTypes: ['PDF', 'DOCX', 'TXT', 'HTML'],
        maxFileSize: '50MB',
        features: [
          'Industry-specific document classification',
          'Compliance checking and monitoring',
          'Risk assessment and scoring',
          'Automation opportunity identification',
          'Industry-specific insights generation',
          'Regulatory requirement validation'
        ]
      },
      compliance: {
        regulations: [
          'HIPAA (Healthcare)',
          'SOX (Financial Services)',
          'GDPR (Data Privacy)',
          'AML (Anti-Money Laundering)',
          'KYC (Know Your Customer)',
          'SEC (Securities)',
          'FINRA (Financial Industry)'
        ],
        features: [
          'Automated compliance checking',
          'Risk factor identification',
          'Regulatory reporting',
          'Audit trail management',
          'Policy enforcement',
          'Violation detection'
        ]
      },
      automation: {
        supported: true,
        features: [
          'Document workflow automation',
          'Approval process management',
          'Deadline tracking and reminders',
          'Data extraction and validation',
          'Integration with industry systems',
          'Custom rule configuration'
        ]
      },
      integrations: {
        legal: ['Case management systems', 'Court filing systems', 'Legal research platforms'],
        healthcare: ['EHR systems', 'Practice management', 'Insurance platforms'],
        real_estate: ['MLS systems', 'Transaction management', 'CRM platforms'],
        financial_services: ['Core banking systems', 'Trading platforms', 'Compliance systems']
      }
    },
    limits: {
      maxFileSize: '50MB',
      maxProcessingTime: '120 seconds',
      supportedFormats: ['.pdf', '.docx', '.txt', '.html'],
      maxDocumentsPerDay: 10000
    }
  })
})

/**
 * Health check for industry solutions service
 */
router.get('/health', asyncHandler(async (req, res) => {
  try {
    const solutions = await industryService.listSolutions()
    const analytics = await industryService.getIndustryAnalytics()
    
    res.json({
      success: true,
      status: 'healthy',
      service: 'industry-solutions',
      stats: {
        totalSolutions: solutions.length,
        supportedIndustries: analytics.length,
        totalActiveUsers: analytics.reduce((sum, a) => sum + a.activeUsers, 0),
        averageComplianceScore: Math.round(analytics.reduce((sum, a) => sum + a.complianceScore, 0) / analytics.length)
      },
      features: {
        documentProcessing: true,
        complianceChecking: true,
        riskAssessment: true,
        automationIdentification: true,
        industryInsights: true,
        regulatoryReporting: true
      },
      industries: {
        legal: true,
        healthcare: true,
        realEstate: true,
        financialServices: true,
        manufacturing: false, // Coming soon
        education: false // Coming soon
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: 'industry-solutions',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}))

export default router
