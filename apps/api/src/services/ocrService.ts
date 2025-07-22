import Tesseract from 'tesseract.js'
import { fromPath } from 'pdf2pic'
import fs from 'fs/promises'
import path from 'path'

export interface OCRResult {
  text: string
  confidence: number
  words: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
  }>
  lines: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
  }>
  paragraphs: Array<{
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
  }>
}

export interface PDFOCRResult {
  pages: Array<{
    pageNumber: number
    text: string
    confidence: number
    imagePath?: string
  }>
  fullText: string
  averageConfidence: number
  totalPages: number
}

export class OCRService {
  private worker: Tesseract.Worker | null = null

  /**
   * Initialize the OCR worker
   */
  async initialize(): Promise<void> {
    if (this.worker) return

    this.worker = await Tesseract.createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
        }
      }
    })
  }

  /**
   * Terminate the OCR worker
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }
  }

  /**
   * Extract text from an image using OCR
   */
  async extractTextFromImage(imagePath: string): Promise<OCRResult> {
    await this.initialize()
    
    if (!this.worker) {
      throw new Error('OCR worker not initialized')
    }

    try {
      const { data } = await this.worker.recognize(imagePath)
      
      return {
        text: data.text,
        confidence: data.confidence,
        words: data.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        })),
        lines: data.lines.map(line => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox
        })),
        paragraphs: data.paragraphs.map(paragraph => ({
          text: paragraph.text,
          confidence: paragraph.confidence,
          bbox: paragraph.bbox
        }))
      }
    } catch (error) {
      console.error('OCR extraction error:', error)
      throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Convert PDF pages to images and extract text using OCR
   */
  async extractTextFromPDF(
    pdfPath: string,
    options: {
      pages?: number[] // Specific pages to process, if not provided, process all
      outputDir?: string
      imageFormat?: 'png' | 'jpeg'
      density?: number // DPI for image conversion
    } = {}
  ): Promise<PDFOCRResult> {
    const {
      pages,
      outputDir = path.join(process.cwd(), 'uploads', 'temp', 'ocr'),
      imageFormat = 'png',
      density = 200
    } = options

    try {
      // Create output directory
      await fs.mkdir(outputDir, { recursive: true })

      // Configure pdf2pic
      const convert = fromPath(pdfPath, {
        density,
        saveFilename: 'page',
        savePath: outputDir,
        format: imageFormat,
        width: 2000,
        height: 2000
      })

      // Convert PDF pages to images
      let convertResult
      if (pages && pages.length > 0) {
        // Convert specific pages
        convertResult = await convert.bulk(pages, { responseType: 'image' })
      } else {
        // Convert all pages
        convertResult = await convert.bulk(-1, { responseType: 'image' })
      }

      const pageResults: PDFOCRResult['pages'] = []
      let totalConfidence = 0

      // Process each converted image with OCR
      for (const result of convertResult) {
        if (result.path) {
          try {
            const ocrResult = await this.extractTextFromImage(result.path)
            
            pageResults.push({
              pageNumber: result.page || 1,
              text: ocrResult.text,
              confidence: ocrResult.confidence,
              imagePath: result.path
            })

            totalConfidence += ocrResult.confidence
          } catch (error) {
            console.warn(`Failed to OCR page ${result.page}:`, error)
            pageResults.push({
              pageNumber: result.page || 1,
              text: '',
              confidence: 0,
              imagePath: result.path
            })
          }
        }
      }

      // Combine all text
      const fullText = pageResults.map(page => page.text).join('\n\n')
      const averageConfidence = pageResults.length > 0 ? totalConfidence / pageResults.length : 0

      return {
        pages: pageResults,
        fullText,
        averageConfidence,
        totalPages: pageResults.length
      }
    } catch (error) {
      console.error('PDF OCR error:', error)
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract text from specific regions of an image
   */
  async extractTextFromRegions(
    imagePath: string,
    regions: Array<{
      x: number
      y: number
      width: number
      height: number
      name?: string
    }>
  ): Promise<Array<{
    name?: string
    text: string
    confidence: number
    region: { x: number; y: number; width: number; height: number }
  }>> {
    await this.initialize()
    
    if (!this.worker) {
      throw new Error('OCR worker not initialized')
    }

    const results = []

    for (const region of regions) {
      try {
        const { data } = await this.worker.recognize(imagePath, {
          rectangle: {
            top: region.y,
            left: region.x,
            width: region.width,
            height: region.height
          }
        })

        results.push({
          name: region.name,
          text: data.text,
          confidence: data.confidence,
          region
        })
      } catch (error) {
        console.warn(`Failed to OCR region ${region.name || 'unnamed'}:`, error)
        results.push({
          name: region.name,
          text: '',
          confidence: 0,
          region
        })
      }
    }

    return results
  }

  /**
   * Search for specific text patterns in an image
   */
  async searchTextInImage(
    imagePath: string,
    searchTerms: string[]
  ): Promise<Array<{
    term: string
    found: boolean
    matches: Array<{
      text: string
      confidence: number
      bbox: {
        x0: number
        y0: number
        x1: number
        y1: number
      }
    }>
  }>> {
    const ocrResult = await this.extractTextFromImage(imagePath)
    const results = []

    for (const term of searchTerms) {
      const matches = []
      const regex = new RegExp(term, 'gi')
      
      // Search in words
      for (const word of ocrResult.words) {
        if (regex.test(word.text)) {
          matches.push({
            text: word.text,
            confidence: word.confidence,
            bbox: word.bbox
          })
        }
      }

      results.push({
        term,
        found: matches.length > 0,
        matches
      })
    }

    return results
  }

  /**
   * Clean up temporary image files
   */
  async cleanupImages(imagePaths: string[]): Promise<void> {
    for (const imagePath of imagePaths) {
      try {
        await fs.unlink(imagePath)
      } catch (error) {
        console.warn(`Failed to delete image ${imagePath}:`, error)
      }
    }
  }

  /**
   * Get OCR statistics for a result
   */
  getOCRStats(result: OCRResult): {
    wordCount: number
    lineCount: number
    paragraphCount: number
    averageWordConfidence: number
    lowConfidenceWords: number
  } {
    const wordCount = result.words.length
    const lineCount = result.lines.length
    const paragraphCount = result.paragraphs.length
    
    const totalWordConfidence = result.words.reduce((sum, word) => sum + word.confidence, 0)
    const averageWordConfidence = wordCount > 0 ? totalWordConfidence / wordCount : 0
    
    const lowConfidenceWords = result.words.filter(word => word.confidence < 70).length

    return {
      wordCount,
      lineCount,
      paragraphCount,
      averageWordConfidence,
      lowConfidenceWords
    }
  }
}
