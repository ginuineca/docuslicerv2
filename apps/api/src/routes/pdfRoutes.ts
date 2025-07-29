import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { PDFService, SplitRange } from '../services/pdfService'
import { OCRService } from '../services/ocrService'
import { AIService } from '../services/aiService'
import { z } from 'zod'

const router = express.Router()
const pdfService = new PDFService()
const ocrService = new OCRService()
const aiService = new AIService()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp')
    await fs.mkdir(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

// Validation schemas
const splitRequestSchema = z.object({
  fileId: z.string().min(1),
  ranges: z.array(z.object({
    start: z.number().min(1),
    end: z.number().min(1),
    name: z.string().min(1)
  }))
})

const mergeRequestSchema = z.object({
  outputName: z.string().min(1),
  preserveBookmarks: z.boolean().optional(),
  addPageNumbers: z.boolean().optional()
})

const extractRequestSchema = z.object({
  pages: z.array(z.number().min(1)),
  outputName: z.string().min(1)
})

const fillFormRequestSchema = z.object({
  filePath: z.string().min(1),
  formData: z.record(z.union([z.string(), z.boolean()])),
  outputName: z.string().min(1),
  flatten: z.boolean().optional()
})

/**
 * Upload and validate PDF file
 */
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' })
    }

    // Validate the PDF
    const isValid = await pdfService.validatePDF(req.file.path)
    if (!isValid) {
      await fs.unlink(req.file.path) // Clean up invalid file
      return res.status(400).json({ error: 'Invalid PDF file' })
    }

    // Get PDF information
    const pdfInfo = await pdfService.getPDFInfo(req.file.path)

    res.json({
      success: true,
      fileId: path.basename(req.file.path, path.extname(req.file.path)),
      info: {
        pages: pdfInfo.pages,
        size: req.file.size,
        title: pdfInfo.title,
        author: pdfInfo.author,
        creationDate: pdfInfo.creationDate
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    
    // Clean up file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path)
      } catch (cleanupError) {
        console.warn('Failed to cleanup file:', cleanupError)
      }
    }

    res.status(500).json({ 
      error: 'Failed to process PDF upload',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Split PDF into multiple files
 */
router.post('/split', async (req, res) => {
  try {
    const { fileId, ranges } = splitRequestSchema.parse(req.body)

    // Construct file path from fileId
    const filePath = path.join(process.cwd(), 'uploads', 'temp', `${fileId}.pdf`)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: 'PDF file not found' })
    }

    const outputDir = path.join(process.cwd(), 'uploads', 'output', Date.now().toString())
    
    const outputFiles = await pdfService.splitPDF(filePath, {
      ranges: ranges as SplitRange[],
      outputDir
    })

    // Get file information for each output file
    const results = await Promise.all(
      outputFiles.map(async (filePath, index) => {
        const stats = await fs.stat(filePath)
        const pdfInfo = await pdfService.getPDFInfo(filePath)
        const fileName = path.basename(filePath)

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: fileName,
          status: 'completed' as const,
          progress: 100,
          downloadUrl: `/api/pdf/download/${encodeURIComponent(fileName)}`,
          pages: pdfInfo.pageCount,
          size: stats.size
        }
      })
    )

    res.json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Split error:', error)
    res.status(500).json({ 
      error: 'Failed to split PDF',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Merge multiple PDFs into one file
 */
router.post('/merge', upload.array('pdfs', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length < 2) {
      return res.status(400).json({ error: 'At least 2 PDF files are required for merging' })
    }

    const { outputName, preserveBookmarks, addPageNumbers } = mergeRequestSchema.parse(req.body)
    
    // Validate all uploaded PDFs
    for (const file of req.files) {
      const isValid = await pdfService.validatePDF(file.path)
      if (!isValid) {
        // Clean up all files
        await pdfService.cleanupFiles(req.files.map(f => f.path))
        return res.status(400).json({ error: `Invalid PDF file: ${file.originalname}` })
      }
    }

    const outputDir = path.join(process.cwd(), 'uploads', 'output', Date.now().toString())
    const inputPaths = req.files.map(file => file.path)

    const outputPath = await pdfService.mergePDFs(inputPaths, {
      outputName,
      preserveBookmarks,
      addPageNumbers,
      outputDir
    })

    // Get merged file information
    const stats = await fs.stat(outputPath)
    const pdfInfo = await pdfService.getPDFInfo(outputPath)

    // Clean up input files
    await pdfService.cleanupFiles(inputPaths)

    res.json({
      success: true,
      message: `${req.files.length} PDFs merged successfully`,
      file: {
        name: path.basename(outputPath),
        path: outputPath,
        size: stats.size,
        pages: pdfInfo.pageCount,
        downloadUrl: `/api/pdf/download/${encodeURIComponent(path.basename(outputPath))}`
      }
    })
  } catch (error) {
    console.error('Merge error:', error)
    
    // Clean up files
    if (req.files && Array.isArray(req.files)) {
      await pdfService.cleanupFiles(req.files.map(f => f.path))
    }

    res.status(500).json({ 
      error: 'Failed to merge PDFs',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Extract specific pages from PDF
 */
router.post('/extract', async (req, res) => {
  try {
    const { filePath, pages, outputName } = extractRequestSchema.parse(req.body)
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' })
    }

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: 'PDF file not found' })
    }

    const outputDir = path.join(process.cwd(), 'uploads', 'output', Date.now().toString())
    const outputPath = path.join(outputDir, `${outputName}.pdf`)

    await pdfService.extractPages(filePath, pages, outputPath)

    // Get extracted file information
    const stats = await fs.stat(outputPath)
    const pdfInfo = await pdfService.getPDFInfo(outputPath)

    res.json({
      success: true,
      message: `Extracted ${pages.length} pages successfully`,
      file: {
        name: path.basename(outputPath),
        path: outputPath,
        size: stats.size,
        pages: pdfInfo.pageCount,
        downloadUrl: `/api/pdf/download/${encodeURIComponent(path.basename(outputPath))}`
      }
    })
  } catch (error) {
    console.error('Extract error:', error)
    res.status(500).json({ 
      error: 'Failed to extract pages',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Download processed PDF file
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename)
    
    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    // Look for file in output directories
    const outputBaseDir = path.join(process.cwd(), 'uploads', 'output')
    const dirs = await fs.readdir(outputBaseDir)
    
    let filePath: string | null = null
    for (const dir of dirs) {
      const potentialPath = path.join(outputBaseDir, dir, filename)
      try {
        await fs.access(potentialPath)
        filePath = potentialPath
        break
      } catch {
        // File not in this directory, continue searching
      }
    }

    if (!filePath) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    // Stream the file
    const fileStream = await fs.readFile(filePath)
    res.send(fileStream)
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ 
      error: 'Failed to download file',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Get PDF information
 */
router.get('/info/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename)
    
    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    // Look for file in temp uploads
    const tempDir = path.join(process.cwd(), 'uploads', 'temp')
    const filePath = path.join(tempDir, filename + '.pdf')

    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: 'PDF file not found' })
    }

    const pdfInfo = await pdfService.getPDFInfo(filePath)
    const stats = await fs.stat(filePath)

    res.json({
      success: true,
      info: {
        ...pdfInfo,
        size: stats.size,
        filename: filename + '.pdf'
      }
    })
  } catch (error) {
    console.error('Info error:', error)
    res.status(500).json({ 
      error: 'Failed to get PDF information',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Detect form fields in a PDF
 */
router.post('/detect-form', async (req, res) => {
  try {
    const { filePath } = req.body

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' })
    }

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: 'PDF file not found' })
    }

    const formInfo = await pdfService.detectFormFields(filePath)

    res.json({
      success: true,
      hasForm: formInfo.hasForm,
      fields: formInfo.fields,
      fieldCount: formInfo.fields.length
    })
  } catch (error) {
    console.error('Form detection error:', error)
    res.status(500).json({
      error: 'Failed to detect form fields',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Fill form fields in a PDF
 */
router.post('/fill-form', async (req, res) => {
  try {
    const { filePath, formData, outputName, flatten } = fillFormRequestSchema.parse(req.body)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: 'PDF file not found' })
    }

    const outputDir = path.join(process.cwd(), 'uploads', 'output', Date.now().toString())
    const outputPath = path.join(outputDir, `${outputName}.pdf`)

    const filledPdfPath = await pdfService.fillFormFields(filePath, formData, outputPath, flatten)

    // Get filled file information
    const stats = await fs.stat(filledPdfPath)
    const pdfInfo = await pdfService.getPDFInfo(filledPdfPath)

    res.json({
      success: true,
      message: 'Form filled successfully',
      file: {
        name: path.basename(filledPdfPath),
        path: filledPdfPath,
        size: stats.size,
        pages: pdfInfo.pageCount,
        downloadUrl: `/api/pdf/download/${encodeURIComponent(path.basename(filledPdfPath))}`
      },
      fieldsProcessed: Object.keys(formData).length,
      flattened: flatten || false
    })
  } catch (error) {
    console.error('Form filling error:', error)
    res.status(500).json({
      error: 'Failed to fill form',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Extract form data from a filled PDF
 */
router.post('/extract-form-data', async (req, res) => {
  try {
    const { filePath } = req.body

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' })
    }

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: 'PDF file not found' })
    }

    const formData = await pdfService.extractFormData(filePath)

    res.json({
      success: true,
      formData,
      fieldCount: Object.keys(formData).length
    })
  } catch (error) {
    console.error('Form data extraction error:', error)
    res.status(500).json({
      error: 'Failed to extract form data',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Extract text from PDF using OCR
 */
router.post('/ocr-extract', async (req, res) => {
  try {
    const { filePath, pages, density } = req.body

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' })
    }

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: 'PDF file not found' })
    }

    const ocrResult = await ocrService.extractTextFromPDF(filePath, {
      pages: pages ? pages : undefined,
      density: density || 200
    })

    res.json({
      success: true,
      result: {
        fullText: ocrResult.fullText,
        totalPages: ocrResult.totalPages,
        averageConfidence: Math.round(ocrResult.averageConfidence),
        pages: ocrResult.pages.map(page => ({
          pageNumber: page.pageNumber,
          text: page.text,
          confidence: Math.round(page.confidence),
          wordCount: page.text.split(/\s+/).filter(word => word.length > 0).length
        }))
      },
      stats: {
        totalWords: ocrResult.fullText.split(/\s+/).filter(word => word.length > 0).length,
        totalCharacters: ocrResult.fullText.length,
        processingTime: 'N/A' // Could be tracked if needed
      }
    })
  } catch (error) {
    console.error('OCR extraction error:', error)
    res.status(500).json({
      error: 'Failed to extract text using OCR',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Extract text from image using OCR
 */
router.post('/ocr-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' })
    }

    const ocrResult = await ocrService.extractTextFromImage(req.file.path)
    const stats = ocrService.getOCRStats(ocrResult)

    // Clean up uploaded file
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      result: {
        text: ocrResult.text,
        confidence: Math.round(ocrResult.confidence),
        words: ocrResult.words.map(word => ({
          text: word.text,
          confidence: Math.round(word.confidence),
          bbox: word.bbox
        })),
        lines: ocrResult.lines.map(line => ({
          text: line.text,
          confidence: Math.round(line.confidence)
        }))
      },
      stats: {
        wordCount: stats.wordCount,
        lineCount: stats.lineCount,
        paragraphCount: stats.paragraphCount,
        averageWordConfidence: Math.round(stats.averageWordConfidence),
        lowConfidenceWords: stats.lowConfidenceWords
      }
    })
  } catch (error) {
    console.error('Image OCR error:', error)

    // Clean up file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path)
      } catch (cleanupError) {
        console.warn('Failed to cleanup file:', cleanupError)
      }
    }

    res.status(500).json({
      error: 'Failed to extract text from image',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Search for text in PDF using OCR
 */
router.post('/ocr-search', async (req, res) => {
  try {
    const { filePath, searchTerms, pages } = req.body

    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'File path is required' })
    }

    if (!searchTerms || !Array.isArray(searchTerms) || searchTerms.length === 0) {
      return res.status(400).json({ error: 'Search terms are required' })
    }

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: 'PDF file not found' })
    }

    // First extract text from PDF
    const ocrResult = await ocrService.extractTextFromPDF(filePath, {
      pages: pages ? pages : undefined
    })

    // Search for terms in the extracted text
    const searchResults = []
    for (const term of searchTerms) {
      const regex = new RegExp(term, 'gi')
      const matches = []

      // Search in each page
      for (const page of ocrResult.pages) {
        const pageMatches = [...page.text.matchAll(regex)]
        for (const match of pageMatches) {
          matches.push({
            pageNumber: page.pageNumber,
            text: match[0],
            index: match.index,
            context: page.text.substring(
              Math.max(0, match.index! - 50),
              Math.min(page.text.length, match.index! + match[0].length + 50)
            )
          })
        }
      }

      searchResults.push({
        term,
        found: matches.length > 0,
        matchCount: matches.length,
        matches
      })
    }

    res.json({
      success: true,
      searchResults,
      totalMatches: searchResults.reduce((sum, result) => sum + result.matchCount, 0),
      pagesProcessed: ocrResult.totalPages
    })
  } catch (error) {
    console.error('OCR search error:', error)
    res.status(500).json({
      error: 'Failed to search text in PDF',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * AI-powered document classification
 */
router.post('/ai-classify', async (req, res) => {
  try {
    const { text, filePath } = req.body

    let documentText = text

    // If filePath is provided, extract text first
    if (filePath && !text) {
      try {
        await fs.access(filePath)
        const ocrResult = await ocrService.extractTextFromPDF(filePath)
        documentText = ocrResult.fullText
      } catch {
        return res.status(404).json({ error: 'PDF file not found' })
      }
    }

    if (!documentText) {
      return res.status(400).json({ error: 'Text content or file path is required' })
    }

    const classification = await aiService.classifyDocument(documentText)

    res.json({
      success: true,
      classification,
      capabilities: aiService.getCapabilities()
    })
  } catch (error) {
    console.error('AI classification error:', error)
    res.status(500).json({
      error: 'Failed to classify document',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * AI-powered document summarization
 */
router.post('/ai-summarize', async (req, res) => {
  try {
    const { text, filePath } = req.body

    let documentText = text

    // If filePath is provided, extract text first
    if (filePath && !text) {
      try {
        await fs.access(filePath)
        const ocrResult = await ocrService.extractTextFromPDF(filePath)
        documentText = ocrResult.fullText
      } catch {
        return res.status(404).json({ error: 'PDF file not found' })
      }
    }

    if (!documentText) {
      return res.status(400).json({ error: 'Text content or file path is required' })
    }

    const summary = await aiService.summarizeDocument(documentText)

    res.json({
      success: true,
      summary,
      capabilities: aiService.getCapabilities()
    })
  } catch (error) {
    console.error('AI summarization error:', error)
    res.status(500).json({
      error: 'Failed to summarize document',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * AI-powered intelligent data extraction
 */
router.post('/ai-extract', async (req, res) => {
  try {
    const { text, filePath } = req.body

    let documentText = text

    // If filePath is provided, extract text first
    if (filePath && !text) {
      try {
        await fs.access(filePath)
        const ocrResult = await ocrService.extractTextFromPDF(filePath)
        documentText = ocrResult.fullText
      } catch {
        return res.status(404).json({ error: 'PDF file not found' })
      }
    }

    if (!documentText) {
      return res.status(400).json({ error: 'Text content or file path is required' })
    }

    const extraction = await aiService.extractIntelligentData(documentText)

    res.json({
      success: true,
      extraction,
      capabilities: aiService.getCapabilities()
    })
  } catch (error) {
    console.error('AI extraction error:', error)
    res.status(500).json({
      error: 'Failed to extract intelligent data',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * AI-powered content analysis
 */
router.post('/ai-analyze', async (req, res) => {
  try {
    const { text, filePath } = req.body

    let documentText = text

    // If filePath is provided, extract text first
    if (filePath && !text) {
      try {
        await fs.access(filePath)
        const ocrResult = await ocrService.extractTextFromPDF(filePath)
        documentText = ocrResult.fullText
      } catch {
        return res.status(404).json({ error: 'PDF file not found' })
      }
    }

    if (!documentText) {
      return res.status(400).json({ error: 'Text content or file path is required' })
    }

    const analysis = await aiService.analyzeContent(documentText)

    res.json({
      success: true,
      analysis,
      capabilities: aiService.getCapabilities()
    })
  } catch (error) {
    console.error('AI analysis error:', error)
    res.status(500).json({
      error: 'Failed to analyze content',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Get AI service capabilities and status
 */
router.get('/ai-capabilities', async (req, res) => {
  try {
    const capabilities = aiService.getCapabilities()
    const isAvailable = aiService.isAvailable()

    res.json({
      success: true,
      available: isAvailable,
      capabilities,
      features: {
        classification: true,
        summarization: true,
        intelligentExtraction: true,
        contentAnalysis: true
      }
    })
  } catch (error) {
    console.error('AI capabilities error:', error)
    res.status(500).json({
      error: 'Failed to get AI capabilities',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
