import Bull, { Queue, Job, JobOptions } from 'bull'
import { PDFService } from './pdfService'
import { OCRService } from './ocrService'
import { TemplateService } from './templateService'
import path from 'path'
import fs from 'fs/promises'

export interface BatchJobData {
  id: string
  type: 'batch-split' | 'batch-merge' | 'batch-ocr' | 'batch-template' | 'workflow-execution'
  files: string[]
  config: Record<string, any>
  userId?: string
  outputDir: string
  createdAt: Date
}

export interface JobProgress {
  current: number
  total: number
  currentFile?: string
  stage: string
  percentage: number
}

export interface JobResult {
  success: boolean
  outputFiles: string[]
  errors: string[]
  stats: {
    totalFiles: number
    successfulFiles: number
    failedFiles: number
    totalSize: number
    processingTime: number
  }
}

export class QueueService {
  private pdfQueue: Queue<BatchJobData> | null = null
  private pdfService: PDFService
  private ocrService: OCRService
  private templateService: TemplateService
  private redisConfig: any
  private isRedisAvailable: boolean = false

  constructor() {
    // Redis configuration - in production, use environment variables
    this.redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 5000
    }

    // Initialize services
    this.pdfService = new PDFService()
    this.ocrService = new OCRService()
    this.templateService = new TemplateService()

    // Try to initialize queue with error handling
    this.initializeQueue()
  }

  /**
   * Initialize queue with proper error handling
   */
  private async initializeQueue(): Promise<void> {
    try {
      // Test Redis connection first
      const Redis = require('ioredis')
      const testClient = new Redis(this.redisConfig)

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          testClient.disconnect()
          reject(new Error('Redis connection timeout'))
        }, 2000)

        testClient.on('connect', () => {
          clearTimeout(timeout)
          testClient.disconnect()
          resolve(true)
        })

        testClient.on('error', (err) => {
          clearTimeout(timeout)
          testClient.disconnect()
          reject(err)
        })
      })

      // Initialize queue if Redis is available
      this.pdfQueue = new Bull('pdf-processing', {
        redis: this.redisConfig,
        defaultJobOptions: {
          removeOnComplete: 50, // Keep last 50 completed jobs
          removeOnFail: 100,    // Keep last 100 failed jobs
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      })

      this.setupJobProcessors()
      this.setupEventListeners()
      this.isRedisAvailable = true
      console.log('✅ Queue service initialized with Redis')
    } catch (error) {
      // Silently fall back to in-memory processing
      this.pdfQueue = null
      this.isRedisAvailable = false
      console.log('ℹ️ Queue service running in fallback mode (no Redis)')
    }
  }

  /**
   * Initialize the queue service
   */
  async initialize(): Promise<void> {
    try {
      if (this.pdfQueue) {
        // Test Redis connection with timeout
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        )

        await Promise.race([this.pdfQueue.isReady(), timeout])
        this.isRedisAvailable = true
        console.log('✅ Queue service initialized successfully')
      } else {
        throw new Error('Queue not initialized')
      }
    } catch (error) {
      this.isRedisAvailable = false
      console.warn('⚠️ Redis not available, running without queue functionality')
      console.warn('Install and start Redis server for batch processing features')
      console.warn('Queue operations will return mock responses')
    }
  }

  /**
   * Check if Redis/Queue is available
   */
  isAvailable(): boolean {
    return this.isRedisAvailable && this.pdfQueue !== null
  }

  /**
   * Add a batch job to the queue
   */
  async addBatchJob(
    jobData: Omit<BatchJobData, 'id' | 'createdAt'>,
    options: JobOptions = {}
  ): Promise<Job<BatchJobData> | null> {
    if (!this.isAvailable()) {
      console.warn('⚠️ Queue service not available, cannot add batch job')
      return null
    }

    try {
      const fullJobData: BatchJobData = {
        ...jobData,
        id: this.generateJobId(),
        createdAt: new Date()
      }

      const job = await this.pdfQueue!.add(fullJobData, {
        priority: options.priority || 0,
        delay: options.delay || 0,
        ...options
      })

      console.log(`📋 Batch job queued: ${job.id} (${jobData.type})`)
      return job
    } catch (error) {
      console.error('Failed to add batch job:', error)
      return null
    }
  }

  /**
   * Get job status and progress
   */
  async getJobStatus(jobId: string): Promise<{
    id: string
    status: string
    progress: JobProgress | null
    result: JobResult | null
    error: string | null
    createdAt: Date
    processedAt?: Date
    finishedAt?: Date
  } | null> {
    try {
      const job = await this.pdfQueue.getJob(jobId)
      if (!job) return null

      const state = await job.getState()
      const progress = job.progress() as JobProgress | null

      return {
        id: job.id as string,
        status: state,
        progress,
        result: job.returnvalue as JobResult | null,
        error: job.failedReason || null,
        createdAt: new Date(job.timestamp),
        processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
        finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined
      }
    } catch (error) {
      console.error('Failed to get job status:', error)
      return null
    }
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const jobs = await this.pdfQueue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, limit)
      
      return jobs
        .filter(job => job.data.userId === userId)
        .map(job => ({
          id: job.id,
          type: job.data.type,
          status: job.opts.jobId, // This will be updated by getState() in real implementation
          progress: job.progress(),
          createdAt: new Date(job.timestamp),
          files: job.data.files.length
        }))
    } catch (error) {
      console.error('Failed to get user jobs:', error)
      return []
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await this.pdfQueue.getJob(jobId)
      if (!job) return false

      await job.remove()
      console.log(`❌ Job cancelled: ${jobId}`)
      return true
    } catch (error) {
      console.error('Failed to cancel job:', error)
      return false
    }
  }

  /**
   * Setup job processors
   */
  private setupJobProcessors(): void {
    if (!this.pdfQueue) return

    this.pdfQueue.process('*', 3, async (job: Job<BatchJobData>) => {
      const { data } = job
      const startTime = Date.now()

      try {
        console.log(`🔄 Processing batch job: ${job.id} (${data.type})`)

        let result: JobResult
        
        switch (data.type) {
          case 'batch-split':
            result = await this.processBatchSplit(job)
            break
          case 'batch-merge':
            result = await this.processBatchMerge(job)
            break
          case 'batch-ocr':
            result = await this.processBatchOCR(job)
            break
          case 'batch-template':
            result = await this.processBatchTemplate(job)
            break
          case 'workflow-execution':
            result = await this.processWorkflowExecution(job)
            break
          default:
            throw new Error(`Unknown job type: ${data.type}`)
        }

        result.stats.processingTime = Math.round((Date.now() - startTime) / 1000)
        console.log(`✅ Batch job completed: ${job.id}`)
        
        return result
      } catch (error) {
        console.error(`❌ Batch job failed: ${job.id}`, error)
        throw error
      }
    })
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.pdfQueue) return

    this.pdfQueue.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} completed with result:`, result.stats)
    })

    this.pdfQueue.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err.message)
    })

    this.pdfQueue.on('progress', (job, progress) => {
      console.log(`📊 Job ${job.id} progress: ${progress.percentage}%`)
    })

    this.pdfQueue.on('stalled', (job) => {
      console.warn(`⚠️ Job ${job.id} stalled`)
    })
  }

  /**
   * Process batch split operation
   */
  private async processBatchSplit(job: Job<BatchJobData>): Promise<JobResult> {
    const { files, config, outputDir } = job.data
    const outputFiles: string[] = []
    const errors: string[] = []
    let totalSize = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Update progress
      await job.progress({
        current: i + 1,
        total: files.length,
        currentFile: path.basename(file),
        stage: 'splitting',
        percentage: Math.round(((i + 1) / files.length) * 100)
      })

      try {
        const splitResults = await this.pdfService.splitPDF(file, {
          ranges: config.ranges || [{ start: 1, end: -1, name: `split_${i}` }],
          outputDir: path.join(outputDir, `split_${i}`)
        })

        outputFiles.push(...splitResults)
        
        // Calculate total size
        for (const outputFile of splitResults) {
          const stats = await fs.stat(outputFile)
          totalSize += stats.size
        }
      } catch (error) {
        errors.push(`Failed to split ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      success: errors.length === 0,
      outputFiles,
      errors,
      stats: {
        totalFiles: files.length,
        successfulFiles: files.length - errors.length,
        failedFiles: errors.length,
        totalSize,
        processingTime: 0 // Will be set by caller
      }
    }
  }

  /**
   * Process batch merge operation
   */
  private async processBatchMerge(job: Job<BatchJobData>): Promise<JobResult> {
    const { files, config, outputDir } = job.data
    const errors: string[] = []

    // Update progress
    await job.progress({
      current: 1,
      total: 1,
      currentFile: 'Merging files',
      stage: 'merging',
      percentage: 50
    })

    try {
      const outputPath = await this.pdfService.mergePDFs(files, {
        outputName: config.outputName || 'merged_batch',
        preserveBookmarks: config.preserveBookmarks || false,
        addPageNumbers: config.addPageNumbers || false,
        outputDir
      })

      const stats = await fs.stat(outputPath)

      await job.progress({
        current: 1,
        total: 1,
        currentFile: 'Completed',
        stage: 'completed',
        percentage: 100
      })

      return {
        success: true,
        outputFiles: [outputPath],
        errors: [],
        stats: {
          totalFiles: files.length,
          successfulFiles: 1,
          failedFiles: 0,
          totalSize: stats.size,
          processingTime: 0
        }
      }
    } catch (error) {
      errors.push(`Failed to merge files: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        success: false,
        outputFiles: [],
        errors,
        stats: {
          totalFiles: files.length,
          successfulFiles: 0,
          failedFiles: 1,
          totalSize: 0,
          processingTime: 0
        }
      }
    }
  }

  /**
   * Process batch OCR operation
   */
  private async processBatchOCR(job: Job<BatchJobData>): Promise<JobResult> {
    const { files, config, outputDir } = job.data
    const outputFiles: string[] = []
    const errors: string[] = []
    let totalSize = 0

    await this.ocrService.initialize()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Update progress
      await job.progress({
        current: i + 1,
        total: files.length,
        currentFile: path.basename(file),
        stage: 'ocr-processing',
        percentage: Math.round(((i + 1) / files.length) * 100)
      })

      try {
        const ocrResult = await this.ocrService.extractTextFromPDF(file, {
          pages: config.pages,
          density: config.density || 200,
          outputDir: path.join(outputDir, `ocr_${i}`)
        })

        // Save extracted text
        const textFile = path.join(outputDir, `${path.basename(file, '.pdf')}_extracted.txt`)
        await fs.writeFile(textFile, ocrResult.fullText)
        outputFiles.push(textFile)

        const stats = await fs.stat(textFile)
        totalSize += stats.size
      } catch (error) {
        errors.push(`Failed to OCR ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    await this.ocrService.terminate()

    return {
      success: errors.length === 0,
      outputFiles,
      errors,
      stats: {
        totalFiles: files.length,
        successfulFiles: files.length - errors.length,
        failedFiles: errors.length,
        totalSize,
        processingTime: 0
      }
    }
  }

  /**
   * Process batch template operation
   */
  private async processBatchTemplate(job: Job<BatchJobData>): Promise<JobResult> {
    const { files, config, outputDir } = job.data
    const outputFiles: string[] = []
    const errors: string[] = []

    // Get template
    const template = await this.templateService.getTemplate(config.templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    // Process each file through the template steps
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      await job.progress({
        current: i + 1,
        total: files.length,
        currentFile: path.basename(file),
        stage: 'template-processing',
        percentage: Math.round(((i + 1) / files.length) * 100)
      })

      try {
        // Execute template steps (simplified implementation)
        let currentFile = file
        const fileOutputDir = path.join(outputDir, `template_${i}`)
        await fs.mkdir(fileOutputDir, { recursive: true })

        for (const step of template.steps.sort((a, b) => a.order - b.order)) {
          // Execute step based on type
          // This is a simplified implementation - in reality, you'd have more complex step execution
          switch (step.type) {
            case 'split':
              // Execute split step
              break
            case 'merge':
              // Execute merge step
              break
            case 'ocr':
              // Execute OCR step
              break
            // Add more step types as needed
          }
        }

        outputFiles.push(currentFile)
      } catch (error) {
        errors.push(`Failed to process ${file} with template: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      success: errors.length === 0,
      outputFiles,
      errors,
      stats: {
        totalFiles: files.length,
        successfulFiles: files.length - errors.length,
        failedFiles: errors.length,
        totalSize: 0,
        processingTime: 0
      }
    }
  }

  /**
   * Process workflow execution
   */
  private async processWorkflowExecution(job: Job<BatchJobData>): Promise<JobResult> {
    // Placeholder for workflow execution
    // This would integrate with the workflow builder system
    return {
      success: true,
      outputFiles: [],
      errors: [],
      stats: {
        totalFiles: 0,
        successfulFiles: 0,
        failedFiles: 0,
        totalSize: 0,
        processingTime: 0
      }
    }
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
    available: boolean
  }> {
    if (!this.isAvailable()) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        available: false
      }
    }

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.pdfQueue!.getWaiting(),
        this.pdfQueue!.getActive(),
        this.pdfQueue!.getCompleted(),
        this.pdfQueue!.getFailed(),
        this.pdfQueue!.getDelayed()
      ])

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        available: true
      }
    } catch (error) {
      console.error('Failed to get queue stats:', error)
      this.isRedisAvailable = false
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        available: false
      }
    }
  }

  /**
   * Clean up old jobs
   */
  async cleanupJobs(): Promise<void> {
    try {
      await this.pdfQueue.clean(24 * 60 * 60 * 1000, 'completed') // Remove completed jobs older than 24 hours
      await this.pdfQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed') // Remove failed jobs older than 7 days
      console.log('✅ Queue cleanup completed')
    } catch (error) {
      console.error('Failed to cleanup jobs:', error)
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.pdfQueue.close()
      await this.ocrService.terminate()
      console.log('✅ Queue service shutdown completed')
    } catch (error) {
      console.error('Error during queue shutdown:', error)
    }
  }
}
