import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { PDFSecurityService } from '../services/pdfSecurityService'
import { z } from 'zod'
import { asyncHandler, validateFile, ValidationError } from '../middleware/errorHandler'

const router = express.Router()
const securityService = new PDFSecurityService()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'security')
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
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

// Validation schemas
const passwordProtectionSchema = z.object({
  userPassword: z.string().min(1).optional(),
  ownerPassword: z.string().min(1).optional(),
  permissions: z.object({
    printing: z.boolean().optional(),
    modifying: z.boolean().optional(),
    copying: z.boolean().optional(),
    annotating: z.boolean().optional(),
    fillingForms: z.boolean().optional(),
    contentAccessibility: z.boolean().optional(),
    documentAssembly: z.boolean().optional(),
    highQualityPrinting: z.boolean().optional()
  }).optional()
})

const watermarkSchema = z.object({
  text: z.string().min(1),
  opacity: z.number().min(0).max(1).optional(),
  fontSize: z.number().min(8).max(200).optional(),
  color: z.object({
    r: z.number().min(0).max(1),
    g: z.number().min(0).max(1),
    b: z.number().min(0).max(1)
  }).optional(),
  rotation: z.number().min(-180).max(180).optional(),
  position: z.enum(['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).optional(),
  repeat: z.boolean().optional()
})

const digitalSignatureSchema = z.object({
  signerName: z.string().min(1),
  reason: z.string().optional(),
  location: z.string().optional(),
  contactInfo: z.string().optional()
})

const encryptionSchema = z.object({
  algorithm: z.enum(['AES-256', 'AES-128', 'RC4-128']),
  password: z.string().min(6)
})

/**
 * Add password protection to PDF
 */
router.post('/password-protect', 
  upload.single('pdf'),
  validateFile(['application/pdf']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No PDF file uploaded')
    }

    const options = passwordProtectionSchema.parse(req.body)
    
    if (!options.userPassword && !options.ownerPassword) {
      throw new ValidationError('At least one password (user or owner) is required')
    }

    const pdfBuffer = await fs.readFile(req.file.path)
    const protectedPdf = await securityService.addPasswordProtection(pdfBuffer, options)

    // Save protected PDF
    const outputPath = path.join(path.dirname(req.file.path), `protected_${req.file.filename}`)
    await fs.writeFile(outputPath, protectedPdf)

    // Clean up original file
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      message: 'Password protection added successfully',
      file: {
        name: `protected_${req.file.originalname}`,
        path: outputPath,
        size: protectedPdf.length
      },
      permissions: options.permissions
    })
  })
)

/**
 * Add watermark to PDF
 */
router.post('/watermark',
  upload.single('pdf'),
  validateFile(['application/pdf']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No PDF file uploaded')
    }

    const options = watermarkSchema.parse(req.body)
    
    const pdfBuffer = await fs.readFile(req.file.path)
    const watermarkedPdf = await securityService.addWatermark(pdfBuffer, options)

    // Save watermarked PDF
    const outputPath = path.join(path.dirname(req.file.path), `watermarked_${req.file.filename}`)
    await fs.writeFile(outputPath, watermarkedPdf)

    // Clean up original file
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      message: 'Watermark added successfully',
      file: {
        name: `watermarked_${req.file.originalname}`,
        path: outputPath,
        size: watermarkedPdf.length
      },
      watermark: options
    })
  })
)

/**
 * Add digital signature to PDF
 */
router.post('/digital-signature',
  upload.single('pdf'),
  validateFile(['application/pdf']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No PDF file uploaded')
    }

    const options = digitalSignatureSchema.parse(req.body)
    
    const pdfBuffer = await fs.readFile(req.file.path)
    const signedPdf = await securityService.addDigitalSignature(pdfBuffer, options)

    // Save signed PDF
    const outputPath = path.join(path.dirname(req.file.path), `signed_${req.file.filename}`)
    await fs.writeFile(outputPath, signedPdf)

    // Clean up original file
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      message: 'Digital signature added successfully',
      file: {
        name: `signed_${req.file.originalname}`,
        path: outputPath,
        size: signedPdf.length
      },
      signature: {
        signer: options.signerName,
        timestamp: new Date().toISOString(),
        reason: options.reason,
        location: options.location
      }
    })
  })
)

/**
 * Encrypt PDF with advanced encryption
 */
router.post('/encrypt',
  upload.single('pdf'),
  validateFile(['application/pdf']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No PDF file uploaded')
    }

    const options = encryptionSchema.parse(req.body)
    
    const pdfBuffer = await fs.readFile(req.file.path)
    const { encryptedPdf, key, iv } = await securityService.encryptPDF(pdfBuffer, options)

    // Save encrypted PDF
    const outputPath = path.join(path.dirname(req.file.path), `encrypted_${req.file.filename}`)
    await fs.writeFile(outputPath, encryptedPdf)

    // Clean up original file
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      message: 'PDF encrypted successfully',
      file: {
        name: `encrypted_${req.file.originalname}`,
        path: outputPath,
        size: encryptedPdf.length
      },
      encryption: {
        algorithm: options.algorithm,
        keyHash: key.substring(0, 16) + '...', // Only show partial key for security
        ivHash: iv.substring(0, 16) + '...'
      },
      warning: 'Store the encryption key securely. It cannot be recovered if lost.'
    })
  })
)

/**
 * Decrypt PDF
 */
router.post('/decrypt',
  upload.single('pdf'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No encrypted PDF file uploaded')
    }

    const { password } = req.body
    if (!password) {
      throw new ValidationError('Password is required for decryption')
    }

    const encryptedBuffer = await fs.readFile(req.file.path)
    const decryptedPdf = await securityService.decryptPDF(encryptedBuffer, password)

    // Save decrypted PDF
    const outputPath = path.join(path.dirname(req.file.path), `decrypted_${req.file.filename}`)
    await fs.writeFile(outputPath, decryptedPdf)

    // Clean up original file
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      message: 'PDF decrypted successfully',
      file: {
        name: `decrypted_${req.file.originalname}`,
        path: outputPath,
        size: decryptedPdf.length
      }
    })
  })
)

/**
 * Remove password protection from PDF
 */
router.post('/remove-password',
  upload.single('pdf'),
  validateFile(['application/pdf']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No PDF file uploaded')
    }

    const { password } = req.body
    if (!password) {
      throw new ValidationError('Password is required to remove protection')
    }

    const pdfBuffer = await fs.readFile(req.file.path)
    const unprotectedPdf = await securityService.removePasswordProtection(pdfBuffer, password)

    // Save unprotected PDF
    const outputPath = path.join(path.dirname(req.file.path), `unprotected_${req.file.filename}`)
    await fs.writeFile(outputPath, unprotectedPdf)

    // Clean up original file
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      message: 'Password protection removed successfully',
      file: {
        name: `unprotected_${req.file.originalname}`,
        path: outputPath,
        size: unprotectedPdf.length
      }
    })
  })
)

/**
 * Audit PDF security
 */
router.post('/audit',
  upload.single('pdf'),
  validateFile(['application/pdf']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No PDF file uploaded')
    }

    const pdfBuffer = await fs.readFile(req.file.path)
    const auditResult = await securityService.auditPDFSecurity(pdfBuffer)

    // Clean up uploaded file
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      audit: auditResult,
      file: {
        name: req.file.originalname,
        size: pdfBuffer.length
      }
    })
  })
)

/**
 * Verify PDF integrity
 */
router.post('/verify-integrity',
  upload.single('pdf'),
  validateFile(['application/pdf']),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ValidationError('No PDF file uploaded')
    }

    const pdfBuffer = await fs.readFile(req.file.path)
    const integrityResult = await securityService.verifyPDFIntegrity(pdfBuffer)

    // Clean up uploaded file
    await fs.unlink(req.file.path)

    res.json({
      success: true,
      integrity: integrityResult,
      file: {
        name: req.file.originalname,
        uploadedAt: new Date().toISOString()
      }
    })
  })
)

/**
 * Generate security certificate
 */
router.post('/generate-certificate',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      commonName: z.string().min(1),
      organization: z.string().optional(),
      country: z.string().length(2).optional(),
      validityDays: z.number().min(1).max(3650).optional()
    })

    const options = schema.parse(req.body)
    const { certificate, privateKey } = await securityService.generateSecurityCertificate(options)

    res.json({
      success: true,
      message: 'Security certificate generated successfully',
      certificate: {
        commonName: options.commonName,
        organization: options.organization || 'DocuSlicer',
        country: options.country || 'US',
        validityDays: options.validityDays || 365,
        generatedAt: new Date().toISOString()
      },
      // In production, you might want to store these securely instead of returning them
      certificatePem: certificate,
      privateKeyPem: privateKey,
      warning: 'Store the private key securely. It cannot be recovered if lost.'
    })
  })
)

/**
 * Get security capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    capabilities: {
      passwordProtection: {
        supported: true,
        features: ['user password', 'owner password', 'granular permissions']
      },
      watermarking: {
        supported: true,
        features: ['text watermarks', 'opacity control', 'positioning', 'rotation', 'repeat patterns']
      },
      digitalSignatures: {
        supported: true,
        features: ['visual signatures', 'QR code verification', 'timestamp', 'reason tracking']
      },
      encryption: {
        supported: true,
        algorithms: ['AES-256', 'AES-128', 'RC4-128']
      },
      audit: {
        supported: true,
        features: ['security level assessment', 'vulnerability detection', 'recommendations']
      },
      integrity: {
        supported: true,
        features: ['checksum verification', 'structure validation', 'corruption detection']
      }
    }
  })
})

export default router
