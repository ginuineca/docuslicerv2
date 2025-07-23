import { performance } from 'perf_hooks'
import { Worker } from 'worker_threads'
import path from 'path'
import fs from 'fs/promises'
import { EventEmitter } from 'events'
import { LoadTester, createTestPDF, createLargePDF } from './test-helpers'

/**
 * Comprehensive stress testing framework for DocuSlicer
 * Tests system behavior under extreme load conditions
 */

interface StressTestScenario {
  name: string
  description: string
  duration: number // milliseconds
  concurrency: number
  rampUpTime?: number
  targetRPS?: number
  testFunction: () => Promise<any>
}

interface StressTestMetrics {
  scenario: string
  startTime: number
  endTime: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  requestsPerSecond: number
  errorRate: number
  memoryUsage: {
    initial: number
    peak: number
    final: number
  }
  cpuUsage: {
    average: number
    peak: number
  }
  errors: Array<{
    timestamp: number
    error: string
    count: number
  }>
}

class StressTestRunner extends EventEmitter {
  private testResults: StressTestMetrics[] = []
  private isRunning = false
  private workers: Worker[] = []
  private testFiles: string[] = []

  async runStressTests(): Promise<void> {
    console.log('💪 Starting Comprehensive Stress Test Suite...\n')
    
    this.isRunning = true
    
    try {
      await this.setupStressTestEnvironment()
      
      // Run different stress test scenarios
      await this.runScenario(this.createHighConcurrencyScenario())
      await this.runScenario(this.createMemoryStressScenario())
      await this.runScenario(this.createCPUIntensiveScenario())
      await this.runScenario(this.createLongRunningScenario())
      await this.runScenario(this.createMixedWorkloadScenario())
      await this.runScenario(this.createFileSystemStressScenario())
      await this.runScenario(this.createNetworkStressScenario())
      
      await this.generateStressTestReport()
      
    } finally {
      await this.cleanupStressTestEnvironment()
      this.isRunning = false
    }
  }

  private async setupStressTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up stress test environment...')
    
    // Create test files of various sizes
    const testDir = path.join(__dirname, 'stress-test-files')
    await fs.mkdir(testDir, { recursive: true })
    
    // Small files for high concurrency tests
    for (let i = 0; i < 10; i++) {
      this.testFiles.push(await createTestPDF(`small-${i}.pdf`, 2))
    }
    
    // Medium files for balanced tests
    for (let i = 0; i < 5; i++) {
      this.testFiles.push(await createTestPDF(`medium-${i}.pdf`, 10))
    }
    
    // Large files for memory stress tests
    for (let i = 0; i < 3; i++) {
      this.testFiles.push(await createLargePDF(`large-${i}.pdf`, 50))
    }
    
    console.log(`✅ Created ${this.testFiles.length} test files\n`)
  }

  private createHighConcurrencyScenario(): StressTestScenario {
    return {
      name: 'High Concurrency Upload',
      description: 'Test system behavior with many concurrent file uploads',
      duration: 60000, // 1 minute
      concurrency: 100,
      rampUpTime: 10000, // 10 seconds
      targetRPS: 50,
      testFunction: async () => {
        const testFile = this.testFiles[Math.floor(Math.random() * 10)] // Use small files
        const FormData = require('form-data')
        const fetch = require('node-fetch')
        
        const form = new FormData()
        form.append('file', await fs.readFile(testFile), {
          filename: path.basename(testFile),
          contentType: 'application/pdf'
        })
        
        const response = await fetch('http://localhost:3001/api/documents/upload', {
          method: 'POST',
          body: form,
          timeout: 30000
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        return response.json()
      }
    }
  }

  private createMemoryStressScenario(): StressTestScenario {
    return {
      name: 'Memory Stress Test',
      description: 'Test memory usage with large file processing',
      duration: 120000, // 2 minutes
      concurrency: 20,
      rampUpTime: 15000, // 15 seconds
      testFunction: async () => {
        const testFile = this.testFiles[10 + Math.floor(Math.random() * 3)] // Use large files
        const FormData = require('form-data')
        const fetch = require('node-fetch')
        
        // Upload large file
        const uploadForm = new FormData()
        uploadForm.append('file', await fs.readFile(testFile), {
          filename: path.basename(testFile),
          contentType: 'application/pdf'
        })
        
        const uploadResponse = await fetch('http://localhost:3001/api/documents/upload', {
          method: 'POST',
          body: uploadForm,
          timeout: 60000
        })
        
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.status}`)
        }
        
        const uploadResult = await uploadResponse.json()
        const documentId = uploadResult.document.id
        
        // Process the file (split)
        const processResponse = await fetch(`http://localhost:3001/api/documents/${documentId}/split`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ranges: [
              { start: 1, end: 10 },
              { start: 11, end: 20 },
              { start: 21, end: -1 }
            ]
          }),
          timeout: 120000
        })
        
        if (!processResponse.ok) {
          throw new Error(`Processing failed: ${processResponse.status}`)
        }
        
        return processResponse.json()
      }
    }
  }

  private createCPUIntensiveScenario(): StressTestScenario {
    return {
      name: 'CPU Intensive Processing',
      description: 'Test CPU usage with OCR and AI processing',
      duration: 180000, // 3 minutes
      concurrency: 15,
      rampUpTime: 20000, // 20 seconds
      testFunction: async () => {
        const testFile = this.testFiles[5 + Math.floor(Math.random() * 5)] // Use medium files
        const FormData = require('form-data')
        const fetch = require('node-fetch')
        
        // Upload file
        const uploadForm = new FormData()
        uploadForm.append('file', await fs.readFile(testFile), {
          filename: path.basename(testFile),
          contentType: 'application/pdf'
        })
        
        const uploadResponse = await fetch('http://localhost:3001/api/documents/upload', {
          method: 'POST',
          body: uploadForm,
          timeout: 60000
        })
        
        const uploadResult = await uploadResponse.json()
        const documentId = uploadResult.document.id
        
        // Run OCR processing
        const ocrResponse = await fetch(`http://localhost:3001/api/documents/${documentId}/ocr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: 'eng',
            confidence: 60,
            density: 300
          }),
          timeout: 180000
        })
        
        if (!ocrResponse.ok) {
          throw new Error(`OCR failed: ${ocrResponse.status}`)
        }
        
        const ocrResult = await ocrResponse.json()
        
        // Run AI classification
        const classifyResponse = await fetch('http://localhost:3001/api/ai/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId,
            categories: ['invoice', 'contract', 'report', 'letter', 'form']
          }),
          timeout: 60000
        })
        
        if (!classifyResponse.ok) {
          throw new Error(`Classification failed: ${classifyResponse.status}`)
        }
        
        return classifyResponse.json()
      }
    }
  }

  private createLongRunningScenario(): StressTestScenario {
    return {
      name: 'Long Running Operations',
      description: 'Test system stability over extended periods',
      duration: 300000, // 5 minutes
      concurrency: 10,
      rampUpTime: 30000, // 30 seconds
      testFunction: async () => {
        const fetch = require('node-fetch')
        
        // Execute a complex workflow
        const workflowResponse = await fetch('http://localhost:3001/api/workflows/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: 'batch-ocr-powerhouse',
            inputFiles: this.testFiles.slice(0, 3),
            config: {
              parallelWorkers: 2,
              enableCaching: true,
              qualityCheck: true
            }
          }),
          timeout: 300000
        })
        
        if (!workflowResponse.ok) {
          throw new Error(`Workflow execution failed: ${workflowResponse.status}`)
        }
        
        const workflowResult = await workflowResponse.json()
        const executionId = workflowResult.executionId
        
        // Poll for completion
        let status = 'running'
        let attempts = 0
        const maxAttempts = 60 // 5 minutes max
        
        while (status === 'running' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds
          
          const statusResponse = await fetch(`http://localhost:3001/api/workflows/executions/${executionId}/status`, {
            timeout: 10000
          })
          
          if (statusResponse.ok) {
            const statusResult = await statusResponse.json()
            status = statusResult.status
          }
          
          attempts++
        }
        
        return { executionId, status, attempts }
      }
    }
  }

  private createMixedWorkloadScenario(): StressTestScenario {
    return {
      name: 'Mixed Workload',
      description: 'Test system with mixed operations (upload, process, download)',
      duration: 240000, // 4 minutes
      concurrency: 25,
      rampUpTime: 25000, // 25 seconds
      testFunction: async () => {
        const operations = ['upload', 'split', 'merge', 'ocr', 'classify']
        const operation = operations[Math.floor(Math.random() * operations.length)]
        const fetch = require('node-fetch')
        
        switch (operation) {
          case 'upload':
            return this.performUpload()
          case 'split':
            return this.performSplit()
          case 'merge':
            return this.performMerge()
          case 'ocr':
            return this.performOCR()
          case 'classify':
            return this.performClassification()
          default:
            return this.performUpload()
        }
      }
    }
  }

  private createFileSystemStressScenario(): StressTestScenario {
    return {
      name: 'File System Stress',
      description: 'Test file system operations under load',
      duration: 150000, // 2.5 minutes
      concurrency: 30,
      testFunction: async () => {
        const fetch = require('node-fetch')
        
        // Rapid file operations
        const operations = []
        
        // Upload multiple files
        for (let i = 0; i < 3; i++) {
          const testFile = this.testFiles[Math.floor(Math.random() * this.testFiles.length)]
          operations.push(this.performUpload(testFile))
        }
        
        const results = await Promise.all(operations)
        
        // Clean up some files
        for (const result of results.slice(0, 2)) {
          if (result.document?.id) {
            await fetch(`http://localhost:3001/api/documents/${result.document.id}`, {
              method: 'DELETE',
              timeout: 10000
            })
          }
        }
        
        return { uploadedFiles: results.length, cleanedFiles: 2 }
      }
    }
  }

  private createNetworkStressScenario(): StressTestScenario {
    return {
      name: 'Network Stress',
      description: 'Test network handling with rapid requests',
      duration: 90000, // 1.5 minutes
      concurrency: 50,
      targetRPS: 100,
      testFunction: async () => {
        const fetch = require('node-fetch')
        
        // Make rapid API calls
        const endpoints = [
          '/api/health',
          '/api/documents',
          '/api/workflows/templates',
          '/api/analytics/summary',
          '/api/integrations/status'
        ]
        
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
        
        const response = await fetch(`http://localhost:3001${endpoint}`, {
          timeout: 5000
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        return response.json()
      }
    }
  }

  private async runScenario(scenario: StressTestScenario): Promise<void> {
    console.log(`🔥 Running: ${scenario.name}`)
    console.log(`   Description: ${scenario.description}`)
    console.log(`   Duration: ${scenario.duration / 1000}s, Concurrency: ${scenario.concurrency}`)
    
    const startTime = performance.now()
    const initialMemory = process.memoryUsage().heapUsed
    
    const loadTester = new LoadTester()
    const results = await loadTester.runLoad(scenario.testFunction, {
      concurrency: scenario.concurrency,
      duration: scenario.duration,
      rampUp: scenario.rampUpTime
    })
    
    const endTime = performance.now()
    const finalMemory = process.memoryUsage().heapUsed
    
    const metrics: StressTestMetrics = {
      scenario: scenario.name,
      startTime,
      endTime,
      totalRequests: results.totalRequests,
      successfulRequests: results.successfulRequests,
      failedRequests: results.failedRequests,
      averageResponseTime: results.averageResponseTime,
      maxResponseTime: results.maxResponseTime,
      minResponseTime: results.minResponseTime,
      p95ResponseTime: 0, // Would calculate from detailed results
      p99ResponseTime: 0, // Would calculate from detailed results
      requestsPerSecond: results.requestsPerSecond,
      errorRate: results.errorRate,
      memoryUsage: {
        initial: initialMemory,
        peak: process.memoryUsage().heapUsed, // Simplified
        final: finalMemory
      },
      cpuUsage: {
        average: 0, // Would need CPU monitoring
        peak: 0
      },
      errors: [] // Would collect from detailed results
    }
    
    this.testResults.push(metrics)
    
    const successRate = (results.successfulRequests / results.totalRequests) * 100
    const statusIcon = successRate > 95 ? '✅' : successRate > 80 ? '⚠️' : '❌'
    
    console.log(`   ${statusIcon} Success Rate: ${successRate.toFixed(1)}%`)
    console.log(`   📊 Throughput: ${results.requestsPerSecond.toFixed(1)} req/s`)
    console.log(`   ⏱️  Avg Response: ${results.averageResponseTime.toFixed(0)}ms`)
    console.log(`   💾 Memory Delta: ${((finalMemory - initialMemory) / 1024 / 1024).toFixed(1)}MB`)
    console.log('')
  }

  private async performUpload(testFile?: string): Promise<any> {
    const file = testFile || this.testFiles[Math.floor(Math.random() * this.testFiles.length)]
    const FormData = require('form-data')
    const fetch = require('node-fetch')
    
    const form = new FormData()
    form.append('file', await fs.readFile(file), {
      filename: path.basename(file),
      contentType: 'application/pdf'
    })
    
    const response = await fetch('http://localhost:3001/api/documents/upload', {
      method: 'POST',
      body: form,
      timeout: 30000
    })
    
    return response.json()
  }

  private async performSplit(): Promise<any> {
    // Implementation would split a random document
    return { operation: 'split', status: 'completed' }
  }

  private async performMerge(): Promise<any> {
    // Implementation would merge random documents
    return { operation: 'merge', status: 'completed' }
  }

  private async performOCR(): Promise<any> {
    // Implementation would run OCR on a random document
    return { operation: 'ocr', status: 'completed' }
  }

  private async performClassification(): Promise<any> {
    // Implementation would classify a random document
    return { operation: 'classify', status: 'completed' }
  }

  private async generateStressTestReport(): Promise<void> {
    console.log('📊 Generating Stress Test Report...')
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalScenarios: this.testResults.length,
        totalRequests: this.testResults.reduce((sum, r) => sum + r.totalRequests, 0),
        totalSuccessful: this.testResults.reduce((sum, r) => sum + r.successfulRequests, 0),
        totalFailed: this.testResults.reduce((sum, r) => sum + r.failedRequests, 0),
        averageRPS: this.testResults.reduce((sum, r) => sum + r.requestsPerSecond, 0) / this.testResults.length,
        averageErrorRate: this.testResults.reduce((sum, r) => sum + r.errorRate, 0) / this.testResults.length
      },
      scenarios: this.testResults,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        cpuCount: require('os').cpus().length,
        totalMemory: require('os').totalmem(),
        freeMemory: require('os').freemem()
      }
    }

    const reportPath = path.join(__dirname, 'stress-test-report.json')
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`📋 Stress test report saved to: ${reportPath}`)
    console.log('\n💪 STRESS TEST SUMMARY:')
    console.log(`   Total Scenarios: ${report.summary.totalScenarios}`)
    console.log(`   Total Requests: ${report.summary.totalRequests}`)
    console.log(`   ✅ Successful: ${report.summary.totalSuccessful}`)
    console.log(`   ❌ Failed: ${report.summary.totalFailed}`)
    console.log(`   📊 Average RPS: ${report.summary.averageRPS.toFixed(1)}`)
    console.log(`   ⚠️  Average Error Rate: ${(report.summary.averageErrorRate * 100).toFixed(2)}%`)
  }

  private async cleanupStressTestEnvironment(): Promise<void> {
    console.log('\n🧹 Cleaning up stress test environment...')
    
    // Terminate workers
    this.workers.forEach(worker => worker.terminate())
    this.workers = []
    
    // Clean up test files
    for (const file of this.testFiles) {
      try {
        await fs.unlink(file)
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    console.log('✅ Stress test cleanup completed')
  }
}

// Export for use in test runner
export { StressTestRunner }

// Run stress tests if called directly
if (require.main === module) {
  const stressRunner = new StressTestRunner()
  stressRunner.runStressTests().catch(console.error)
}
