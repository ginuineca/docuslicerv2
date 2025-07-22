import fs from 'fs/promises'
import path from 'path'

export interface TemplateStep {
  id: string
  type: 'split' | 'merge' | 'extract' | 'form-fill' | 'ocr' | 'condition'
  name: string
  config: Record<string, any>
  order: number
}

export interface ProcessingTemplate {
  id: string
  name: string
  description: string
  category: 'document-processing' | 'form-automation' | 'text-extraction' | 'custom'
  tags: string[]
  steps: TemplateStep[]
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  isPublic: boolean
  usageCount: number
  rating?: number
  version: string
}

export interface TemplateExecution {
  id: string
  templateId: string
  status: 'pending' | 'running' | 'completed' | 'error'
  progress: number
  startedAt: Date
  completedAt?: Date
  inputFiles: string[]
  outputFiles: string[]
  error?: string
  executionLog: Array<{
    stepId: string
    status: 'pending' | 'running' | 'completed' | 'error'
    startedAt: Date
    completedAt?: Date
    error?: string
    output?: any
  }>
}

export class TemplateService {
  private templatesDir: string
  private executionsDir: string

  constructor() {
    this.templatesDir = path.join(process.cwd(), 'data', 'templates')
    this.executionsDir = path.join(process.cwd(), 'data', 'executions')
  }

  /**
   * Initialize directories
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.templatesDir, { recursive: true })
    await fs.mkdir(this.executionsDir, { recursive: true })
  }

  /**
   * Create a new template
   */
  async createTemplate(template: Omit<ProcessingTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'version'>): Promise<ProcessingTemplate> {
    await this.initialize()

    const newTemplate: ProcessingTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      version: '1.0.0'
    }

    const templatePath = path.join(this.templatesDir, `${newTemplate.id}.json`)
    await fs.writeFile(templatePath, JSON.stringify(newTemplate, null, 2))

    return newTemplate
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<ProcessingTemplate | null> {
    try {
      const templatePath = path.join(this.templatesDir, `${templateId}.json`)
      const templateData = await fs.readFile(templatePath, 'utf-8')
      return JSON.parse(templateData)
    } catch (error) {
      return null
    }
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, updates: Partial<ProcessingTemplate>): Promise<ProcessingTemplate | null> {
    const template = await this.getTemplate(templateId)
    if (!template) return null

    const updatedTemplate = {
      ...template,
      ...updates,
      id: template.id, // Ensure ID doesn't change
      updatedAt: new Date()
    }

    const templatePath = path.join(this.templatesDir, `${templateId}.json`)
    await fs.writeFile(templatePath, JSON.stringify(updatedTemplate, null, 2))

    return updatedTemplate
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const templatePath = path.join(this.templatesDir, `${templateId}.json`)
      await fs.unlink(templatePath)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * List templates with filtering
   */
  async listTemplates(filters: {
    category?: string
    tags?: string[]
    isPublic?: boolean
    createdBy?: string
    search?: string
  } = {}): Promise<ProcessingTemplate[]> {
    await this.initialize()

    try {
      const files = await fs.readdir(this.templatesDir)
      const templates: ProcessingTemplate[] = []

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const templateData = await fs.readFile(path.join(this.templatesDir, file), 'utf-8')
            const template: ProcessingTemplate = JSON.parse(templateData)
            
            // Apply filters
            if (filters.category && template.category !== filters.category) continue
            if (filters.isPublic !== undefined && template.isPublic !== filters.isPublic) continue
            if (filters.createdBy && template.createdBy !== filters.createdBy) continue
            if (filters.tags && !filters.tags.some(tag => template.tags.includes(tag))) continue
            if (filters.search) {
              const searchLower = filters.search.toLowerCase()
              const matchesSearch = template.name.toLowerCase().includes(searchLower) ||
                                  template.description.toLowerCase().includes(searchLower) ||
                                  template.tags.some(tag => tag.toLowerCase().includes(searchLower))
              if (!matchesSearch) continue
            }

            templates.push(template)
          } catch (error) {
            console.warn(`Failed to parse template file ${file}:`, error)
          }
        }
      }

      // Sort by usage count and creation date
      return templates.sort((a, b) => {
        if (a.usageCount !== b.usageCount) {
          return b.usageCount - a.usageCount
        }

        // Safe date comparison with fallback
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)

        // Handle invalid dates
        const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime()
        const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime()

        return timeB - timeA
      })
    } catch (error) {
      console.error('Error listing templates:', error)
      return []
    }
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit: number = 10): Promise<ProcessingTemplate[]> {
    const templates = await this.listTemplates({ isPublic: true })
    return templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  /**
   * Search templates
   */
  async searchTemplates(query: string, filters: {
    category?: string
    tags?: string[]
  } = {}): Promise<ProcessingTemplate[]> {
    return this.listTemplates({
      ...filters,
      search: query,
      isPublic: true
    })
  }

  /**
   * Clone template (create a copy)
   */
  async cloneTemplate(templateId: string, newName?: string, createdBy?: string): Promise<ProcessingTemplate | null> {
    const originalTemplate = await this.getTemplate(templateId)
    if (!originalTemplate) return null

    const clonedTemplate = await this.createTemplate({
      name: newName || `${originalTemplate.name} (Copy)`,
      description: originalTemplate.description,
      category: originalTemplate.category,
      tags: [...originalTemplate.tags],
      steps: originalTemplate.steps.map(step => ({ ...step })),
      createdBy,
      isPublic: false
    })

    return clonedTemplate
  }

  /**
   * Increment template usage count
   */
  async incrementUsageCount(templateId: string): Promise<void> {
    const template = await this.getTemplate(templateId)
    if (template) {
      await this.updateTemplate(templateId, {
        usageCount: template.usageCount + 1
      })
    }
  }

  /**
   * Create predefined templates
   */
  async createPredefinedTemplates(): Promise<void> {
    const predefinedTemplates: Array<Omit<ProcessingTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'version'>> = [
      {
        name: 'Invoice Processing',
        description: 'Extract text from invoice PDFs and organize data',
        category: 'document-processing',
        tags: ['invoice', 'ocr', 'business'],
        isPublic: true,
        steps: [
          {
            id: 'step1',
            type: 'ocr',
            name: 'Extract Text',
            config: { density: 300, pages: 'all' },
            order: 1
          },
          {
            id: 'step2',
            type: 'extract',
            name: 'Extract First Page',
            config: { pages: [1] },
            order: 2
          }
        ]
      },
      {
        name: 'Contract Splitting',
        description: 'Split multi-page contracts into individual documents',
        category: 'document-processing',
        tags: ['contract', 'split', 'legal'],
        isPublic: true,
        steps: [
          {
            id: 'step1',
            type: 'split',
            name: 'Split by Pages',
            config: { method: 'pages', interval: 2 },
            order: 1
          }
        ]
      },
      {
        name: 'Form Data Extraction',
        description: 'Extract data from filled PDF forms',
        category: 'form-automation',
        tags: ['forms', 'data-extraction', 'automation'],
        isPublic: true,
        steps: [
          {
            id: 'step1',
            type: 'form-fill',
            name: 'Extract Form Data',
            config: { extractOnly: true },
            order: 1
          }
        ]
      },
      {
        name: 'Document Archive',
        description: 'OCR and merge multiple documents into searchable archive',
        category: 'text-extraction',
        tags: ['archive', 'ocr', 'merge', 'searchable'],
        isPublic: true,
        steps: [
          {
            id: 'step1',
            type: 'ocr',
            name: 'Extract Text from All',
            config: { density: 200, pages: 'all' },
            order: 1
          },
          {
            id: 'step2',
            type: 'merge',
            name: 'Combine Documents',
            config: { outputName: 'archive', addPageNumbers: true },
            order: 2
          }
        ]
      }
    ]

    for (const template of predefinedTemplates) {
      // Check if template already exists
      const existing = await this.searchTemplates(template.name)
      if (existing.length === 0) {
        await this.createTemplate(template)
      }
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Validate template structure
   */
  validateTemplate(template: Partial<ProcessingTemplate>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required')
    }

    if (!template.description || template.description.trim().length === 0) {
      errors.push('Template description is required')
    }

    if (!template.steps || template.steps.length === 0) {
      errors.push('Template must have at least one step')
    }

    if (template.steps) {
      const stepIds = new Set()
      for (const step of template.steps) {
        if (!step.id || step.id.trim().length === 0) {
          errors.push('Each step must have an ID')
        } else if (stepIds.has(step.id)) {
          errors.push(`Duplicate step ID: ${step.id}`)
        } else {
          stepIds.add(step.id)
        }

        if (!step.type) {
          errors.push(`Step ${step.id} must have a type`)
        }

        if (!step.name || step.name.trim().length === 0) {
          errors.push(`Step ${step.id} must have a name`)
        }

        if (typeof step.order !== 'number') {
          errors.push(`Step ${step.id} must have a numeric order`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
