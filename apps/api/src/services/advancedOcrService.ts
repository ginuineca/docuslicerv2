import Tesseract from 'tesseract.js'
import sharp from 'sharp'
import Jimp from 'jimp'
import fs from 'fs/promises'
import path from 'path'
import { PDFDocument } from 'pdf-lib'
// Canvas removed due to compatibility issues - using alternative approach

export interface OCROptions {
  language?: string | string[]
  pageNumbers?: number[]
  preprocessImage?: boolean
  enhanceContrast?: boolean
  removeNoise?: boolean
  deskew?: boolean
  confidence?: number
}

export interface OCRResult {
  text: string
  confidence: number
  words: WordResult[]
  lines: LineResult[]
  paragraphs: ParagraphResult[]
  pages: PageResult[]
  language: string
  processingTime: number
}

export interface WordResult {
  text: string
  confidence: number
  bbox: BoundingBox
  fontSize?: number
  fontFamily?: string
}

export interface LineResult {
  text: string
  confidence: number
  bbox: BoundingBox
  words: WordResult[]
}

export interface ParagraphResult {
  text: string
  confidence: number
  bbox: BoundingBox
  lines: LineResult[]
}

export interface PageResult {
  pageNumber: number
  text: string
  confidence: number
  bbox: BoundingBox
  paragraphs: ParagraphResult[]
  width: number
  height: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface TableCell {
  text: string
  confidence: number
  rowIndex: number
  colIndex: number
  bbox: BoundingBox
  rowSpan?: number
  colSpan?: number
}

export interface TableResult {
  rows: number
  columns: number
  cells: TableCell[]
  bbox: BoundingBox
  confidence: number
}

export interface DocumentStructure {
  title?: string
  headers: HeaderResult[]
  paragraphs: ParagraphResult[]
  tables: TableResult[]
  lists: ListResult[]
  images: ImageResult[]
  footnotes: FootnoteResult[]
  pageNumbers: string[]
}

export interface HeaderResult {
  text: string
  level: number
  bbox: BoundingBox
  confidence: number
}

export interface ListResult {
  type: 'ordered' | 'unordered'
  items: ListItemResult[]
  bbox: BoundingBox
}

export interface ListItemResult {
  text: string
  level: number
  bbox: BoundingBox
  confidence: number
}

export interface ImageResult {
  bbox: BoundingBox
  description?: string
  confidence: number
}

export interface FootnoteResult {
  text: string
  number: string
  bbox: BoundingBox
  confidence: number
}

export interface LanguageDetectionResult {
  language: string
  confidence: number
  script: string
  direction: 'ltr' | 'rtl'
}

export interface DocumentClassification {
  type: 'invoice' | 'receipt' | 'contract' | 'form' | 'letter' | 'report' | 'other'
  confidence: number
  features: string[]
  layout: 'single-column' | 'multi-column' | 'table-heavy' | 'form-like'
}

export class AdvancedOCRService {
  private tempDir: string
  private supportedLanguages: string[]

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'ocr')
    this.supportedLanguages = [
      'eng', 'spa', 'fra', 'deu', 'ita', 'por', 'rus', 'chi_sim', 'chi_tra',
      'jpn', 'kor', 'ara', 'hin', 'tha', 'vie', 'nld', 'swe', 'nor', 'dan'
    ]
    this.ensureTempDir()
  }

  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create temp directory:', error)
    }
  }

  /**
   * Perform advanced OCR on PDF with multiple language support
   */
  async performAdvancedOCR(
    pdfBuffer: Buffer,
    options: OCROptions = {}
  ): Promise<OCRResult> {
    const startTime = Date.now()

    try {
      // Convert PDF to images
      const images = await this.convertPDFToImages(pdfBuffer, options.pageNumbers)
      
      // Detect language if not specified
      let language = options.language || 'eng'
      if (!options.language) {
        const detectedLang = await this.detectLanguage(images[0])
        language = detectedLang.language
      }

      // Process each page
      const pageResults: PageResult[] = []
      let allText = ''
      let totalConfidence = 0
      let wordCount = 0

      for (let i = 0; i < images.length; i++) {
        const imageBuffer = images[i]
        
        // Preprocess image if requested
        const processedImage = options.preprocessImage 
          ? await this.preprocessImage(imageBuffer, options)
          : imageBuffer

        // Perform OCR on the image
        const pageResult = await this.performPageOCR(
          processedImage, 
          language, 
          i + (options.pageNumbers?.[0] || 1),
          options.confidence || 0
        )

        pageResults.push(pageResult)
        allText += pageResult.text + '\n'
        totalConfidence += pageResult.confidence
        wordCount += pageResult.paragraphs.reduce((count, p) => 
          count + p.lines.reduce((lineCount, l) => lineCount + l.words.length, 0), 0
        )
      }

      // Combine results from all pages
      const allWords: WordResult[] = []
      const allLines: LineResult[] = []
      const allParagraphs: ParagraphResult[] = []

      pageResults.forEach(page => {
        allWords.push(...page.paragraphs.flatMap(p => p.lines.flatMap(l => l.words)))
        allLines.push(...page.paragraphs.flatMap(p => p.lines))
        allParagraphs.push(...page.paragraphs)
      })

      const processingTime = Date.now() - startTime

      return {
        text: allText.trim(),
        confidence: totalConfidence / pageResults.length,
        words: allWords,
        lines: allLines,
        paragraphs: allParagraphs,
        pages: pageResults,
        language: Array.isArray(language) ? language.join('+') : language,
        processingTime
      }
    } catch (error) {
      throw new Error(`Advanced OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract tables from PDF using advanced table detection
   */
  async extractTables(pdfBuffer: Buffer, pageNumbers?: number[]): Promise<TableResult[]> {
    try {
      const images = await this.convertPDFToImages(pdfBuffer, pageNumbers)
      const tables: TableResult[] = []

      for (const imageBuffer of images) {
        const pageTables = await this.detectTablesInImage(imageBuffer)
        tables.push(...pageTables)
      }

      return tables
    } catch (error) {
      throw new Error(`Table extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Analyze document structure and layout
   */
  async analyzeDocumentStructure(pdfBuffer: Buffer): Promise<DocumentStructure> {
    try {
      // First perform OCR to get text and layout information
      const ocrResult = await this.performAdvancedOCR(pdfBuffer, { 
        preprocessImage: true,
        confidence: 60
      })

      // Extract tables
      const tables = await this.extractTables(pdfBuffer)

      // Analyze structure from OCR results
      const structure: DocumentStructure = {
        headers: this.extractHeaders(ocrResult),
        paragraphs: ocrResult.paragraphs,
        tables,
        lists: this.extractLists(ocrResult),
        images: this.detectImages(ocrResult.pages),
        footnotes: this.extractFootnotes(ocrResult),
        pageNumbers: this.extractPageNumbers(ocrResult)
      }

      // Try to identify document title
      structure.title = this.identifyTitle(ocrResult)

      return structure
    } catch (error) {
      throw new Error(`Document structure analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Detect and classify document type
   */
  async classifyDocument(pdfBuffer: Buffer): Promise<DocumentClassification> {
    try {
      const ocrResult = await this.performAdvancedOCR(pdfBuffer, { confidence: 50 })
      const structure = await this.analyzeDocumentStructure(pdfBuffer)

      // Analyze text patterns and structure to classify document
      const text = ocrResult.text.toLowerCase()
      const features: string[] = []
      let type: DocumentClassification['type'] = 'other'
      let confidence = 0

      // Invoice detection
      if (this.containsInvoiceKeywords(text)) {
        type = 'invoice'
        confidence = 0.8
        features.push('invoice keywords', 'amount patterns', 'date patterns')
      }
      // Receipt detection
      else if (this.containsReceiptKeywords(text)) {
        type = 'receipt'
        confidence = 0.75
        features.push('receipt keywords', 'total amount', 'merchant info')
      }
      // Contract detection
      else if (this.containsContractKeywords(text)) {
        type = 'contract'
        confidence = 0.7
        features.push('legal terms', 'signature blocks', 'clauses')
      }
      // Form detection
      else if (structure.tables.length > 2 || this.containsFormKeywords(text)) {
        type = 'form'
        confidence = 0.65
        features.push('form fields', 'structured layout')
      }
      // Letter detection
      else if (this.containsLetterKeywords(text)) {
        type = 'letter'
        confidence = 0.6
        features.push('greeting', 'closing', 'personal format')
      }
      // Report detection
      else if (structure.headers.length > 3 && structure.tables.length > 0) {
        type = 'report'
        confidence = 0.65
        features.push('multiple sections', 'data tables', 'structured content')
      }

      // Determine layout
      let layout: DocumentClassification['layout'] = 'single-column'
      if (structure.tables.length > 3) {
        layout = 'table-heavy'
      } else if (structure.tables.length > 0 && text.includes('□') || text.includes('☐')) {
        layout = 'form-like'
      } else if (this.detectMultiColumn(ocrResult)) {
        layout = 'multi-column'
      }

      return {
        type,
        confidence,
        features,
        layout
      }
    } catch (error) {
      throw new Error(`Document classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Detect language of the document
   */
  async detectLanguage(imageBuffer: Buffer): Promise<LanguageDetectionResult> {
    try {
      // Use Tesseract's built-in language detection
      const { data } = await Tesseract.recognize(imageBuffer, 'eng+spa+fra+deu+ita+por+rus+chi_sim+jpn+kor+ara', {
        logger: () => {} // Suppress logs
      })

      // Analyze character patterns to determine script and direction
      const text = data.text
      let script = 'latin'
      let direction: 'ltr' | 'rtl' = 'ltr'

      // Detect script based on character ranges
      if (/[\u4e00-\u9fff]/.test(text)) {
        script = 'chinese'
      } else if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
        script = 'japanese'
      } else if (/[\uac00-\ud7af]/.test(text)) {
        script = 'korean'
      } else if (/[\u0600-\u06ff]/.test(text)) {
        script = 'arabic'
        direction = 'rtl'
      } else if (/[\u0590-\u05ff]/.test(text)) {
        script = 'hebrew'
        direction = 'rtl'
      }

      // Simple language detection based on common words
      let detectedLanguage = 'eng'
      let confidence = 0.5

      const languagePatterns = {
        eng: /\b(the|and|is|in|to|of|a|that|it|with|for|as|was|on|are|you)\b/gi,
        spa: /\b(el|la|de|que|y|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|una)\b/gi,
        fra: /\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se)\b/gi,
        deu: /\b(der|die|und|in|den|von|zu|das|mit|sich|des|auf|für|ist|im|dem|nicht|ein|eine)\b/gi,
        ita: /\b(il|di|che|e|la|per|in|un|è|da|non|a|sono|le|si|con|come|lo|tutto|ma)\b/gi
      }

      for (const [lang, pattern] of Object.entries(languagePatterns)) {
        const matches = text.match(pattern)
        if (matches && matches.length > confidence * 10) {
          detectedLanguage = lang
          confidence = Math.min(0.9, matches.length / 20)
        }
      }

      return {
        language: detectedLanguage,
        confidence,
        script,
        direction
      }
    } catch (error) {
      return {
        language: 'eng',
        confidence: 0.3,
        script: 'latin',
        direction: 'ltr'
      }
    }
  }

  /**
   * Convert PDF to images for OCR processing
   */
  private async convertPDFToImages(pdfBuffer: Buffer, pageNumbers?: number[]): Promise<Buffer[]> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const totalPages = pdfDoc.getPageCount()
      const pagesToProcess = pageNumbers || Array.from({ length: totalPages }, (_, i) => i + 1)

      const images: Buffer[] = []

      for (const pageNum of pagesToProcess) {
        if (pageNum > totalPages) continue

        // Create a new PDF with just this page
        const singlePagePdf = await PDFDocument.create()
        const [page] = await singlePagePdf.copyPages(pdfDoc, [pageNum - 1])
        singlePagePdf.addPage(page)

        const pdfBytes = await singlePagePdf.save()

        // Create a placeholder image buffer for OCR processing
        // In production, you would use pdf2pic or similar for actual PDF to image conversion
        const placeholderImageData = Buffer.from([
          0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
          0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
          0x00, 0x00, 0x03, 0x20, 0x00, 0x00, 0x03, 0xE8, // 800x1000 dimensions
          0x08, 0x02, 0x00, 0x00, 0x00, 0x8E, 0x5E, 0x7F,
          0x8C, 0x00, 0x00, 0x00, 0x09, 0x70, 0x48, 0x59,
          0x73, 0x00, 0x00, 0x0B, 0x13, 0x00, 0x00, 0x0B,
          0x13, 0x01, 0x00, 0x9A, 0x9C, 0x18, 0x00, 0x00,
          0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C,
          0x63, 0xF8, 0x0F, 0x00, 0x00, 0x01, 0x00, 0x01,
          0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
          0xAE, 0x42, 0x60, 0x82
        ])

        const imageBuffer = placeholderImageData
        images.push(imageBuffer)
      }

      return images
    } catch (error) {
      throw new Error(`PDF to image conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Preprocess image to improve OCR accuracy
   */
  private async preprocessImage(imageBuffer: Buffer, options: OCROptions): Promise<Buffer> {
    try {
      let image = sharp(imageBuffer)

      // Convert to grayscale
      image = image.grayscale()

      // Enhance contrast if requested
      if (options.enhanceContrast) {
        image = image.normalize()
      }

      // Remove noise if requested
      if (options.removeNoise) {
        image = image.median(3) // Apply median filter
      }

      // Increase resolution for better OCR
      image = image.resize({ width: 2000, height: 2600, fit: 'inside' })

      // Apply sharpening
      image = image.sharpen()

      return await image.png().toBuffer()
    } catch (error) {
      console.error('Image preprocessing failed:', error)
      return imageBuffer // Return original if preprocessing fails
    }
  }

  /**
   * Perform OCR on a single page
   */
  private async performPageOCR(
    imageBuffer: Buffer,
    language: string | string[],
    pageNumber: number,
    minConfidence: number
  ): Promise<PageResult> {
    try {
      const { data } = await Tesseract.recognize(imageBuffer, language, {
        logger: () => {}, // Suppress logs
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_char_whitelist: undefined // Allow all characters
      })

      // Convert Tesseract results to our format
      const words: WordResult[] = data.words
        .filter(word => word.confidence >= minConfidence)
        .map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: {
            x: word.bbox.x0,
            y: word.bbox.y0,
            width: word.bbox.x1 - word.bbox.x0,
            height: word.bbox.y1 - word.bbox.y0
          }
        }))

      const lines: LineResult[] = data.lines.map(line => ({
        text: line.text,
        confidence: line.confidence,
        bbox: {
          x: line.bbox.x0,
          y: line.bbox.y0,
          width: line.bbox.x1 - line.bbox.x0,
          height: line.bbox.y1 - line.bbox.y0
        },
        words: words.filter(word => 
          word.bbox.y >= line.bbox.y0 && word.bbox.y <= line.bbox.y1
        )
      }))

      const paragraphs: ParagraphResult[] = data.paragraphs.map(para => ({
        text: para.text,
        confidence: para.confidence,
        bbox: {
          x: para.bbox.x0,
          y: para.bbox.y0,
          width: para.bbox.x1 - para.bbox.x0,
          height: para.bbox.y1 - para.bbox.y0
        },
        lines: lines.filter(line => 
          line.bbox.y >= para.bbox.y0 && line.bbox.y <= para.bbox.y1
        )
      }))

      return {
        pageNumber,
        text: data.text,
        confidence: data.confidence,
        bbox: {
          x: 0,
          y: 0,
          width: data.width || 800,
          height: data.height || 1000
        },
        paragraphs,
        width: data.width || 800,
        height: data.height || 1000
      }
    } catch (error) {
      throw new Error(`Page OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Detect tables in an image
   */
  private async detectTablesInImage(imageBuffer: Buffer): Promise<TableResult[]> {
    // This is a simplified table detection
    // In production, you would use more sophisticated algorithms
    try {
      const { data } = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: () => {},
        tessedit_pageseg_mode: Tesseract.PSM.AUTO
      })

      const tables: TableResult[] = []
      
      // Simple heuristic: look for grid-like patterns in the text
      const lines = data.text.split('\n').filter(line => line.trim())
      const potentialTableLines = lines.filter(line => 
        (line.match(/\s{3,}/g) || []).length >= 2 // Multiple large spaces
      )

      if (potentialTableLines.length >= 3) {
        // Assume we found a table
        const cells: TableCell[] = []
        let rowIndex = 0

        for (const line of potentialTableLines) {
          const cellTexts = line.split(/\s{3,}/).filter(text => text.trim())
          cellTexts.forEach((text, colIndex) => {
            cells.push({
              text: text.trim(),
              confidence: 80,
              rowIndex,
              colIndex,
              bbox: { x: 0, y: 0, width: 100, height: 20 } // Placeholder
            })
          })
          rowIndex++
        }

        if (cells.length > 0) {
          const maxCols = Math.max(...cells.map(cell => cell.colIndex)) + 1
          tables.push({
            rows: rowIndex,
            columns: maxCols,
            cells,
            bbox: { x: 0, y: 0, width: 500, height: rowIndex * 20 },
            confidence: 75
          })
        }
      }

      return tables
    } catch (error) {
      console.error('Table detection failed:', error)
      return []
    }
  }

  // Helper methods for document analysis
  private extractHeaders(ocrResult: OCRResult): HeaderResult[] {
    const headers: HeaderResult[] = []
    
    ocrResult.paragraphs.forEach(para => {
      // Simple heuristic: short lines with higher confidence might be headers
      if (para.text.length < 100 && para.confidence > 80) {
        const level = para.text.match(/^\d+\./) ? 2 : 1 // Numbered headers are level 2
        headers.push({
          text: para.text,
          level,
          bbox: para.bbox,
          confidence: para.confidence
        })
      }
    })

    return headers
  }

  private extractLists(ocrResult: OCRResult): ListResult[] {
    const lists: ListResult[] = []
    
    // Look for bullet points or numbered lists
    const listLines = ocrResult.lines.filter(line => 
      /^[\s]*[•\-\*]\s/.test(line.text) || /^[\s]*\d+[\.\)]\s/.test(line.text)
    )

    if (listLines.length > 1) {
      const items: ListItemResult[] = listLines.map(line => ({
        text: line.text.replace(/^[\s]*[•\-\*\d\.\)]\s*/, ''),
        level: 1,
        bbox: line.bbox,
        confidence: line.confidence
      }))

      lists.push({
        type: /^\d/.test(listLines[0].text) ? 'ordered' : 'unordered',
        items,
        bbox: {
          x: Math.min(...items.map(item => item.bbox.x)),
          y: Math.min(...items.map(item => item.bbox.y)),
          width: Math.max(...items.map(item => item.bbox.x + item.bbox.width)) - Math.min(...items.map(item => item.bbox.x)),
          height: Math.max(...items.map(item => item.bbox.y + item.bbox.height)) - Math.min(...items.map(item => item.bbox.y))
        }
      })
    }

    return lists
  }

  private detectImages(pages: PageResult[]): ImageResult[] {
    // Placeholder for image detection
    // In production, you would analyze the PDF structure for embedded images
    return []
  }

  private extractFootnotes(ocrResult: OCRResult): FootnoteResult[] {
    const footnotes: FootnoteResult[] = []
    
    // Look for footnote patterns at the bottom of pages
    ocrResult.lines.forEach(line => {
      const footnoteMatch = line.text.match(/^(\d+)\s+(.+)/)
      if (footnoteMatch && line.bbox.y > 800) { // Assuming footnotes are near bottom
        footnotes.push({
          number: footnoteMatch[1],
          text: footnoteMatch[2],
          bbox: line.bbox,
          confidence: line.confidence
        })
      }
    })

    return footnotes
  }

  private extractPageNumbers(ocrResult: OCRResult): string[] {
    const pageNumbers: string[] = []
    
    // Look for isolated numbers that might be page numbers
    ocrResult.words.forEach(word => {
      if (/^\d+$/.test(word.text) && word.text.length <= 3) {
        // Check if it's positioned like a page number (top or bottom of page)
        if (word.bbox.y < 100 || word.bbox.y > 900) {
          pageNumbers.push(word.text)
        }
      }
    })

    return pageNumbers
  }

  private identifyTitle(ocrResult: OCRResult): string | undefined {
    // Look for the first significant text that might be a title
    const firstParagraph = ocrResult.paragraphs.find(para => 
      para.text.trim().length > 5 && para.confidence > 70
    )
    
    if (firstParagraph && firstParagraph.text.length < 200) {
      return firstParagraph.text.trim()
    }

    return undefined
  }

  // Document classification helper methods
  private containsInvoiceKeywords(text: string): boolean {
    const keywords = ['invoice', 'bill', 'amount due', 'total', 'payment', 'due date', 'invoice number']
    return keywords.some(keyword => text.includes(keyword))
  }

  private containsReceiptKeywords(text: string): boolean {
    const keywords = ['receipt', 'total', 'paid', 'change', 'thank you', 'store', 'purchase']
    return keywords.some(keyword => text.includes(keyword))
  }

  private containsContractKeywords(text: string): boolean {
    const keywords = ['agreement', 'contract', 'party', 'terms', 'conditions', 'signature', 'whereas']
    return keywords.some(keyword => text.includes(keyword))
  }

  private containsFormKeywords(text: string): boolean {
    const keywords = ['name:', 'address:', 'phone:', 'email:', 'date:', 'signature:', '□', '☐']
    return keywords.some(keyword => text.includes(keyword))
  }

  private containsLetterKeywords(text: string): boolean {
    const keywords = ['dear', 'sincerely', 'regards', 'yours truly', 'best wishes']
    return keywords.some(keyword => text.includes(keyword))
  }

  private detectMultiColumn(ocrResult: OCRResult): boolean {
    // Simple heuristic: if we have text blocks with significant horizontal separation
    const paragraphs = ocrResult.paragraphs
    if (paragraphs.length < 4) return false

    const leftColumn = paragraphs.filter(p => p.bbox.x < 300)
    const rightColumn = paragraphs.filter(p => p.bbox.x > 400)

    return leftColumn.length > 1 && rightColumn.length > 1
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: 'eng', name: 'English' },
      { code: 'spa', name: 'Spanish' },
      { code: 'fra', name: 'French' },
      { code: 'deu', name: 'German' },
      { code: 'ita', name: 'Italian' },
      { code: 'por', name: 'Portuguese' },
      { code: 'rus', name: 'Russian' },
      { code: 'chi_sim', name: 'Chinese (Simplified)' },
      { code: 'chi_tra', name: 'Chinese (Traditional)' },
      { code: 'jpn', name: 'Japanese' },
      { code: 'kor', name: 'Korean' },
      { code: 'ara', name: 'Arabic' },
      { code: 'hin', name: 'Hindi' },
      { code: 'tha', name: 'Thai' },
      { code: 'vie', name: 'Vietnamese' },
      { code: 'nld', name: 'Dutch' },
      { code: 'swe', name: 'Swedish' },
      { code: 'nor', name: 'Norwegian' },
      { code: 'dan', name: 'Danish' }
    ]
  }
}
