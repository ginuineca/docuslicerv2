import fs from 'fs/promises'
import path from 'path'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import sharp from 'sharp'

/**
 * Test helper functions for creating test files and utilities
 */

export async function createTestPDF(filename: string, pageCount: number = 5): Promise<string> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([612, 792]) // Letter size
    
    // Add title
    page.drawText(`Test Document - Page ${i}`, {
      x: 50,
      y: 750,
      size: 24,
      font,
      color: rgb(0, 0, 0)
    })
    
    // Add content
    const content = [
      `This is page ${i} of ${pageCount} in the test document.`,
      '',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
      '',
      `Page created at: ${new Date().toISOString()}`,
      `Document ID: TEST-${Math.random().toString(36).substr(2, 9)}`,
      '',
      'Additional test content:',
      '• Bullet point 1',
      '• Bullet point 2',
      '• Bullet point 3',
      '',
      'Numbers: 1234567890',
      'Special chars: !@#$%^&*()',
      'Mixed case: AbCdEfGhIjKlMnOp'
    ]
    
    let yPosition = 700
    content.forEach(line => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 12,
        font,
        color: rgb(0, 0, 0)
      })
      yPosition -= 20
    })
    
    // Add page number at bottom
    page.drawText(`Page ${i}`, {
      x: 300,
      y: 30,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5)
    })
  }
  
  const pdfBytes = await pdfDoc.save()
  const filePath = path.join(__dirname, 'test-files', filename)
  
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, pdfBytes)
  
  return filePath
}

export async function createLargePDF(filename: string, pageCount: number = 100): Promise<string> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([612, 792])
    
    // Add more content per page for larger file size
    page.drawText(`Large Test Document - Page ${i} of ${pageCount}`, {
      x: 50,
      y: 750,
      size: 20,
      font,
      color: rgb(0, 0, 0)
    })
    
    // Fill page with more text
    let yPosition = 700
    for (let j = 0; j < 30; j++) {
      const line = `Line ${j + 1}: This is a longer line of text to increase file size. Random data: ${Math.random().toString(36)}`
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      })
      yPosition -= 15
      
      if (yPosition < 50) break
    }
    
    // Add rectangles for visual content
    page.drawRectangle({
      x: 400,
      y: 600,
      width: 150,
      height: 100,
      borderColor: rgb(0, 0, 1),
      borderWidth: 2
    })
    
    page.drawText(`Page ${i}`, {
      x: 300,
      y: 30,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5)
    })
  }
  
  const pdfBytes = await pdfDoc.save()
  const filePath = path.join(__dirname, 'test-files', filename)
  
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, pdfBytes)
  
  return filePath
}

export async function createTestImage(filename: string): Promise<string> {
  // Create a test image with text for OCR testing
  const width = 800
  const height = 600
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      <text x="50" y="100" font-family="Arial" font-size="24" fill="black">
        Test Document for OCR
      </text>
      <text x="50" y="150" font-family="Arial" font-size="16" fill="black">
        This is a sample text for optical character recognition testing.
      </text>
      <text x="50" y="200" font-family="Arial" font-size="16" fill="black">
        It contains various words and numbers: 1234567890
      </text>
      <text x="50" y="250" font-family="Arial" font-size="16" fill="black">
        Special characters: !@#$%^&amp;*()
      </text>
      <text x="50" y="300" font-family="Arial" font-size="16" fill="black">
        Mixed case text: AbCdEfGhIjKlMnOp
      </text>
      <text x="50" y="350" font-family="Arial" font-size="14" fill="black">
        Date: ${new Date().toLocaleDateString()}
      </text>
      <text x="50" y="400" font-family="Arial" font-size="14" fill="black">
        Document ID: TEST-OCR-${Math.random().toString(36).substr(2, 6)}
      </text>
      <rect x="50" y="450" width="200" height="100" fill="none" stroke="black" stroke-width="2"/>
      <text x="60" y="480" font-family="Arial" font-size="12" fill="black">
        This text is inside a box
      </text>
      <text x="60" y="500" font-family="Arial" font-size="12" fill="black">
        for layout testing
      </text>
    </svg>
  `
  
  const imageBuffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer()
  
  const filePath = path.join(__dirname, 'test-files', filename)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, imageBuffer)
  
  return filePath
}

export async function createCorruptedPDF(filename: string): Promise<string> {
  // Create a file that looks like PDF but is corrupted
  const corruptedContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
CORRUPTED DATA HERE - NOT VALID PDF
endobj

xref
0 4
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
INVALID
%%EOF`

  const filePath = path.join(__dirname, 'test-files', filename)
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, corruptedContent)
  
  return filePath
}

export async function createPasswordProtectedPDF(filename: string, password: string = 'test123'): Promise<string> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  
  const page = pdfDoc.addPage([612, 792])
  page.drawText('This is a password-protected PDF', {
    x: 50,
    y: 750,
    size: 18,
    font,
    color: rgb(0, 0, 0)
  })
  
  page.drawText('Password required to access this document', {
    x: 50,
    y: 700,
    size: 14,
    font,
    color: rgb(0, 0, 0)
  })
  
  // Note: pdf-lib doesn't support password protection directly
  // This would need a different library like HummusJS
  const pdfBytes = await pdfDoc.save()
  const filePath = path.join(__dirname, 'test-files', filename)
  
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, pdfBytes)
  
  return filePath
}

export function generateRandomText(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 '
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function createMockWorkflow() {
  return {
    id: 'test-workflow-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Workflow',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Input',
          type: 'input',
          config: {
            acceptedTypes: ['pdf']
          }
        }
      },
      {
        id: 'split-1',
        type: 'workflowNode',
        position: { x: 300, y: 200 },
        data: {
          label: 'Split PDF',
          type: 'split',
          config: {
            ranges: [{ start: 1, end: 5 }]
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 500, y: 200 },
        data: {
          label: 'Output',
          type: 'output',
          config: {}
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'input-1', target: 'split-1', type: 'smoothstep' },
      { id: 'e2', source: 'split-1', target: 'output-1', type: 'smoothstep' }
    ]
  }
}

export class PerformanceMonitor {
  private startTime: number
  private checkpoints: Array<{ name: string; time: number; memory: number }> = []

  constructor() {
    this.startTime = performance.now()
    this.checkpoint('start')
  }

  checkpoint(name: string): void {
    const currentTime = performance.now()
    const memoryUsage = process.memoryUsage().heapUsed
    
    this.checkpoints.push({
      name,
      time: currentTime - this.startTime,
      memory: memoryUsage
    })
  }

  getReport(): {
    totalTime: number
    checkpoints: Array<{ name: string; time: number; memory: number; deltaTime?: number; deltaMemory?: number }>
    peakMemory: number
  } {
    const enrichedCheckpoints = this.checkpoints.map((checkpoint, index) => {
      const previous = index > 0 ? this.checkpoints[index - 1] : null
      return {
        ...checkpoint,
        deltaTime: previous ? checkpoint.time - previous.time : 0,
        deltaMemory: previous ? checkpoint.memory - previous.memory : 0
      }
    })

    return {
      totalTime: performance.now() - this.startTime,
      checkpoints: enrichedCheckpoints,
      peakMemory: Math.max(...this.checkpoints.map(c => c.memory))
    }
  }
}

export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  timeout: number = 10000,
  interval: number = 100
): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
  
  return false
}

export function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
}

export async function cleanupTestFiles(directory: string): Promise<void> {
  try {
    const files = await fs.readdir(directory)
    await Promise.all(
      files.map(file => fs.unlink(path.join(directory, file)).catch(() => {}))
    )
    await fs.rmdir(directory).catch(() => {})
  } catch (error) {
    // Ignore cleanup errors
  }
}

export class LoadTester {
  private results: Array<{
    timestamp: number
    responseTime: number
    success: boolean
    error?: string
  }> = []

  async runLoad(
    testFunction: () => Promise<any>,
    options: {
      concurrency: number
      duration: number
      rampUp?: number
    }
  ): Promise<{
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    maxResponseTime: number
    minResponseTime: number
    requestsPerSecond: number
    errorRate: number
  }> {
    const { concurrency, duration, rampUp = 0 } = options
    const startTime = Date.now()
    const endTime = startTime + duration
    
    // Start workers with ramp-up
    const workers = []
    for (let i = 0; i < concurrency; i++) {
      const delay = rampUp > 0 ? (i * rampUp) / concurrency : 0
      workers.push(this.startWorker(testFunction, endTime, delay))
    }
    
    await Promise.all(workers)
    
    const responseTimes = this.results.map(r => r.responseTime)
    const successfulRequests = this.results.filter(r => r.success).length
    
    return {
      totalRequests: this.results.length,
      successfulRequests,
      failedRequests: this.results.length - successfulRequests,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      minResponseTime: Math.min(...responseTimes),
      requestsPerSecond: this.results.length / (duration / 1000),
      errorRate: (this.results.length - successfulRequests) / this.results.length
    }
  }

  private async startWorker(
    testFunction: () => Promise<any>,
    endTime: number,
    delay: number
  ): Promise<void> {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    while (Date.now() < endTime) {
      const startTime = performance.now()
      
      try {
        await testFunction()
        this.results.push({
          timestamp: Date.now(),
          responseTime: performance.now() - startTime,
          success: true
        })
      } catch (error) {
        this.results.push({
          timestamp: Date.now(),
          responseTime: performance.now() - startTime,
          success: false,
          error: error.message
        })
      }
    }
  }
}
