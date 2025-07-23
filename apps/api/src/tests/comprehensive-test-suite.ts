import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import request from 'supertest'
import fs from 'fs/promises'
import path from 'path'
import { performance } from 'perf_hooks'
import { app } from '../app'
import { createTestPDF, createTestImage, createLargePDF } from './test-helpers'

/**
 * Comprehensive test suite for all DocuSlicer features
 * Tests functionality, performance, and reliability under various conditions
 */

interface TestResult {
  feature: string
  test: string
  status: 'pass' | 'fail' | 'warning'
  duration: number
  details: string
  metrics?: {
    memoryUsage?: number
    cpuTime?: number
    fileSize?: number
    accuracy?: number
  }
}

interface StressTestResult {
  scenario: string
  concurrentUsers: number
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  throughput: number
  errorRate: number
  memoryPeak: number
}

class ComprehensiveTestSuite {
  private testResults: TestResult[] = []
  private stressTestResults: StressTestResult[] = []
  private testFiles: string[] = []

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive DocuSlicer Test Suite...\n')

    await this.setupTestEnvironment()

    // Core Feature Tests
    await this.testCoreFeatures()
    
    // Advanced Feature Tests
    await this.testAdvancedFeatures()
    
    // Integration Tests
    await this.testIntegrations()
    
    // Performance Tests
    await this.testPerformance()
    
    // Security Tests
    await this.testSecurity()
    
    // Stress Tests
    await this.runStressTests()
    
    // Generate comprehensive report
    await this.generateTestReport()
    
    await this.cleanupTestEnvironment()
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log('📋 Setting up test environment...')
    
    // Create test files
    const testDir = path.join(__dirname, 'test-files')
    await fs.mkdir(testDir, { recursive: true })
    
    // Create various test PDFs
    this.testFiles.push(await createTestPDF('simple-test.pdf', 5))
    this.testFiles.push(await createTestPDF('medium-test.pdf', 25))
    this.testFiles.push(await createLargePDF('large-test.pdf', 100))
    this.testFiles.push(await createTestImage('test-image.jpg'))
    
    console.log('✅ Test environment ready\n')
  }

  private async testCoreFeatures(): Promise<void> {
    console.log('🔧 Testing Core Features...')

    await this.testFeature('PDF Upload', async () => {
      const startTime = performance.now()
      const testFile = this.testFiles[0]
      
      const response = await request(app)
        .post('/api/documents/upload')
        .attach('file', testFile)
        .expect(200)

      const duration = performance.now() - startTime
      
      return {
        status: response.body.success ? 'pass' : 'fail',
        duration,
        details: `Uploaded ${path.basename(testFile)} successfully`,
        metrics: {
          fileSize: (await fs.stat(testFile)).size
        }
      }
    })

    await this.testFeature('PDF Split', async () => {
      const startTime = performance.now()
      const testFile = this.testFiles[1] // medium PDF
      
      // First upload
      const uploadResponse = await request(app)
        .post('/api/documents/upload')
        .attach('file', testFile)
        .expect(200)

      const documentId = uploadResponse.body.document.id

      // Then split
      const splitResponse = await request(app)
        .post(`/api/documents/${documentId}/split`)
        .send({
          ranges: [
            { start: 1, end: 5 },
            { start: 6, end: 10 },
            { start: 11, end: -1 }
          ]
        })
        .expect(200)

      const duration = performance.now() - startTime
      
      return {
        status: splitResponse.body.success ? 'pass' : 'fail',
        duration,
        details: `Split PDF into ${splitResponse.body.files?.length || 0} parts`,
        metrics: {
          fileSize: (await fs.stat(testFile)).size
        }
      }
    })

    await this.testFeature('PDF Merge', async () => {
      const startTime = performance.now()
      
      // Upload multiple files
      const uploadPromises = this.testFiles.slice(0, 3).map(file =>
        request(app)
          .post('/api/documents/upload')
          .attach('file', file)
      )
      
      const uploadResponses = await Promise.all(uploadPromises)
      const documentIds = uploadResponses.map(r => r.body.document.id)

      // Merge them
      const mergeResponse = await request(app)
        .post('/api/documents/merge')
        .send({
          documentIds,
          filename: 'merged-test.pdf'
        })
        .expect(200)

      const duration = performance.now() - startTime
      
      return {
        status: mergeResponse.body.success ? 'pass' : 'fail',
        duration,
        details: `Merged ${documentIds.length} documents successfully`,
        metrics: {
          fileSize: mergeResponse.body.fileSize || 0
        }
      }
    })

    await this.testFeature('OCR Text Extraction', async () => {
      const startTime = performance.now()
      const testImage = this.testFiles[3] // test image
      
      const uploadResponse = await request(app)
        .post('/api/documents/upload')
        .attach('file', testImage)
        .expect(200)

      const documentId = uploadResponse.body.document.id

      const ocrResponse = await request(app)
        .post(`/api/documents/${documentId}/ocr`)
        .send({
          language: 'eng',
          confidence: 60
        })
        .expect(200)

      const duration = performance.now() - startTime
      const extractedText = ocrResponse.body.text || ''
      
      return {
        status: extractedText.length > 0 ? 'pass' : 'fail',
        duration,
        details: `Extracted ${extractedText.length} characters`,
        metrics: {
          accuracy: ocrResponse.body.confidence || 0
        }
      }
    })

    console.log('✅ Core Features tested\n')
  }

  private async testAdvancedFeatures(): Promise<void> {
    console.log('🧠 Testing Advanced Features...')

    await this.testFeature('AI Document Classification', async () => {
      const startTime = performance.now()
      const testFile = this.testFiles[0]
      
      const uploadResponse = await request(app)
        .post('/api/documents/upload')
        .attach('file', testFile)
        .expect(200)

      const documentId = uploadResponse.body.document.id

      const classifyResponse = await request(app)
        .post(`/api/ai/classify`)
        .send({
          documentId,
          categories: ['invoice', 'contract', 'report', 'letter']
        })
        .expect(200)

      const duration = performance.now() - startTime
      
      return {
        status: classifyResponse.body.classification ? 'pass' : 'fail',
        duration,
        details: `Classified as: ${classifyResponse.body.classification}`,
        metrics: {
          accuracy: classifyResponse.body.confidence || 0
        }
      }
    })

    await this.testFeature('Workflow Execution', async () => {
      const startTime = performance.now()
      
      const workflowResponse = await request(app)
        .post('/api/workflows/execute')
        .send({
          templateId: 'lightning-pdf-split',
          inputFiles: [this.testFiles[1]],
          config: {
            splitMode: 'individual-pages'
          }
        })
        .expect(200)

      const executionId = workflowResponse.body.executionId

      // Wait for completion (simplified)
      await new Promise(resolve => setTimeout(resolve, 5000))

      const statusResponse = await request(app)
        .get(`/api/workflows/executions/${executionId}/status`)
        .expect(200)

      const duration = performance.now() - startTime
      
      return {
        status: statusResponse.body.status === 'completed' ? 'pass' : 'fail',
        duration,
        details: `Workflow executed with status: ${statusResponse.body.status}`,
        metrics: {
          cpuTime: statusResponse.body.metrics?.totalExecutionTime || 0
        }
      }
    })

    await this.testFeature('Template Validation', async () => {
      const startTime = performance.now()
      
      const validationResponse = await request(app)
        .post('/api/templates/validate')
        .send({
          nodes: [
            { id: '1', type: 'input', data: { type: 'input' } },
            { id: '2', type: 'split', data: { type: 'split' } },
            { id: '3', type: 'output', data: { type: 'output' } }
          ],
          edges: [
            { source: '1', target: '2' },
            { source: '2', target: '3' }
          ]
        })
        .expect(200)

      const duration = performance.now() - startTime
      
      return {
        status: validationResponse.body.isValid ? 'pass' : 'fail',
        duration,
        details: `Template validation: ${validationResponse.body.isValid ? 'valid' : 'invalid'}`,
        metrics: {
          accuracy: validationResponse.body.performanceScore || 0
        }
      }
    })

    console.log('✅ Advanced Features tested\n')
  }

  private async testIntegrations(): Promise<void> {
    console.log('🔗 Testing Integrations...')

    await this.testFeature('Cloud Storage Integration', async () => {
      const startTime = performance.now()
      
      // Test connection status
      const connectionResponse = await request(app)
        .get('/api/integrations/cloud-storage/status')
        .expect(200)

      const duration = performance.now() - startTime
      
      return {
        status: connectionResponse.body.connected ? 'pass' : 'warning',
        duration,
        details: `Cloud storage: ${connectionResponse.body.connected ? 'connected' : 'not configured'}`
      }
    })

    await this.testFeature('API Rate Limiting', async () => {
      const startTime = performance.now()
      
      // Make multiple rapid requests
      const requests = Array(10).fill(null).map(() =>
        request(app).get('/api/health')
      )
      
      const responses = await Promise.allSettled(requests)
      const rateLimited = responses.some(r => 
        r.status === 'fulfilled' && r.value.status === 429
      )

      const duration = performance.now() - startTime
      
      return {
        status: rateLimited ? 'pass' : 'warning',
        duration,
        details: `Rate limiting: ${rateLimited ? 'active' : 'not triggered'}`
      }
    })

    console.log('✅ Integrations tested\n')
  }

  private async testPerformance(): Promise<void> {
    console.log('⚡ Testing Performance...')

    await this.testFeature('Large File Processing', async () => {
      const startTime = performance.now()
      const largeFile = this.testFiles[2] // large PDF
      
      const uploadResponse = await request(app)
        .post('/api/documents/upload')
        .attach('file', largeFile)
        .expect(200)

      const documentId = uploadResponse.body.document.id

      const splitResponse = await request(app)
        .post(`/api/documents/${documentId}/split`)
        .send({
          ranges: [{ start: 1, end: 10 }]
        })
        .expect(200)

      const duration = performance.now() - startTime
      const fileSize = (await fs.stat(largeFile)).size
      
      return {
        status: duration < 30000 ? 'pass' : 'warning', // 30 second threshold
        duration,
        details: `Processed ${Math.round(fileSize / 1024 / 1024)}MB file in ${Math.round(duration)}ms`,
        metrics: {
          fileSize,
          memoryUsage: process.memoryUsage().heapUsed
        }
      }
    })

    await this.testFeature('Concurrent Processing', async () => {
      const startTime = performance.now()
      
      // Process multiple files concurrently
      const concurrentRequests = this.testFiles.slice(0, 3).map(async (file, index) => {
        const uploadResponse = await request(app)
          .post('/api/documents/upload')
          .attach('file', file)
        
        return request(app)
          .post(`/api/documents/${uploadResponse.body.document.id}/split`)
          .send({
            ranges: [{ start: 1, end: 3 }]
          })
      })

      const results = await Promise.allSettled(concurrentRequests)
      const successCount = results.filter(r => r.status === 'fulfilled').length

      const duration = performance.now() - startTime
      
      return {
        status: successCount === concurrentRequests.length ? 'pass' : 'warning',
        duration,
        details: `${successCount}/${concurrentRequests.length} concurrent operations succeeded`,
        metrics: {
          memoryUsage: process.memoryUsage().heapUsed
        }
      }
    })

    console.log('✅ Performance tested\n')
  }

  private async testSecurity(): Promise<void> {
    console.log('🔒 Testing Security...')

    await this.testFeature('File Type Validation', async () => {
      const startTime = performance.now()
      
      // Try to upload invalid file type
      const invalidFile = Buffer.from('This is not a PDF')
      
      const response = await request(app)
        .post('/api/documents/upload')
        .attach('file', invalidFile, 'malicious.exe')
        .expect(400)

      const duration = performance.now() - startTime
      
      return {
        status: response.status === 400 ? 'pass' : 'fail',
        duration,
        details: 'Invalid file type correctly rejected'
      }
    })

    await this.testFeature('File Size Limits', async () => {
      const startTime = performance.now()
      
      // Create oversized file (simulate)
      const oversizedBuffer = Buffer.alloc(200 * 1024 * 1024) // 200MB
      
      const response = await request(app)
        .post('/api/documents/upload')
        .attach('file', oversizedBuffer, 'oversized.pdf')
        .expect(413)

      const duration = performance.now() - startTime
      
      return {
        status: response.status === 413 ? 'pass' : 'fail',
        duration,
        details: 'Oversized file correctly rejected'
      }
    })

    console.log('✅ Security tested\n')
  }

  private async runStressTests(): Promise<void> {
    console.log('💪 Running Stress Tests...')

    // Test 1: High Concurrency Upload
    await this.stressTest('High Concurrency Upload', async () => {
      const concurrentUsers = 50
      const requestsPerUser = 5
      const totalRequests = concurrentUsers * requestsPerUser
      
      const startTime = performance.now()
      const results: Array<{ success: boolean; responseTime: number }> = []
      
      const userPromises = Array(concurrentUsers).fill(null).map(async () => {
        const userResults = []
        
        for (let i = 0; i < requestsPerUser; i++) {
          const requestStart = performance.now()
          
          try {
            await request(app)
              .post('/api/documents/upload')
              .attach('file', this.testFiles[0])
            
            userResults.push({
              success: true,
              responseTime: performance.now() - requestStart
            })
          } catch (error) {
            userResults.push({
              success: false,
              responseTime: performance.now() - requestStart
            })
          }
        }
        
        return userResults
      })

      const allResults = await Promise.all(userPromises)
      allResults.forEach(userResults => results.push(...userResults))

      const duration = performance.now() - startTime
      const successfulRequests = results.filter(r => r.success).length
      const responseTimes = results.map(r => r.responseTime)

      return {
        scenario: 'High Concurrency Upload',
        concurrentUsers,
        totalRequests,
        successfulRequests,
        failedRequests: totalRequests - successfulRequests,
        averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        maxResponseTime: Math.max(...responseTimes),
        minResponseTime: Math.min(...responseTimes),
        throughput: totalRequests / (duration / 1000),
        errorRate: (totalRequests - successfulRequests) / totalRequests,
        memoryPeak: process.memoryUsage().heapUsed
      }
    })

    // Test 2: Memory Stress Test
    await this.stressTest('Memory Stress Test', async () => {
      const concurrentUsers = 20
      const totalRequests = concurrentUsers
      
      const startTime = performance.now()
      const results: Array<{ success: boolean; responseTime: number }> = []
      
      // Process large files concurrently
      const promises = Array(concurrentUsers).fill(null).map(async () => {
        const requestStart = performance.now()
        
        try {
          const uploadResponse = await request(app)
            .post('/api/documents/upload')
            .attach('file', this.testFiles[2]) // large file
          
          await request(app)
            .post(`/api/documents/${uploadResponse.body.document.id}/split`)
            .send({
              ranges: [{ start: 1, end: 20 }]
            })
          
          return {
            success: true,
            responseTime: performance.now() - requestStart
          }
        } catch (error) {
          return {
            success: false,
            responseTime: performance.now() - requestStart
          }
        }
      })

      const allResults = await Promise.all(promises)
      results.push(...allResults)

      const duration = performance.now() - startTime
      const successfulRequests = results.filter(r => r.success).length
      const responseTimes = results.map(r => r.responseTime)

      return {
        scenario: 'Memory Stress Test',
        concurrentUsers,
        totalRequests,
        successfulRequests,
        failedRequests: totalRequests - successfulRequests,
        averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        maxResponseTime: Math.max(...responseTimes),
        minResponseTime: Math.min(...responseTimes),
        throughput: totalRequests / (duration / 1000),
        errorRate: (totalRequests - successfulRequests) / totalRequests,
        memoryPeak: process.memoryUsage().heapUsed
      }
    })

    console.log('✅ Stress Tests completed\n')
  }

  private async testFeature(
    featureName: string, 
    testFunction: () => Promise<Partial<TestResult>>
  ): Promise<void> {
    try {
      console.log(`  Testing: ${featureName}...`)
      const result = await testFunction()
      
      this.testResults.push({
        feature: 'Core',
        test: featureName,
        status: result.status || 'fail',
        duration: result.duration || 0,
        details: result.details || '',
        metrics: result.metrics
      })
      
      const statusIcon = result.status === 'pass' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌'
      console.log(`    ${statusIcon} ${featureName}: ${result.details}`)
      
    } catch (error) {
      this.testResults.push({
        feature: 'Core',
        test: featureName,
        status: 'fail',
        duration: 0,
        details: `Error: ${error.message}`
      })
      console.log(`    ❌ ${featureName}: Failed - ${error.message}`)
    }
  }

  private async stressTest(
    scenarioName: string,
    testFunction: () => Promise<StressTestResult>
  ): Promise<void> {
    try {
      console.log(`  Stress Testing: ${scenarioName}...`)
      const result = await testFunction()
      
      this.stressTestResults.push(result)
      
      const successRate = (result.successfulRequests / result.totalRequests) * 100
      const statusIcon = successRate > 95 ? '✅' : successRate > 80 ? '⚠️' : '❌'
      
      console.log(`    ${statusIcon} ${scenarioName}: ${successRate.toFixed(1)}% success rate`)
      console.log(`       Throughput: ${result.throughput.toFixed(1)} req/s`)
      console.log(`       Avg Response: ${result.averageResponseTime.toFixed(0)}ms`)
      
    } catch (error) {
      console.log(`    ❌ ${scenarioName}: Failed - ${error.message}`)
    }
  }

  private async generateTestReport(): Promise<void> {
    console.log('📊 Generating Test Report...')
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'pass').length,
        warnings: this.testResults.filter(r => r.status === 'warning').length,
        failed: this.testResults.filter(r => r.status === 'fail').length,
        averageDuration: this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length
      },
      featureTests: this.testResults,
      stressTests: this.stressTestResults,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    }

    const reportPath = path.join(__dirname, 'test-report.json')
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`📋 Test report saved to: ${reportPath}`)
    console.log('\n📊 TEST SUMMARY:')
    console.log(`   Total Tests: ${report.summary.totalTests}`)
    console.log(`   ✅ Passed: ${report.summary.passed}`)
    console.log(`   ⚠️  Warnings: ${report.summary.warnings}`)
    console.log(`   ❌ Failed: ${report.summary.failed}`)
    console.log(`   ⏱️  Average Duration: ${Math.round(report.summary.averageDuration)}ms`)
  }

  private async cleanupTestEnvironment(): Promise<void> {
    console.log('\n🧹 Cleaning up test environment...')
    
    // Clean up test files
    for (const file of this.testFiles) {
      try {
        await fs.unlink(file)
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    console.log('✅ Cleanup completed')
  }
}

// Export for use in test runner
export { ComprehensiveTestSuite }

// Run tests if called directly
if (require.main === module) {
  const testSuite = new ComprehensiveTestSuite()
  testSuite.runAllTests().catch(console.error)
}
