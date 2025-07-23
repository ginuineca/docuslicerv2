import { EventEmitter } from 'events'
import { Worker } from 'worker_threads'
import path from 'path'
import fs from 'fs/promises'
import { performance } from 'perf_hooks'

/**
 * Optimized workflow execution engine with parallel processing, caching, and performance monitoring
 */

export interface OptimizedWorkflowNode {
  id: string
  type: 'input' | 'process' | 'output' | 'condition' | 'parallel' | 'merge'
  operation: string
  label: string
  config: Record<string, any>
  position: { x: number; y: number }
  status: 'idle' | 'running' | 'completed' | 'error' | 'skipped'
  progress: number
  executionTime?: number
  memoryUsage?: number
  dependencies: string[]
  outputs: string[]
  canRunInParallel: boolean
  priority: number
  retryCount: number
  maxRetries: number
}

export interface WorkflowExecutionContext {
  id: string
  workflowId: string
  inputFiles: string[]
  outputDir: string
  config: Record<string, any>
  nodeResults: Map<string, any>
  fileCache: Map<string, Buffer>
  startTime: number
  metrics: ExecutionMetrics
  parallelWorkers: Worker[]
  maxParallelNodes: number
}

export interface ExecutionMetrics {
  totalNodes: number
  completedNodes: number
  failedNodes: number
  skippedNodes: number
  parallelExecutions: number
  totalExecutionTime: number
  memoryPeak: number
  cacheHits: number
  cacheMisses: number
  fileOperations: number
}

export class OptimizedWorkflowEngine extends EventEmitter {
  private executionContexts = new Map<string, WorkflowExecutionContext>()
  private nodeExecutors = new Map<string, Function>()
  private performanceCache = new Map<string, any>()
  private maxConcurrentExecutions = 5
  private workerPool: Worker[] = []

  constructor() {
    super()
    this.initializeNodeExecutors()
    this.initializeWorkerPool()
  }

  /**
   * Execute workflow with optimized performance
   */
  async executeWorkflow(
    workflowId: string,
    nodes: OptimizedWorkflowNode[],
    edges: Array<{ source: string; target: string }>,
    inputFiles: string[],
    config: Record<string, any> = {}
  ): Promise<string> {
    const executionId = this.generateExecutionId()
    const startTime = performance.now()

    // Create execution context
    const context: WorkflowExecutionContext = {
      id: executionId,
      workflowId,
      inputFiles,
      outputDir: path.join(process.cwd(), 'uploads', 'workflow-output', executionId),
      config,
      nodeResults: new Map(),
      fileCache: new Map(),
      startTime,
      metrics: {
        totalNodes: nodes.length,
        completedNodes: 0,
        failedNodes: 0,
        skippedNodes: 0,
        parallelExecutions: 0,
        totalExecutionTime: 0,
        memoryPeak: 0,
        cacheHits: 0,
        cacheMisses: 0,
        fileOperations: 0
      },
      parallelWorkers: [],
      maxParallelNodes: Math.min(4, Math.ceil(nodes.length / 3))
    }

    this.executionContexts.set(executionId, context)

    try {
      // Create output directory
      await fs.mkdir(context.outputDir, { recursive: true })

      // Optimize workflow graph
      const optimizedNodes = await this.optimizeWorkflowGraph(nodes, edges)

      // Execute workflow with parallel processing
      await this.executeOptimizedWorkflow(context, optimizedNodes, edges)

      // Calculate final metrics
      context.metrics.totalExecutionTime = performance.now() - startTime

      this.emit('workflowCompleted', {
        executionId,
        workflowId,
        metrics: context.metrics,
        outputFiles: await this.getOutputFiles(context.outputDir)
      })

      return executionId

    } catch (error) {
      this.emit('workflowFailed', {
        executionId,
        workflowId,
        error: error.message,
        metrics: context.metrics
      })
      throw error
    } finally {
      // Cleanup
      this.cleanupExecution(executionId)
    }
  }

  /**
   * Optimize workflow graph for parallel execution
   */
  private async optimizeWorkflowGraph(
    nodes: OptimizedWorkflowNode[],
    edges: Array<{ source: string; target: string }>
  ): Promise<OptimizedWorkflowNode[]> {
    // Build dependency graph
    const dependencyMap = new Map<string, string[]>()
    const reverseDependencyMap = new Map<string, string[]>()

    nodes.forEach(node => {
      dependencyMap.set(node.id, [])
      reverseDependencyMap.set(node.id, [])
    })

    edges.forEach(edge => {
      dependencyMap.get(edge.target)?.push(edge.source)
      reverseDependencyMap.get(edge.source)?.push(edge.target)
    })

    // Analyze nodes for parallel execution potential
    const optimizedNodes = nodes.map(node => {
      const dependencies = dependencyMap.get(node.id) || []
      const outputs = reverseDependencyMap.get(node.id) || []

      return {
        ...node,
        dependencies,
        outputs,
        canRunInParallel: this.canNodeRunInParallel(node, dependencies),
        priority: this.calculateNodePriority(node, dependencies, outputs),
        maxRetries: node.maxRetries || 3,
        retryCount: 0
      }
    })

    // Sort by priority for optimal execution order
    return optimizedNodes.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Execute optimized workflow with parallel processing
   */
  private async executeOptimizedWorkflow(
    context: WorkflowExecutionContext,
    nodes: OptimizedWorkflowNode[],
    edges: Array<{ source: string; target: string }>
  ): Promise<void> {
    const executionQueue = [...nodes]
    const runningNodes = new Set<string>()
    const completedNodes = new Set<string>()

    while (executionQueue.length > 0 || runningNodes.size > 0) {
      // Find nodes ready for execution
      const readyNodes = executionQueue.filter(node => 
        !runningNodes.has(node.id) &&
        node.dependencies.every(dep => completedNodes.has(dep))
      )

      // Execute nodes in parallel (up to maxParallelNodes)
      const nodesToExecute = readyNodes
        .slice(0, context.maxParallelNodes - runningNodes.size)
        .filter(node => runningNodes.size < context.maxParallelNodes)

      // Start parallel executions
      const executionPromises = nodesToExecute.map(async node => {
        runningNodes.add(node.id)
        
        try {
          await this.executeNodeOptimized(context, node)
          completedNodes.add(node.id)
          context.metrics.completedNodes++
          
          // Remove from queue
          const index = executionQueue.findIndex(n => n.id === node.id)
          if (index !== -1) {
            executionQueue.splice(index, 1)
          }
        } catch (error) {
          // Handle retry logic
          if (node.retryCount < node.maxRetries) {
            node.retryCount++
            console.warn(`Retrying node ${node.id}, attempt ${node.retryCount}`)
          } else {
            node.status = 'error'
            context.metrics.failedNodes++
            throw error
          }
        } finally {
          runningNodes.delete(node.id)
        }
      })

      // Wait for at least one execution to complete
      if (executionPromises.length > 0) {
        await Promise.race(executionPromises)
        context.metrics.parallelExecutions++
      } else {
        // No nodes ready, wait a bit
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Update progress
      const progress = Math.round((context.metrics.completedNodes / context.metrics.totalNodes) * 100)
      this.emit('progressUpdate', {
        executionId: context.id,
        progress,
        completedNodes: context.metrics.completedNodes,
        totalNodes: context.metrics.totalNodes
      })
    }
  }

  /**
   * Execute individual node with optimization
   */
  private async executeNodeOptimized(
    context: WorkflowExecutionContext,
    node: OptimizedWorkflowNode
  ): Promise<any> {
    const startTime = performance.now()
    const startMemory = process.memoryUsage().heapUsed

    try {
      node.status = 'running'
      node.progress = 0

      // Check cache first
      const cacheKey = this.generateCacheKey(node, context.inputFiles)
      if (this.performanceCache.has(cacheKey)) {
        context.metrics.cacheHits++
        const cachedResult = this.performanceCache.get(cacheKey)
        node.status = 'completed'
        node.progress = 100
        return cachedResult
      }

      context.metrics.cacheMisses++

      // Get node executor
      const executor = this.nodeExecutors.get(node.operation)
      if (!executor) {
        throw new Error(`No executor found for operation: ${node.operation}`)
      }

      // Prepare input data
      const inputData = await this.prepareNodeInput(context, node)

      // Execute node
      let result
      if (node.canRunInParallel && this.workerPool.length > 0) {
        result = await this.executeInWorker(node, inputData, context)
      } else {
        result = await executor(node, inputData, context)
      }

      // Cache result if beneficial
      if (this.shouldCacheResult(node, result)) {
        this.performanceCache.set(cacheKey, result)
      }

      // Update metrics
      node.executionTime = performance.now() - startTime
      node.memoryUsage = process.memoryUsage().heapUsed - startMemory
      context.metrics.memoryPeak = Math.max(context.metrics.memoryPeak, process.memoryUsage().heapUsed)

      node.status = 'completed'
      node.progress = 100

      // Store result
      context.nodeResults.set(node.id, result)

      this.emit('nodeCompleted', {
        executionId: context.id,
        nodeId: node.id,
        executionTime: node.executionTime,
        memoryUsage: node.memoryUsage
      })

      return result

    } catch (error) {
      node.status = 'error'
      node.executionTime = performance.now() - startTime
      
      this.emit('nodeError', {
        executionId: context.id,
        nodeId: node.id,
        error: error.message,
        executionTime: node.executionTime
      })

      throw error
    }
  }

  /**
   * Initialize node executors
   */
  private initializeNodeExecutors(): void {
    this.nodeExecutors.set('pdf-split', this.executePDFSplit.bind(this))
    this.nodeExecutors.set('pdf-merge', this.executePDFMerge.bind(this))
    this.nodeExecutors.set('pdf-extract-pages', this.executePDFExtractPages.bind(this))
    this.nodeExecutors.set('ocr-extract', this.executeOCRExtract.bind(this))
    this.nodeExecutors.set('ai-classify', this.executeAIClassify.bind(this))
    this.nodeExecutors.set('ai-extract', this.executeAIExtract.bind(this))
    this.nodeExecutors.set('ai-summarize', this.executeAISummarize.bind(this))
    this.nodeExecutors.set('condition', this.executeCondition.bind(this))
    this.nodeExecutors.set('file-input', this.executeFileInput.bind(this))
    this.nodeExecutors.set('file-output', this.executeFileOutput.bind(this))
  }

  /**
   * Initialize worker pool for parallel execution
   */
  private initializeWorkerPool(): void {
    const workerCount = Math.min(4, require('os').cpus().length)
    
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(path.join(__dirname, 'workflowWorker.js'))
      this.workerPool.push(worker)
    }
  }

  /**
   * Determine if node can run in parallel
   */
  private canNodeRunInParallel(node: OptimizedWorkflowNode, dependencies: string[]): boolean {
    // Nodes with no dependencies or only input dependencies can run in parallel
    const parallelOperations = ['pdf-split', 'ocr-extract', 'ai-classify', 'ai-extract']
    return parallelOperations.includes(node.operation) && dependencies.length <= 1
  }

  /**
   * Calculate node execution priority
   */
  private calculateNodePriority(
    node: OptimizedWorkflowNode, 
    dependencies: string[], 
    outputs: string[]
  ): number {
    let priority = 0
    
    // Higher priority for nodes with more outputs (critical path)
    priority += outputs.length * 10
    
    // Lower priority for nodes with more dependencies
    priority -= dependencies.length * 5
    
    // Operation-specific priorities
    const operationPriorities = {
      'file-input': 100,
      'pdf-split': 80,
      'ocr-extract': 70,
      'ai-classify': 60,
      'pdf-merge': 50,
      'file-output': 10
    }
    
    priority += operationPriorities[node.operation as keyof typeof operationPriorities] || 30
    
    return priority
  }

  /**
   * Generate cache key for node execution
   */
  private generateCacheKey(node: OptimizedWorkflowNode, inputFiles: string[]): string {
    const configHash = JSON.stringify(node.config)
    const filesHash = inputFiles.join('|')
    return `${node.operation}:${configHash}:${filesHash}`
  }

  /**
   * Determine if result should be cached
   */
  private shouldCacheResult(node: OptimizedWorkflowNode, result: any): boolean {
    // Cache results for expensive operations
    const cacheableOperations = ['ocr-extract', 'ai-classify', 'ai-extract', 'ai-summarize']
    return cacheableOperations.includes(node.operation) && result && typeof result === 'object'
  }

  /**
   * Prepare input data for node execution
   */
  private async prepareNodeInput(
    context: WorkflowExecutionContext, 
    node: OptimizedWorkflowNode
  ): Promise<any> {
    const inputData: any = {
      files: [],
      config: node.config,
      outputDir: context.outputDir
    }

    // Get input files from dependencies
    if (node.dependencies.length === 0) {
      // Root node - use original input files
      inputData.files = context.inputFiles
    } else {
      // Get files from dependency results
      for (const depId of node.dependencies) {
        const depResult = context.nodeResults.get(depId)
        if (depResult && depResult.outputFiles) {
          inputData.files.push(...depResult.outputFiles)
        }
      }
    }

    return inputData
  }

  /**
   * Execute node in worker thread
   */
  private async executeInWorker(
    node: OptimizedWorkflowNode,
    inputData: any,
    context: WorkflowExecutionContext
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const worker = this.workerPool[0] // Simple round-robin for now
      
      const timeout = setTimeout(() => {
        worker.terminate()
        reject(new Error(`Worker timeout for node ${node.id}`))
      }, 300000) // 5 minute timeout

      worker.once('message', (result) => {
        clearTimeout(timeout)
        if (result.error) {
          reject(new Error(result.error))
        } else {
          resolve(result.data)
        }
      })

      worker.once('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })

      worker.postMessage({
        operation: node.operation,
        config: node.config,
        inputData,
        nodeId: node.id
      })
    })
  }

  // Node executor implementations (simplified for brevity)
  private async executePDFSplit(node: OptimizedWorkflowNode, inputData: any, context: WorkflowExecutionContext): Promise<any> {
    // Implementation would use pdf-lib or similar
    return { outputFiles: [`${context.outputDir}/split-${node.id}.pdf`] }
  }

  private async executePDFMerge(node: OptimizedWorkflowNode, inputData: any, context: WorkflowExecutionContext): Promise<any> {
    // Implementation would merge PDFs
    return { outputFiles: [`${context.outputDir}/merged-${node.id}.pdf`] }
  }

  private async executePDFExtractPages(node: OptimizedWorkflowNode, inputData: any, context: WorkflowExecutionContext): Promise<any> {
    // Implementation would extract specific pages
    return { outputFiles: [`${context.outputDir}/extracted-${node.id}.pdf`] }
  }

  private async executeOCRExtract(node: OptimizedWorkflowNode, inputData: any, context: WorkflowExecutionContext): Promise<any> {
    // Implementation would use Tesseract.js
    return { text: 'Extracted text content', confidence: 0.95 }
  }

  private async executeAIClassify(node: OptimizedWorkflowNode, inputData: any, context: WorkflowExecutionContext): Promise<any> {
    // Implementation would use AI service
    return { classification: 'invoice', confidence: 0.92 }
  }

  private async executeAIExtract(node: OptimizedWorkflowNode, inputData: any, context: WorkflowExecutionContext): Promise<any> {
    // Implementation would extract structured data
    return { extractedData: { amount: '$1,234.56', date: '2024-01-15' } }
  }

  private async executeAISummarize(node: OptimizedWorkflowNode, inputData: any, context: WorkflowExecutionContext): Promise<any> {
    // Implementation would summarize content
    return { summary: 'Document summary', keyPoints: ['Point 1', 'Point 2'] }
  }

  private async executeCondition(node: OptimizedWorkflowNode, inputData: any, context: WorkflowExecutionContext): Promise<any> {
    // Implementation would evaluate conditions
    return { conditionMet: true, branch: 'success' }
  }

  private async executeFileInput(node: OptimizedWorkflowNode, inputData: any, context: WorkflowExecutionContext): Promise<any> {
    return { outputFiles: inputData.files }
  }

  private async executeFileOutput(node: OptimizedWorkflowNode, inputData: any, context: WorkflowExecutionContext): Promise<any> {
    return { outputFiles: inputData.files }
  }

  /**
   * Get output files from directory
   */
  private async getOutputFiles(outputDir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(outputDir)
      return files.map(file => path.join(outputDir, file))
    } catch (error) {
      return []
    }
  }

  /**
   * Cleanup execution context
   */
  private cleanupExecution(executionId: string): void {
    const context = this.executionContexts.get(executionId)
    if (context) {
      // Cleanup workers
      context.parallelWorkers.forEach(worker => worker.terminate())
      
      // Clear file cache
      context.fileCache.clear()
      
      // Remove context
      this.executionContexts.delete(executionId)
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get execution metrics
   */
  getExecutionMetrics(executionId: string): ExecutionMetrics | null {
    const context = this.executionContexts.get(executionId)
    return context ? context.metrics : null
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    cacheSize: number
    cacheHitRate: number
    activeExecutions: number
    workerPoolSize: number
  } {
    return {
      cacheSize: this.performanceCache.size,
      cacheHitRate: 0.85, // Would calculate from actual metrics
      activeExecutions: this.executionContexts.size,
      workerPoolSize: this.workerPool.length
    }
  }
}
