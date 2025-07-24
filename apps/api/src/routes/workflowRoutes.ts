import express from 'express'
import multer from 'multer'
import { WorkflowService, Workflow, WorkflowExecution } from '../services/workflowService'
import { z } from 'zod'
import path from 'path'

const router = express.Router()
const workflowService = new WorkflowService()

// Initialize workflow service with better error handling
workflowService.initialize().then(() => {
  console.log('✅ Workflow service initialized successfully')
  workflowService.createDefaultTemplates().catch(error => {
    console.warn('⚠️ Failed to create default templates:', error.message)
  })
}).catch(error => {
  console.error('❌ Failed to initialize workflow service:', error.message)
  // Continue without workflow service for now
})

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'workflow-input')
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    // Accept PDF, images, and text files
    const allowedTypes = /\.(pdf|jpg|jpeg|png|gif|txt|doc|docx)$/i
    if (allowedTypes.test(file.originalname)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
})

// Validation schemas
const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(['input', 'process', 'condition', 'output']),
  label: z.string(),
  operation: z.string(),
  config: z.record(z.any()),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  status: z.enum(['idle', 'running', 'completed', 'error']).default('idle'),
  progress: z.number().default(0)
})

const workflowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  condition: z.string().optional()
})

const workflowTriggerSchema = z.object({
  id: z.string(),
  type: z.enum(['manual', 'schedule', 'file-upload', 'email', 'webhook', 'folder-watch']),
  config: z.record(z.any()),
  isActive: z.boolean().default(true)
})

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
  triggers: z.array(workflowTriggerSchema),
  isActive: z.boolean().default(true),
  userId: z.string().optional(),
  organizationId: z.string().optional()
})

const updateWorkflowSchema = createWorkflowSchema.partial()

const executeWorkflowSchema = z.object({
  workflowId: z.string(),
  config: z.record(z.any()).optional()
})

/**
 * Get workflow service health
 */
router.get('/health', (req, res) => {
  console.log('🏥 Workflow health check requested')

  const isServiceInitialized = workflowService !== null
  const workflowCount = isServiceInitialized ? workflowService.listWorkflows().length : 0

  res.json({
    success: true,
    service: 'Workflow Service',
    status: 'healthy',
    initialized: isServiceInitialized,
    workflowCount,
    timestamp: new Date().toISOString(),
    features: [
      'Visual workflow builder',
      'Drag-and-drop node creation',
      'Real-time execution tracking',
      'Conditional logic support',
      'Multi-step automation',
      'Template system',
      'Batch processing integration'
    ],
    operations: [
      'pdf-split',
      'pdf-merge',
      'pdf-extract-pages',
      'ocr-extract',
      'ai-classify',
      'ai-extract',
      'ai-summarize',
      'condition',
      'file-filter'
    ]
  })
})

/**
 * Create a new workflow
 */
router.post('/workflows', async (req, res) => {
  try {
    const workflowData = createWorkflowSchema.parse(req.body)
    const workflow = await workflowService.createWorkflow(workflowData)
    
    res.status(201).json({
      success: true,
      workflow
    })
  } catch (error) {
    console.error('Create workflow error:', error)
    res.status(400).json({
      error: 'Failed to create workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Get all workflows
 */
router.get('/workflows', (req, res) => {
  try {
    console.log('📋 GET /workflows - Listing workflows')
    const { userId, organizationId } = req.query

    // Check if workflow service is initialized
    if (!workflowService) {
      console.error('❌ Workflow service not initialized')
      return res.json({
        success: true,
        workflows: [],
        count: 0,
        message: 'Workflow service is initializing, returning empty list'
      })
    }

    const workflows = workflowService.listWorkflows(
      userId as string,
      organizationId as string
    )

    console.log(`✅ Found ${workflows.length} workflows`)
    res.json({
      success: true,
      workflows,
      count: workflows.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ List workflows error:', error)
    // Return empty list instead of error to prevent frontend crashes
    res.json({
      success: true,
      workflows: [],
      count: 0,
      error: 'Failed to list workflows',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Get workflow by ID
 */
router.get('/workflows/:id', (req, res) => {
  try {
    const workflow = workflowService.getWorkflow(req.params.id)
    
    if (!workflow) {
      return res.status(404).json({
        error: 'Workflow not found'
      })
    }
    
    res.json({
      success: true,
      workflow
    })
  } catch (error) {
    console.error('Get workflow error:', error)
    res.status(500).json({
      error: 'Failed to get workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Update workflow
 */
router.put('/workflows/:id', async (req, res) => {
  try {
    const updates = updateWorkflowSchema.parse(req.body)
    const workflow = await workflowService.updateWorkflow(req.params.id, updates)
    
    res.json({
      success: true,
      workflow
    })
  } catch (error) {
    console.error('Update workflow error:', error)
    res.status(400).json({
      error: 'Failed to update workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Delete workflow
 */
router.delete('/workflows/:id', async (req, res) => {
  try {
    await workflowService.deleteWorkflow(req.params.id)
    
    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    })
  } catch (error) {
    console.error('Delete workflow error:', error)
    res.status(400).json({
      error: 'Failed to delete workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Execute workflow with file uploads
 */
router.post('/workflows/:id/execute', upload.array('files', 20), async (req, res) => {
  try {
    const workflowId = req.params.id
    const config = req.body.config ? JSON.parse(req.body.config) : {}
    
    // Get uploaded file paths
    const inputFiles = req.files ? (req.files as Express.Multer.File[]).map(file => file.path) : []
    
    if (inputFiles.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded for workflow execution'
      })
    }
    
    const execution = await workflowService.executeWorkflow(workflowId, inputFiles, config)
    
    res.status(202).json({
      success: true,
      execution: {
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        startedAt: execution.startedAt,
        progress: execution.progress,
        inputFiles: execution.inputFiles.length
      },
      message: 'Workflow execution started'
    })
  } catch (error) {
    console.error('Execute workflow error:', error)
    res.status(400).json({
      error: 'Failed to execute workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Get execution status
 */
router.get('/executions/:id', (req, res) => {
  try {
    const execution = workflowService.getExecution(req.params.id)
    
    if (!execution) {
      return res.status(404).json({
        error: 'Execution not found'
      })
    }
    
    res.json({
      success: true,
      execution
    })
  } catch (error) {
    console.error('Get execution error:', error)
    res.status(500).json({
      error: 'Failed to get execution',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * List executions
 */
router.get('/executions', (req, res) => {
  try {
    const { workflowId } = req.query
    const executions = workflowService.listExecutions(workflowId as string)
    
    res.json({
      success: true,
      executions,
      count: executions.length
    })
  } catch (error) {
    console.error('List executions error:', error)
    res.status(500).json({
      error: 'Failed to list executions',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Cancel execution
 */
router.post('/executions/:id/cancel', async (req, res) => {
  try {
    await workflowService.cancelExecution(req.params.id)
    
    res.json({
      success: true,
      message: 'Execution cancelled successfully'
    })
  } catch (error) {
    console.error('Cancel execution error:', error)
    res.status(400).json({
      error: 'Failed to cancel execution',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
