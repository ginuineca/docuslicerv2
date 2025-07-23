import { PDFService } from './pdfService'
import { OCRService } from './ocrService'
import { AIService } from './aiService'
import { QueueService } from './queueService'
import fs from 'fs/promises'
import path from 'path'

export interface WorkflowNode {
  id: string
  type: 'input' | 'process' | 'condition' | 'output'
  label: string
  operation: string
  config: Record<string, any>
  position: { x: number; y: number }
  status: 'idle' | 'running' | 'completed' | 'error'
  progress: number
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  triggers: WorkflowTrigger[]
  createdAt: Date
  updatedAt: Date
  userId?: string
  organizationId?: string
  isActive: boolean
  version: number
}

export interface WorkflowTrigger {
  id: string
  type: 'manual' | 'schedule' | 'file-upload' | 'email' | 'webhook' | 'folder-watch'
  config: Record<string, any>
  isActive: boolean
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: Date
  completedAt?: Date
  inputFiles: string[]
  outputFiles: string[]
  logs: WorkflowLog[]
  error?: string
  progress: number
}

export interface WorkflowLog {
  timestamp: Date
  level: 'info' | 'warn' | 'error'
  message: string
  nodeId?: string
  data?: any
}

export class WorkflowService {
  private pdfService: PDFService
  private ocrService: OCRService
  private aiService: AIService
  private queueService: QueueService
  private workflows: Map<string, Workflow> = new Map()
  private executions: Map<string, WorkflowExecution> = new Map()
  private dataDir: string

  constructor() {
    this.pdfService = new PDFService()
    this.ocrService = new OCRService()
    this.aiService = new AIService()
    this.queueService = new QueueService()
    this.dataDir = path.join(process.cwd(), 'data', 'workflows')
  }

  /**
   * Initialize the workflow service
   */
  async initialize(): Promise<void> {
    try {
      // Create data directory
      await fs.mkdir(this.dataDir, { recursive: true })
      
      // Load existing workflows
      await this.loadWorkflows()
      
      console.log('✅ Workflow service initialized')
    } catch (error) {
      console.error('Failed to initialize workflow service:', error)
      throw error
    }
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Workflow> {
    const workflow: Workflow = {
      ...workflowData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }

    this.workflows.set(workflow.id, workflow)
    await this.saveWorkflow(workflow)

    return workflow
  }

  /**
   * Update an existing workflow
   */
  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflows.get(id)
    if (!workflow) {
      throw new Error(`Workflow not found: ${id}`)
    }

    const updatedWorkflow: Workflow = {
      ...workflow,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
      version: workflow.version + 1
    }

    this.workflows.set(id, updatedWorkflow)
    await this.saveWorkflow(updatedWorkflow)

    return updatedWorkflow
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id)
  }

  /**
   * List all workflows
   */
  listWorkflows(userId?: string, organizationId?: string): Workflow[] {
    const workflows = Array.from(this.workflows.values())
    
    return workflows.filter(workflow => {
      if (userId && workflow.userId !== userId) return false
      if (organizationId && workflow.organizationId !== organizationId) return false
      return true
    })
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    const workflow = this.workflows.get(id)
    if (!workflow) {
      throw new Error(`Workflow not found: ${id}`)
    }

    this.workflows.delete(id)
    
    // Delete workflow file
    const filePath = path.join(this.dataDir, `${id}.json`)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.warn(`Failed to delete workflow file: ${filePath}`, error)
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId: string, inputFiles: string[], config: Record<string, any> = {}): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    if (!workflow.isActive) {
      throw new Error(`Workflow is not active: ${workflowId}`)
    }

    const execution: WorkflowExecution = {
      id: this.generateId(),
      workflowId,
      status: 'pending',
      startedAt: new Date(),
      inputFiles,
      outputFiles: [],
      logs: [],
      progress: 0
    }

    this.executions.set(execution.id, execution)

    // Start execution asynchronously
    this.runWorkflowExecution(execution, workflow, config).catch(error => {
      console.error(`Workflow execution failed: ${execution.id}`, error)
      execution.status = 'failed'
      execution.error = error.message
      execution.completedAt = new Date()
    })

    return execution
  }

  /**
   * Get execution status
   */
  getExecution(id: string): WorkflowExecution | undefined {
    return this.executions.get(id)
  }

  /**
   * List executions for a workflow
   */
  listExecutions(workflowId?: string): WorkflowExecution[] {
    const executions = Array.from(this.executions.values())
    
    if (workflowId) {
      return executions.filter(execution => execution.workflowId === workflowId)
    }
    
    return executions
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(id: string): Promise<void> {
    const execution = this.executions.get(id)
    if (!execution) {
      throw new Error(`Execution not found: ${id}`)
    }

    if (execution.status === 'running') {
      execution.status = 'cancelled'
      execution.completedAt = new Date()
      this.addLog(execution, 'info', 'Execution cancelled by user')
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Load workflows from disk
   */
  private async loadWorkflows(): Promise<void> {
    try {
      // Check if data directory exists
      try {
        await fs.access(this.dataDir)
      } catch {
        console.log('📁 Data directory does not exist, creating...')
        await fs.mkdir(this.dataDir, { recursive: true })
        console.log('✅ Data directory created')
        return // No workflows to load
      }

      const files = await fs.readdir(this.dataDir)
      const workflowFiles = files.filter(file => file.endsWith('.json'))

      if (workflowFiles.length === 0) {
        console.log('📋 No workflow files found, starting with empty collection')
        return
      }

      for (const file of workflowFiles) {
        try {
          const filePath = path.join(this.dataDir, file)
          const content = await fs.readFile(filePath, 'utf-8')
          const workflow = JSON.parse(content) as Workflow

          // Convert date strings back to Date objects
          workflow.createdAt = new Date(workflow.createdAt)
          workflow.updatedAt = new Date(workflow.updatedAt)

          this.workflows.set(workflow.id, workflow)
        } catch (error) {
          console.warn(`⚠️ Failed to load workflow file: ${file}`, error)
        }
      }

      console.log(`✅ Loaded ${this.workflows.size} workflows`)
    } catch (error) {
      console.warn('⚠️ Error loading workflows, starting with empty collection:', error)
    }
  }

  /**
   * Save workflow to disk
   */
  private async saveWorkflow(workflow: Workflow): Promise<void> {
    const filePath = path.join(this.dataDir, `${workflow.id}.json`)
    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2))
  }

  /**
   * Add log entry to execution
   */
  private addLog(execution: WorkflowExecution, level: 'info' | 'warn' | 'error', message: string, nodeId?: string, data?: any): void {
    execution.logs.push({
      timestamp: new Date(),
      level,
      message,
      nodeId,
      data
    })
  }

  /**
   * Run workflow execution
   */
  private async runWorkflowExecution(execution: WorkflowExecution, workflow: Workflow, config: Record<string, any>): Promise<void> {
    try {
      execution.status = 'running'
      this.addLog(execution, 'info', `Starting workflow execution: ${workflow.name}`)

      // Create output directory
      const outputDir = path.join(process.cwd(), 'uploads', 'workflow-output', execution.id)
      await fs.mkdir(outputDir, { recursive: true })

      // Sort nodes by execution order (topological sort)
      const sortedNodes = this.topologicalSort(workflow.nodes, workflow.edges)
      const nodeResults = new Map<string, any>()

      let completedNodes = 0
      const totalNodes = sortedNodes.length

      for (const node of sortedNodes) {
        try {
          execution.progress = Math.round((completedNodes / totalNodes) * 100)

          this.addLog(execution, 'info', `Processing node: ${node.label}`, node.id)

          // Update node status
          node.status = 'running'
          node.progress = 0

          // Execute node operation
          const result = await this.executeNode(node, nodeResults, execution.inputFiles, outputDir, config)
          nodeResults.set(node.id, result)

          // Update node status
          node.status = 'completed'
          node.progress = 100
          completedNodes++

          this.addLog(execution, 'info', `Completed node: ${node.label}`, node.id, { result })

        } catch (error) {
          node.status = 'error'
          this.addLog(execution, 'error', `Node failed: ${node.label} - ${error.message}`, node.id)
          throw error
        }
      }

      // Collect output files
      const outputFiles = await this.collectOutputFiles(outputDir)
      execution.outputFiles = outputFiles

      execution.status = 'completed'
      execution.progress = 100
      execution.completedAt = new Date()

      this.addLog(execution, 'info', `Workflow completed successfully. Generated ${outputFiles.length} output files.`)

    } catch (error) {
      execution.status = 'failed'
      execution.error = error.message
      execution.completedAt = new Date()
      this.addLog(execution, 'error', `Workflow execution failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Execute a single workflow node
   */
  private async executeNode(
    node: WorkflowNode,
    nodeResults: Map<string, any>,
    inputFiles: string[],
    outputDir: string,
    config: Record<string, any>
  ): Promise<any> {
    const nodeConfig = { ...node.config, ...config }

    switch (node.operation) {
      case 'pdf-split':
        return await this.executePDFSplit(node, inputFiles, outputDir, nodeConfig)

      case 'pdf-merge':
        return await this.executePDFMerge(node, inputFiles, outputDir, nodeConfig)

      case 'pdf-extract-pages':
        return await this.executePDFExtractPages(node, inputFiles, outputDir, nodeConfig)

      case 'ocr-extract':
        return await this.executeOCRExtract(node, inputFiles, outputDir, nodeConfig)

      case 'ai-classify':
        return await this.executeAIClassify(node, inputFiles, nodeConfig)

      case 'ai-extract':
        return await this.executeAIExtract(node, inputFiles, nodeConfig)

      case 'ai-summarize':
        return await this.executeAISummarize(node, inputFiles, nodeConfig)

      case 'condition':
        return await this.executeCondition(node, nodeResults, nodeConfig)

      case 'file-filter':
        return await this.executeFileFilter(node, inputFiles, nodeConfig)

      default:
        throw new Error(`Unknown operation: ${node.operation}`)
    }
  }

  /**
   * Execute PDF split operation
   */
  private async executePDFSplit(node: WorkflowNode, inputFiles: string[], outputDir: string, config: any): Promise<string[]> {
    const results: string[] = []

    for (const inputFile of inputFiles) {
      if (!inputFile.toLowerCase().endsWith('.pdf')) continue

      const ranges = config.ranges || [{ start: 1, end: -1, name: 'split' }]
      const outputFiles = await this.pdfService.splitPDF(inputFile, {
        ranges,
        outputDir
      })

      results.push(...outputFiles)
    }

    return results
  }

  /**
   * Execute PDF merge operation
   */
  private async executePDFMerge(node: WorkflowNode, inputFiles: string[], outputDir: string, config: any): Promise<string[]> {
    const pdfFiles = inputFiles.filter(file => file.toLowerCase().endsWith('.pdf'))

    if (pdfFiles.length < 2) {
      throw new Error('PDF merge requires at least 2 PDF files')
    }

    const outputName = config.outputName || 'merged'
    const outputPath = await this.pdfService.mergePDFs(pdfFiles, {
      outputName,
      outputDir,
      preserveBookmarks: config.preserveBookmarks || false,
      addPageNumbers: config.addPageNumbers || false
    })

    return [outputPath]
  }

  /**
   * Execute PDF page extraction
   */
  private async executePDFExtractPages(node: WorkflowNode, inputFiles: string[], outputDir: string, config: any): Promise<string[]> {
    const results: string[] = []

    for (const inputFile of inputFiles) {
      if (!inputFile.toLowerCase().endsWith('.pdf')) continue

      const pages = config.pages || [1]
      const outputName = config.outputName || `extracted_${path.basename(inputFile, '.pdf')}`
      const outputPath = path.join(outputDir, `${outputName}.pdf`)

      const result = await this.pdfService.extractPages(inputFile, pages, outputPath)
      results.push(result)
    }

    return results
  }

  /**
   * Execute OCR text extraction
   */
  private async executeOCRExtract(node: WorkflowNode, inputFiles: string[], outputDir: string, config: any): Promise<any[]> {
    const results: any[] = []

    for (const inputFile of inputFiles) {
      let ocrResult: any

      if (inputFile.toLowerCase().endsWith('.pdf')) {
        ocrResult = await this.ocrService.extractTextFromPDF(inputFile, {
          pages: config.pages,
          density: config.density || 200
        })
      } else {
        ocrResult = await this.ocrService.extractTextFromImage(inputFile)
      }

      // Save extracted text to file
      const textFileName = `${path.basename(inputFile, path.extname(inputFile))}_extracted.txt`
      const textFilePath = path.join(outputDir, textFileName)
      await fs.writeFile(textFilePath, ocrResult.fullText || ocrResult.text)

      results.push({
        inputFile,
        textFile: textFilePath,
        ocrResult
      })
    }

    return results
  }

  /**
   * Execute AI classification
   */
  private async executeAIClassify(node: WorkflowNode, inputFiles: string[], config: any): Promise<any[]> {
    const results: any[] = []

    for (const inputFile of inputFiles) {
      if (!inputFile.toLowerCase().endsWith('.pdf')) continue

      const classification = await this.aiService.classifyDocument(inputFile)
      results.push({
        inputFile,
        classification
      })
    }

    return results
  }

  /**
   * Execute AI data extraction
   */
  private async executeAIExtract(node: WorkflowNode, inputFiles: string[], config: any): Promise<any[]> {
    const results: any[] = []

    for (const inputFile of inputFiles) {
      if (!inputFile.toLowerCase().endsWith('.pdf')) continue

      const extraction = await this.aiService.extractIntelligentData(inputFile)
      results.push({
        inputFile,
        extraction
      })
    }

    return results
  }

  /**
   * Execute AI summarization
   */
  private async executeAISummarize(node: WorkflowNode, inputFiles: string[], config: any): Promise<any[]> {
    const results: any[] = []

    for (const inputFile of inputFiles) {
      if (!inputFile.toLowerCase().endsWith('.pdf')) continue

      const summary = await this.aiService.summarizeDocument(inputFile)
      results.push({
        inputFile,
        summary
      })
    }

    return results
  }

  /**
   * Execute condition node
   */
  private async executeCondition(node: WorkflowNode, nodeResults: Map<string, any>, config: any): Promise<boolean> {
    const condition = config.condition || 'true'

    // Simple condition evaluation (in production, use a proper expression evaluator)
    try {
      // Replace node references with actual values
      let evaluatedCondition = condition
      for (const [nodeId, result] of nodeResults.entries()) {
        evaluatedCondition = evaluatedCondition.replace(
          new RegExp(`\\$\\{${nodeId}\\}`, 'g'),
          JSON.stringify(result)
        )
      }

      // Basic condition evaluation (extend as needed)
      return eval(evaluatedCondition)
    } catch (error) {
      console.warn('Condition evaluation failed, defaulting to true:', error)
      return true
    }
  }

  /**
   * Execute file filter
   */
  private async executeFileFilter(node: WorkflowNode, inputFiles: string[], config: any): Promise<string[]> {
    const filters = config.filters || []

    return inputFiles.filter(file => {
      for (const filter of filters) {
        switch (filter.type) {
          case 'extension':
            if (!file.toLowerCase().endsWith(filter.value.toLowerCase())) {
              return false
            }
            break
          case 'size':
            // Would need to check file size
            break
          case 'name':
            if (!path.basename(file).includes(filter.value)) {
              return false
            }
            break
        }
      }
      return true
    })
  }

  /**
   * Topological sort for workflow nodes
   */
  private topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
    const nodeMap = new Map(nodes.map(node => [node.id, node]))
    const inDegree = new Map<string, number>()
    const adjList = new Map<string, string[]>()

    // Initialize
    for (const node of nodes) {
      inDegree.set(node.id, 0)
      adjList.set(node.id, [])
    }

    // Build adjacency list and calculate in-degrees
    for (const edge of edges) {
      adjList.get(edge.source)?.push(edge.target)
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
    }

    // Kahn's algorithm
    const queue: string[] = []
    const result: WorkflowNode[] = []

    // Find nodes with no incoming edges
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId)
      }
    }

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      const node = nodeMap.get(nodeId)!
      result.push(node)

      // Process neighbors
      for (const neighborId of adjList.get(nodeId) || []) {
        const newDegree = (inDegree.get(neighborId) || 0) - 1
        inDegree.set(neighborId, newDegree)

        if (newDegree === 0) {
          queue.push(neighborId)
        }
      }
    }

    // Check for cycles
    if (result.length !== nodes.length) {
      throw new Error('Workflow contains cycles')
    }

    return result
  }

  /**
   * Collect output files from directory
   */
  private async collectOutputFiles(outputDir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(outputDir)
      return files.map(file => path.join(outputDir, file))
    } catch (error) {
      return []
    }
  }

  /**
   * Create default workflow templates
   */
  async createDefaultTemplates(): Promise<void> {
    const templates = [
      {
        name: 'PDF Split and OCR',
        description: 'Split PDF into pages and extract text using OCR',
        nodes: [
          {
            id: 'input',
            type: 'input' as const,
            label: 'Input PDF',
            operation: 'file-input',
            config: { acceptedTypes: ['pdf'] },
            position: { x: 100, y: 100 },
            status: 'idle' as const,
            progress: 0
          },
          {
            id: 'split',
            type: 'process' as const,
            label: 'Split PDF',
            operation: 'pdf-split',
            config: { ranges: [{ start: 1, end: -1, name: 'page' }] },
            position: { x: 300, y: 100 },
            status: 'idle' as const,
            progress: 0
          },
          {
            id: 'ocr',
            type: 'process' as const,
            label: 'Extract Text',
            operation: 'ocr-extract',
            config: { density: 200 },
            position: { x: 500, y: 100 },
            status: 'idle' as const,
            progress: 0
          }
        ],
        edges: [
          { id: 'e1', source: 'input', target: 'split' },
          { id: 'e2', source: 'split', target: 'ocr' }
        ],
        triggers: [
          {
            id: 't1',
            type: 'manual' as const,
            config: {},
            isActive: true
          }
        ],
        isActive: true
      }
    ]

    for (const template of templates) {
      try {
        await this.createWorkflow(template)
        console.log(`✅ Created workflow template: ${template.name}`)
      } catch (error) {
        console.warn(`Failed to create template: ${template.name}`, error)
      }
    }
  }
}
