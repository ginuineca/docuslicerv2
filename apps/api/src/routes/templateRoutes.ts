import express from 'express'
import { TemplateService, ProcessingTemplate } from '../services/templateService'
import { z } from 'zod'

const router = express.Router()
const templateService = new TemplateService()

// Initialize template service and create predefined templates
templateService.initialize().then(() => {
  templateService.createPredefinedTemplates().catch(console.error)
}).catch(console.error)

// Validation schemas
const templateStepSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['split', 'merge', 'extract', 'form-fill', 'ocr', 'condition']),
  name: z.string().min(1),
  config: z.record(z.any()),
  order: z.number()
})

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['document-processing', 'form-automation', 'text-extraction', 'custom']),
  tags: z.array(z.string()),
  steps: z.array(templateStepSchema),
  isPublic: z.boolean().optional().default(false),
  createdBy: z.string().optional()
})

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(['document-processing', 'form-automation', 'text-extraction', 'custom']).optional(),
  tags: z.array(z.string()).optional(),
  steps: z.array(templateStepSchema).optional(),
  isPublic: z.boolean().optional()
})

/**
 * Create a new template
 */
router.post('/create', async (req, res) => {
  try {
    const templateData = createTemplateSchema.parse(req.body)
    
    // Validate template structure
    const validation = templateService.validateTemplate(templateData)
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid template structure',
        details: validation.errors
      })
    }

    const template = await templateService.createTemplate(templateData)

    res.json({
      success: true,
      template,
      message: 'Template created successfully'
    })
  } catch (error) {
    console.error('Create template error:', error)
    res.status(500).json({
      error: 'Failed to create template',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Get template by ID
 */
router.get('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params
    const template = await templateService.getTemplate(templateId)

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json({
      success: true,
      template
    })
  } catch (error) {
    console.error('Get template error:', error)
    res.status(500).json({
      error: 'Failed to get template',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Update template
 */
router.put('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params
    const updates = updateTemplateSchema.parse(req.body)

    const template = await templateService.updateTemplate(templateId, updates)

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json({
      success: true,
      template,
      message: 'Template updated successfully'
    })
  } catch (error) {
    console.error('Update template error:', error)
    res.status(500).json({
      error: 'Failed to update template',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Delete template
 */
router.delete('/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params
    const success = await templateService.deleteTemplate(templateId)

    if (!success) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error) {
    console.error('Delete template error:', error)
    res.status(500).json({
      error: 'Failed to delete template',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * List templates with filtering
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      tags,
      isPublic,
      createdBy,
      search,
      popular
    } = req.query

    let templates: ProcessingTemplate[]

    if (popular === 'true') {
      const limit = parseInt(req.query.limit as string) || 10
      templates = await templateService.getPopularTemplates(limit)
    } else {
      const filters: any = {}
      
      if (category) filters.category = category
      if (isPublic !== undefined) filters.isPublic = isPublic === 'true'
      if (createdBy) filters.createdBy = createdBy
      if (search) filters.search = search
      if (tags) {
        filters.tags = Array.isArray(tags) ? tags : [tags]
      }

      templates = await templateService.listTemplates(filters)
    }

    res.json({
      success: true,
      templates,
      count: templates.length
    })
  } catch (error) {
    console.error('List templates error:', error)
    res.status(500).json({
      error: 'Failed to list templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Search templates
 */
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params
    const { category, tags } = req.query

    const filters: any = {}
    if (category) filters.category = category
    if (tags) {
      filters.tags = Array.isArray(tags) ? tags : [tags]
    }

    const templates = await templateService.searchTemplates(query, filters)

    res.json({
      success: true,
      templates,
      count: templates.length,
      query
    })
  } catch (error) {
    console.error('Search templates error:', error)
    res.status(500).json({
      error: 'Failed to search templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Clone template
 */
router.post('/:templateId/clone', async (req, res) => {
  try {
    const { templateId } = req.params
    const { name, createdBy } = req.body

    const clonedTemplate = await templateService.cloneTemplate(templateId, name, createdBy)

    if (!clonedTemplate) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json({
      success: true,
      template: clonedTemplate,
      message: 'Template cloned successfully'
    })
  } catch (error) {
    console.error('Clone template error:', error)
    res.status(500).json({
      error: 'Failed to clone template',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Use template (increment usage count)
 */
router.post('/:templateId/use', async (req, res) => {
  try {
    const { templateId } = req.params
    
    const template = await templateService.getTemplate(templateId)
    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    await templateService.incrementUsageCount(templateId)

    res.json({
      success: true,
      template,
      message: 'Template usage recorded'
    })
  } catch (error) {
    console.error('Use template error:', error)
    res.status(500).json({
      error: 'Failed to record template usage',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Get template categories
 */
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = [
      {
        id: 'document-processing',
        name: 'Document Processing',
        description: 'Templates for splitting, merging, and organizing documents',
        icon: 'FileText'
      },
      {
        id: 'form-automation',
        name: 'Form Automation',
        description: 'Templates for processing and filling PDF forms',
        icon: 'CheckSquare'
      },
      {
        id: 'text-extraction',
        name: 'Text Extraction',
        description: 'Templates for OCR and text processing workflows',
        icon: 'Type'
      },
      {
        id: 'custom',
        name: 'Custom',
        description: 'User-created custom workflow templates',
        icon: 'Settings'
      }
    ]

    res.json({
      success: true,
      categories
    })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({
      error: 'Failed to get categories',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Validate template
 */
router.post('/validate', async (req, res) => {
  try {
    const templateData = req.body
    const validation = templateService.validateTemplate(templateData)

    res.json({
      success: true,
      validation
    })
  } catch (error) {
    console.error('Validate template error:', error)
    res.status(500).json({
      error: 'Failed to validate template',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
