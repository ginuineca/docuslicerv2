import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { AdvancedOCRService } from '../services/advancedOcrService'
import { z } from 'zod'
import { asyncHandler, validateFile, ValidationError } from '../middleware/errorHandler'

const router = express.Router()
const ocrService = new AdvancedOCRService()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'ocr')
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
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files and images are allowed'))
    }
  }
})

// Validation schemas
const ocrOptionsSchema = z.object({
  language: z.union([z.string(), z.array(z.string())]).optional(),
  pageNumbers: z.array(z.number()).optional(),
  preprocessImage: z.boolean().optional(),
  enhanceContrast: z.boolean().optional(),
  removeNoise: z.boolean().optional(),
  deskew: z.boolean().optional(),
  confidence: z.number().min(0).max(100).optional()
})

/**
 * Perform advanced OCR on PDF or image
 */
router.post('/extract-text',
  upload.single('file'),
  validateFile(['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file uploaded')
    }

    const options = ocrOptionsSchema.parse(req.body)
    
    try {
      const fileBuffer = await fs.readFile(req.file.path)
      const result = await ocrService.performAdvancedOCR(fileBuffer, options)

      // Clean up uploaded file
      await fs.unlink(req.file.path)

      res.json({
        success: true,
        message: 'OCR extraction completed successfully',
        result: {
          text: result.text,
          confidence: result.confidence,
          language: result.language,
          processingTime: result.processingTime,
          statistics: {
            totalWords: result.words.length,
            totalLines: result.lines.length,
            totalParagraphs: result.paragraphs.length,
            totalPages: result.pages.length,
            averageConfidence: result.confidence
          }
        },
        file: {
          name: req.file.originalname,
          size: req.file.size
        }
      })
    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(req.file.path).catch(() => {})
      throw error
    }
  })
)

/**
 * Extract detailed OCR data with layout information
 */
router.post('/extract-detailed',
  upload.single('file'),
  validateFile(['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file uploaded')
    }

    const options = ocrOptionsSchema.parse(req.body)
    
    try {
      const fileBuffer = await fs.readFile(req.file.path)
      const result = await ocrService.performAdvancedOCR(fileBuffer, options)

      // Clean up uploaded file
      await fs.unlink(req.file.path)

      res.json({
        success: true,
        message: 'Detailed OCR extraction completed successfully',
        result: {
          text: result.text,
          confidence: result.confidence,
          language: result.language,
          processingTime: result.processingTime,
          pages: result.pages.map(page => ({
            pageNumber: page.pageNumber,
            text: page.text,
            confidence: page.confidence,
            dimensions: {
              width: page.width,
              height: page.height
            },
            paragraphCount: page.paragraphs.length,
            wordCount: page.paragraphs.reduce((count, p) => 
              count + p.lines.reduce((lineCount, l) => lineCount + l.words.length, 0), 0
            )
          })),
          layout: {
            words: result.words.length,
            lines: result.lines.length,
            paragraphs: result.paragraphs.length
          }
        },
        file: {
          name: req.file.originalname,
          size: req.file.size
        }
      })
    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(req.file.path).catch(() => {})
      throw error
    }
  })
)

/**
 * Extract tables from PDF
 */
router.post('/extract-tables',
  upload.single('file'),
  validateFile(['application/pdf']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No PDF file uploaded')
    }

    const { pageNumbers } = req.body
    const pages = pageNumbers ? JSON.parse(pageNumbers) : undefined

    try {
      const fileBuffer = await fs.readFile(req.file.path)
      const tables = await ocrService.extractTables(fileBuffer, pages)

      // Clean up uploaded file
      await fs.unlink(req.file.path)

      res.json({
        success: true,
        message: 'Table extraction completed successfully',
        tables: tables.map(table => ({
          rows: table.rows,
          columns: table.columns,
          confidence: table.confidence,
          cellCount: table.cells.length,
          data: table.cells.map(cell => ({
            text: cell.text,
            row: cell.rowIndex,
            column: cell.colIndex,
            confidence: cell.confidence
          }))
        })),
        summary: {
          totalTables: tables.length,
          totalCells: tables.reduce((sum, table) => sum + table.cells.length, 0)
        },
        file: {
          name: req.file.originalname,
          size: req.file.size
        }
      })
    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(req.file.path).catch(() => {})
      throw error
    }
  })
)

/**
 * Analyze document structure
 */
router.post('/analyze-structure',
  upload.single('file'),
  validateFile(['application/pdf']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No PDF file uploaded')
    }

    try {
      const fileBuffer = await fs.readFile(req.file.path)
      const structure = await ocrService.analyzeDocumentStructure(fileBuffer)

      // Clean up uploaded file
      await fs.unlink(req.file.path)

      res.json({
        success: true,
        message: 'Document structure analysis completed successfully',
        structure: {
          title: structure.title,
          sections: {
            headers: structure.headers.length,
            paragraphs: structure.paragraphs.length,
            tables: structure.tables.length,
            lists: structure.lists.length,
            images: structure.images.length,
            footnotes: structure.footnotes.length
          },
          details: {
            headers: structure.headers.map(h => ({
              text: h.text,
              level: h.level,
              confidence: h.confidence
            })),
            tables: structure.tables.map(t => ({
              rows: t.rows,
              columns: t.columns,
              confidence: t.confidence
            })),
            lists: structure.lists.map(l => ({
              type: l.type,
              itemCount: l.items.length
            }))
          },
          pageNumbers: structure.pageNumbers
        },
        file: {
          name: req.file.originalname,
          size: req.file.size
        }
      })
    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(req.file.path).catch(() => {})
      throw error
    }
  })
)

/**
 * Classify document type
 */
router.post('/classify-document',
  upload.single('file'),
  validateFile(['application/pdf']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No PDF file uploaded')
    }

    try {
      const fileBuffer = await fs.readFile(req.file.path)
      const classification = await ocrService.classifyDocument(fileBuffer)

      // Clean up uploaded file
      await fs.unlink(req.file.path)

      res.json({
        success: true,
        message: 'Document classification completed successfully',
        classification: {
          type: classification.type,
          confidence: Math.round(classification.confidence * 100),
          layout: classification.layout,
          features: classification.features,
          description: this.getDocumentTypeDescription(classification.type)
        },
        file: {
          name: req.file.originalname,
          size: req.file.size
        }
      })
    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(req.file.path).catch(() => {})
      throw error
    }
  })
)

/**
 * Detect document language
 */
router.post('/detect-language',
  upload.single('file'),
  validateFile(['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No file uploaded')
    }

    try {
      const fileBuffer = await fs.readFile(req.file.path)
      
      // For PDF, convert first page to image, for images use directly
      let imageBuffer = fileBuffer
      if (req.file.mimetype === 'application/pdf') {
        // This would need proper PDF to image conversion
        // For now, we'll use a placeholder
        imageBuffer = fileBuffer
      }

      const languageResult = await ocrService.detectLanguage(imageBuffer)

      // Clean up uploaded file
      await fs.unlink(req.file.path)

      res.json({
        success: true,
        message: 'Language detection completed successfully',
        language: {
          code: languageResult.language,
          name: this.getLanguageName(languageResult.language),
          confidence: Math.round(languageResult.confidence * 100),
          script: languageResult.script,
          direction: languageResult.direction
        },
        file: {
          name: req.file.originalname,
          size: req.file.size
        }
      })
    } catch (error) {
      // Clean up uploaded file on error
      await fs.unlink(req.file.path).catch(() => {})
      throw error
    }
  })
)

/**
 * Get supported languages
 */
router.get('/languages', (req, res) => {
  const languages = ocrService.getSupportedLanguages()
  
  res.json({
    success: true,
    languages,
    count: languages.length,
    popular: [
      { code: 'eng', name: 'English' },
      { code: 'spa', name: 'Spanish' },
      { code: 'fra', name: 'French' },
      { code: 'deu', name: 'German' },
      { code: 'chi_sim', name: 'Chinese (Simplified)' }
    ]
  })
})

/**
 * Get OCR capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    capabilities: {
      ocr: {
        supported: true,
        languages: ocrService.getSupportedLanguages().length,
        features: [
          'Multi-language text extraction',
          'Layout preservation',
          'Confidence scoring',
          'Word-level positioning',
          'Image preprocessing'
        ]
      },
      tableExtraction: {
        supported: true,
        features: [
          'Automatic table detection',
          'Cell-level extraction',
          'Row and column identification',
          'Confidence scoring'
        ]
      },
      documentAnalysis: {
        supported: true,
        features: [
          'Structure analysis',
          'Header detection',
          'List identification',
          'Footnote extraction',
          'Title identification'
        ]
      },
      classification: {
        supported: true,
        types: ['invoice', 'receipt', 'contract', 'form', 'letter', 'report', 'other'],
        features: [
          'Document type detection',
          'Layout analysis',
          'Feature extraction',
          'Confidence scoring'
        ]
      },
      languageDetection: {
        supported: true,
        features: [
          'Automatic language detection',
          'Script identification',
          'Text direction detection',
          'Multi-language support'
        ]
      }
    },
    supportedFormats: ['PDF', 'JPEG', 'PNG', 'TIFF'],
    maxFileSize: '50MB',
    processingTime: 'Varies by document size and complexity'
  })
})

// Helper methods
function getDocumentTypeDescription(type: string): string {
  const descriptions = {
    invoice: 'Business invoice or billing document',
    receipt: 'Purchase receipt or transaction record',
    contract: 'Legal contract or agreement document',
    form: 'Structured form with fields and inputs',
    letter: 'Personal or business correspondence',
    report: 'Structured report with sections and data',
    other: 'General document or unclassified type'
  }
  return descriptions[type as keyof typeof descriptions] || 'Unknown document type'
}

function getLanguageName(code: string): string {
  const languageNames = {
    eng: 'English',
    spa: 'Spanish',
    fra: 'French',
    deu: 'German',
    ita: 'Italian',
    por: 'Portuguese',
    rus: 'Russian',
    chi_sim: 'Chinese (Simplified)',
    chi_tra: 'Chinese (Traditional)',
    jpn: 'Japanese',
    kor: 'Korean',
    ara: 'Arabic',
    hin: 'Hindi',
    tha: 'Thai',
    vie: 'Vietnamese',
    nld: 'Dutch',
    swe: 'Swedish',
    nor: 'Norwegian',
    dan: 'Danish'
  }
  return languageNames[code as keyof typeof languageNames] || 'Unknown'
}

export default router
