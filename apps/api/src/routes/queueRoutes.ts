import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { QueueService, BatchJobData } from '../services/queueService'
import { z } from 'zod'

const router = express.Router()
const queueService = new QueueService()

// Initialize queue service
queueService.initialize().catch(console.error)

// Configure multer for batch file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'batch')
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
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 50 // Maximum 50 files per batch
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and image files are allowed'))
    }
  }
})

// Validation schemas
const batchSplitSchema = z.object({
  ranges: z.array(z.object({
    start: z.number().min(1),
    end: z.number().min(1),
    name: z.string().min(1)
  })).optional(),
  userId: z.string().optional()
})

const batchMergeSchema = z.object({
  outputName: z.string().min(1),
  preserveBookmarks: z.boolean().optional(),
  addPageNumbers: z.boolean().optional(),
  userId: z.string().optional()
})

const batchOCRSchema = z.object({
  pages: z.array(z.number()).optional(),
  density: z.number().min(72).max(600).optional(),
  userId: z.string().optional()
})

const batchTemplateSchema = z.object({
  templateId: z.string().min(1),
  userId: z.string().optional()
})

/**
 * Submit batch split job
 */
router.post('/batch-split', upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const config = batchSplitSchema.parse(req.body)
    const filePaths = req.files.map(file => file.path)

    // Validate all files are PDFs
    for (const file of req.files) {
      if (file.mimetype !== 'application/pdf') {
        // Clean up uploaded files
        await Promise.all(filePaths.map(fp => fs.unlink(fp).catch(() => {})))
        return res.status(400).json({ error: 'All files must be PDF format' })
      }
    }

    const outputDir = path.join(process.cwd(), 'uploads', 'output', 'batch', Date.now().toString())

    const job = await queueService.addBatchJob({
      type: 'batch-split',
      files: filePaths,
      config,
      userId: config.userId,
      outputDir
    })

    if (!job) {
      return res.status(500).json({ error: 'Failed to queue batch job' })
    }

    res.json({
      success: true,
      jobId: job.id,
      message: `Batch split job queued for ${req.files.length} files`,
      filesCount: req.files.length
    })
  } catch (error) {
    console.error('Batch split error:', error)
    
    // Clean up files on error
    if (req.files && Array.isArray(req.files)) {
      await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})))
    }

    res.status(500).json({
      error: 'Failed to submit batch split job',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Submit batch merge job
 */
router.post('/batch-merge', upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length < 2) {
      return res.status(400).json({ error: 'At least 2 files required for merging' })
    }

    const config = batchMergeSchema.parse(req.body)
    const filePaths = req.files.map(file => file.path)

    // Validate all files are PDFs
    for (const file of req.files) {
      if (file.mimetype !== 'application/pdf') {
        await Promise.all(filePaths.map(fp => fs.unlink(fp).catch(() => {})))
        return res.status(400).json({ error: 'All files must be PDF format' })
      }
    }

    const outputDir = path.join(process.cwd(), 'uploads', 'output', 'batch', Date.now().toString())

    const job = await queueService.addBatchJob({
      type: 'batch-merge',
      files: filePaths,
      config,
      userId: config.userId,
      outputDir
    })

    if (!job) {
      return res.status(500).json({ error: 'Failed to queue batch job' })
    }

    res.json({
      success: true,
      jobId: job.id,
      message: `Batch merge job queued for ${req.files.length} files`,
      filesCount: req.files.length
    })
  } catch (error) {
    console.error('Batch merge error:', error)
    
    if (req.files && Array.isArray(req.files)) {
      await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})))
    }

    res.status(500).json({
      error: 'Failed to submit batch merge job',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Submit batch OCR job
 */
router.post('/batch-ocr', upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const config = batchOCRSchema.parse(req.body)
    const filePaths = req.files.map(file => file.path)

    const outputDir = path.join(process.cwd(), 'uploads', 'output', 'batch', Date.now().toString())

    const job = await queueService.addBatchJob({
      type: 'batch-ocr',
      files: filePaths,
      config,
      userId: config.userId,
      outputDir
    })

    if (!job) {
      return res.status(500).json({ error: 'Failed to queue batch job' })
    }

    res.json({
      success: true,
      jobId: job.id,
      message: `Batch OCR job queued for ${req.files.length} files`,
      filesCount: req.files.length
    })
  } catch (error) {
    console.error('Batch OCR error:', error)
    
    if (req.files && Array.isArray(req.files)) {
      await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})))
    }

    res.status(500).json({
      error: 'Failed to submit batch OCR job',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Submit batch template job
 */
router.post('/batch-template', upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

    const config = batchTemplateSchema.parse(req.body)
    const filePaths = req.files.map(file => file.path)

    const outputDir = path.join(process.cwd(), 'uploads', 'output', 'batch', Date.now().toString())

    const job = await queueService.addBatchJob({
      type: 'batch-template',
      files: filePaths,
      config,
      userId: config.userId,
      outputDir
    })

    if (!job) {
      return res.status(500).json({ error: 'Failed to queue batch job' })
    }

    res.json({
      success: true,
      jobId: job.id,
      message: `Batch template job queued for ${req.files.length} files`,
      filesCount: req.files.length,
      templateId: config.templateId
    })
  } catch (error) {
    console.error('Batch template error:', error)
    
    if (req.files && Array.isArray(req.files)) {
      await Promise.all(req.files.map(file => fs.unlink(file.path).catch(() => {})))
    }

    res.status(500).json({
      error: 'Failed to submit batch template job',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Get job status
 */
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    const status = await queueService.getJobStatus(jobId)

    if (!status) {
      return res.status(404).json({ error: 'Job not found' })
    }

    res.json({
      success: true,
      job: status
    })
  } catch (error) {
    console.error('Get job status error:', error)
    res.status(500).json({
      error: 'Failed to get job status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Get user jobs
 */
router.get('/jobs/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const limit = parseInt(req.query.limit as string) || 50
    
    const jobs = await queueService.getUserJobs(userId, limit)

    res.json({
      success: true,
      jobs,
      count: jobs.length
    })
  } catch (error) {
    console.error('Get user jobs error:', error)
    res.status(500).json({
      error: 'Failed to get user jobs',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Cancel job
 */
router.delete('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    const success = await queueService.cancelJob(jobId)

    if (!success) {
      return res.status(404).json({ error: 'Job not found or cannot be cancelled' })
    }

    res.json({
      success: true,
      message: 'Job cancelled successfully'
    })
  } catch (error) {
    console.error('Cancel job error:', error)
    res.status(500).json({
      error: 'Failed to cancel job',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Get queue statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await queueService.getQueueStats()

    res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Get queue stats error:', error)
    res.status(500).json({
      error: 'Failed to get queue statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Health check for queue service
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await queueService.getQueueStats()
    
    res.json({
      success: true,
      status: 'healthy',
      message: 'Queue service is operational',
      stats
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Queue service is not available',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
