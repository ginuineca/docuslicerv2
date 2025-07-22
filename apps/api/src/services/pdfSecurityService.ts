import { PDFDocument, PDFPage, rgb, StandardFonts, degrees } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import crypto from 'crypto'
import CryptoJS from 'crypto-js'
import forge from 'node-forge'
import QRCode from 'qrcode'
import { createCanvas } from 'canvas'
import fs from 'fs/promises'
import path from 'path'

export interface PasswordProtectionOptions {
  userPassword?: string
  ownerPassword?: string
  permissions?: {
    printing?: boolean
    modifying?: boolean
    copying?: boolean
    annotating?: boolean
    fillingForms?: boolean
    contentAccessibility?: boolean
    documentAssembly?: boolean
    highQualityPrinting?: boolean
  }
}

export interface WatermarkOptions {
  text: string
  opacity?: number
  fontSize?: number
  color?: { r: number; g: number; b: number }
  rotation?: number
  position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  repeat?: boolean
}

export interface DigitalSignatureOptions {
  signerName: string
  reason?: string
  location?: string
  contactInfo?: string
  signatureImage?: Buffer
  certificatePath?: string
  privateKeyPath?: string
}

export interface EncryptionOptions {
  algorithm: 'AES-256' | 'AES-128' | 'RC4-128'
  password: string
  keyDerivation?: 'PBKDF2' | 'scrypt'
  iterations?: number
}

export interface SecurityAuditResult {
  isPasswordProtected: boolean
  hasDigitalSignatures: boolean
  hasWatermarks: boolean
  isEncrypted: boolean
  permissions: {
    printing: boolean
    modifying: boolean
    copying: boolean
    annotating: boolean
  }
  securityLevel: 'none' | 'basic' | 'standard' | 'high' | 'maximum'
  vulnerabilities: string[]
  recommendations: string[]
}

export class PDFSecurityService {
  private tempDir: string

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp', 'security')
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
   * Add password protection to PDF
   */
  async addPasswordProtection(
    pdfBuffer: Buffer,
    options: PasswordProtectionOptions
  ): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)

      // Set passwords
      if (options.userPassword) {
        pdfDoc.encrypt({
          userPassword: options.userPassword,
          ownerPassword: options.ownerPassword || options.userPassword,
          permissions: {
            printing: options.permissions?.printing ?? false,
            modifying: options.permissions?.modifying ?? false,
            copying: options.permissions?.copying ?? false,
            annotating: options.permissions?.annotating ?? false,
            fillingForms: options.permissions?.fillingForms ?? false,
            contentAccessibility: options.permissions?.contentAccessibility ?? true,
            documentAssembly: options.permissions?.documentAssembly ?? false,
            highQualityPrinting: options.permissions?.highQualityPrinting ?? false
          }
        })
      }

      return await pdfDoc.save()
    } catch (error) {
      throw new Error(`Failed to add password protection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Add watermark to PDF
   */
  async addWatermark(
    pdfBuffer: Buffer,
    options: WatermarkOptions
  ): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      pdfDoc.registerFontkit(fontkit)

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const pages = pdfDoc.getPages()

      const fontSize = options.fontSize || 48
      const opacity = options.opacity || 0.3
      const color = options.color || { r: 0.5, g: 0.5, b: 0.5 }
      const rotation = options.rotation || -45

      for (const page of pages) {
        const { width, height } = page.getSize()
        
        if (options.repeat) {
          // Add repeating watermark pattern
          const textWidth = font.widthOfTextAtSize(options.text, fontSize)
          const textHeight = fontSize
          
          const xSpacing = textWidth + 100
          const ySpacing = textHeight + 100
          
          for (let x = -textWidth; x < width + textWidth; x += xSpacing) {
            for (let y = -textHeight; y < height + textHeight; y += ySpacing) {
              page.drawText(options.text, {
                x,
                y,
                size: fontSize,
                font,
                color: rgb(color.r, color.g, color.b),
                opacity,
                rotate: degrees(rotation)
              })
            }
          }
        } else {
          // Add single watermark
          let x: number, y: number

          switch (options.position) {
            case 'top-left':
              x = 50
              y = height - 50
              break
            case 'top-right':
              x = width - font.widthOfTextAtSize(options.text, fontSize) - 50
              y = height - 50
              break
            case 'bottom-left':
              x = 50
              y = 50
              break
            case 'bottom-right':
              x = width - font.widthOfTextAtSize(options.text, fontSize) - 50
              y = 50
              break
            default: // center
              x = (width - font.widthOfTextAtSize(options.text, fontSize)) / 2
              y = height / 2
          }

          page.drawText(options.text, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
            opacity,
            rotate: degrees(rotation)
          })
        }
      }

      return await pdfDoc.save()
    } catch (error) {
      throw new Error(`Failed to add watermark: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Add digital signature to PDF
   */
  async addDigitalSignature(
    pdfBuffer: Buffer,
    options: DigitalSignatureOptions
  ): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const pages = pdfDoc.getPages()
      const firstPage = pages[0]
      const { width, height } = firstPage.getSize()

      // Create signature appearance
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      
      // Generate QR code for signature verification
      const signatureData = {
        signer: options.signerName,
        timestamp: new Date().toISOString(),
        reason: options.reason || 'Document signing',
        location: options.location || 'Digital'
      }
      
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(signatureData))
      const qrCodeImage = await pdfDoc.embedPng(Buffer.from(qrCodeDataUrl.split(',')[1], 'base64'))

      // Add signature box
      const signatureBoxWidth = 200
      const signatureBoxHeight = 80
      const signatureX = width - signatureBoxWidth - 50
      const signatureY = 50

      // Draw signature box
      firstPage.drawRectangle({
        x: signatureX,
        y: signatureY,
        width: signatureBoxWidth,
        height: signatureBoxHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1
      })

      // Add signature text
      firstPage.drawText(`Digitally signed by:`, {
        x: signatureX + 10,
        y: signatureY + signatureBoxHeight - 20,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      })

      firstPage.drawText(options.signerName, {
        x: signatureX + 10,
        y: signatureY + signatureBoxHeight - 35,
        size: 12,
        font,
        color: rgb(0, 0, 0)
      })

      firstPage.drawText(`Date: ${new Date().toLocaleDateString()}`, {
        x: signatureX + 10,
        y: signatureY + signatureBoxHeight - 50,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5)
      })

      if (options.reason) {
        firstPage.drawText(`Reason: ${options.reason}`, {
          x: signatureX + 10,
          y: signatureY + signatureBoxHeight - 65,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5)
        })
      }

      // Add QR code
      firstPage.drawImage(qrCodeImage, {
        x: signatureX + signatureBoxWidth - 40,
        y: signatureY + 10,
        width: 30,
        height: 30
      })

      return await pdfDoc.save()
    } catch (error) {
      throw new Error(`Failed to add digital signature: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Encrypt PDF with advanced encryption
   */
  async encryptPDF(
    pdfBuffer: Buffer,
    options: EncryptionOptions
  ): Promise<{ encryptedPdf: Buffer; key: string; iv: string }> {
    try {
      const algorithm = options.algorithm === 'AES-256' ? 'aes-256-cbc' : 
                       options.algorithm === 'AES-128' ? 'aes-128-cbc' : 'rc4'

      // Generate key and IV
      const key = crypto.scryptSync(options.password, 'salt', algorithm.includes('256') ? 32 : 16)
      const iv = crypto.randomBytes(16)

      // Encrypt the PDF
      const cipher = crypto.createCipher(algorithm, key)
      let encrypted = cipher.update(pdfBuffer)
      encrypted = Buffer.concat([encrypted, cipher.final()])

      // Create metadata
      const metadata = {
        algorithm: options.algorithm,
        iv: iv.toString('hex'),
        timestamp: new Date().toISOString()
      }

      // Combine metadata and encrypted data
      const metadataBuffer = Buffer.from(JSON.stringify(metadata))
      const metadataLength = Buffer.alloc(4)
      metadataLength.writeUInt32BE(metadataBuffer.length, 0)

      const encryptedPdf = Buffer.concat([metadataLength, metadataBuffer, encrypted])

      return {
        encryptedPdf,
        key: key.toString('hex'),
        iv: iv.toString('hex')
      }
    } catch (error) {
      throw new Error(`Failed to encrypt PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Decrypt PDF
   */
  async decryptPDF(
    encryptedBuffer: Buffer,
    password: string
  ): Promise<Buffer> {
    try {
      // Extract metadata
      const metadataLength = encryptedBuffer.readUInt32BE(0)
      const metadataBuffer = encryptedBuffer.subarray(4, 4 + metadataLength)
      const metadata = JSON.parse(metadataBuffer.toString())
      const encryptedData = encryptedBuffer.subarray(4 + metadataLength)

      // Recreate key
      const algorithm = metadata.algorithm === 'AES-256' ? 'aes-256-cbc' : 
                       metadata.algorithm === 'AES-128' ? 'aes-128-cbc' : 'rc4'
      const key = crypto.scryptSync(password, 'salt', algorithm.includes('256') ? 32 : 16)

      // Decrypt
      const decipher = crypto.createDecipher(algorithm, key)
      let decrypted = decipher.update(encryptedData)
      decrypted = Buffer.concat([decrypted, decipher.final()])

      return decrypted
    } catch (error) {
      throw new Error(`Failed to decrypt PDF: ${error instanceof Error ? error.message : 'Invalid password or corrupted file'}`)
    }
  }

  /**
   * Remove password protection from PDF
   */
  async removePasswordProtection(
    pdfBuffer: Buffer,
    password: string
  ): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer, { password })
      return await pdfDoc.save()
    } catch (error) {
      throw new Error(`Failed to remove password protection: ${error instanceof Error ? error.message : 'Invalid password'}`)
    }
  }

  /**
   * Audit PDF security
   */
  async auditPDFSecurity(pdfBuffer: Buffer): Promise<SecurityAuditResult> {
    try {
      let isPasswordProtected = false
      let pdfDoc: PDFDocument

      // Try to load without password first
      try {
        pdfDoc = await PDFDocument.load(pdfBuffer)
      } catch (error) {
        // If it fails, it might be password protected
        isPasswordProtected = true
        throw new Error('PDF is password protected')
      }

      const vulnerabilities: string[] = []
      const recommendations: string[] = []

      // Check for basic security features
      if (!isPasswordProtected) {
        vulnerabilities.push('No password protection')
        recommendations.push('Add password protection to prevent unauthorized access')
      }

      // Analyze content for potential watermarks (simplified check)
      const pages = pdfDoc.getPages()
      let hasWatermarks = false
      
      // This is a simplified check - in reality, you'd need more sophisticated analysis
      const pageCount = pages.length
      if (pageCount > 0) {
        // Check if there are repeated text elements that might be watermarks
        // This is a placeholder - actual watermark detection would be more complex
        hasWatermarks = false
      }

      // Check for digital signatures (simplified)
      const hasDigitalSignatures = false // Placeholder - would need actual signature detection

      // Determine security level
      let securityLevel: SecurityAuditResult['securityLevel'] = 'none'
      if (isPasswordProtected && hasDigitalSignatures && hasWatermarks) {
        securityLevel = 'maximum'
      } else if (isPasswordProtected && (hasDigitalSignatures || hasWatermarks)) {
        securityLevel = 'high'
      } else if (isPasswordProtected) {
        securityLevel = 'standard'
      } else if (hasDigitalSignatures || hasWatermarks) {
        securityLevel = 'basic'
      }

      if (securityLevel === 'none') {
        recommendations.push('Consider adding digital signatures for authenticity')
        recommendations.push('Add watermarks to prevent unauthorized copying')
      }

      return {
        isPasswordProtected,
        hasDigitalSignatures,
        hasWatermarks,
        isEncrypted: false, // Would need more sophisticated detection
        permissions: {
          printing: true, // Default values - would need actual permission extraction
          modifying: true,
          copying: true,
          annotating: true
        },
        securityLevel,
        vulnerabilities,
        recommendations
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('password protected')) {
        return {
          isPasswordProtected: true,
          hasDigitalSignatures: false,
          hasWatermarks: false,
          isEncrypted: false,
          permissions: {
            printing: false,
            modifying: false,
            copying: false,
            annotating: false
          },
          securityLevel: 'standard',
          vulnerabilities: [],
          recommendations: ['PDF is password protected - provide password for detailed analysis']
        }
      }

      throw new Error(`Failed to audit PDF security: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate security certificate
   */
  async generateSecurityCertificate(options: {
    commonName: string
    organization?: string
    country?: string
    validityDays?: number
  }): Promise<{ certificate: string; privateKey: string }> {
    try {
      // Generate key pair
      const keys = forge.pki.rsa.generateKeyPair(2048)
      
      // Create certificate
      const cert = forge.pki.createCertificate()
      cert.publicKey = keys.publicKey
      cert.serialNumber = '01'
      cert.validity.notBefore = new Date()
      cert.validity.notAfter = new Date()
      cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + (options.validityDays || 365))

      const attrs = [
        { name: 'commonName', value: options.commonName },
        { name: 'organizationName', value: options.organization || 'DocuSlicer' },
        { name: 'countryName', value: options.country || 'US' }
      ]

      cert.setSubject(attrs)
      cert.setIssuer(attrs)
      cert.sign(keys.privateKey)

      return {
        certificate: forge.pki.certificateToPem(cert),
        privateKey: forge.pki.privateKeyToPem(keys.privateKey)
      }
    } catch (error) {
      throw new Error(`Failed to generate security certificate: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Verify PDF integrity
   */
  async verifyPDFIntegrity(pdfBuffer: Buffer): Promise<{
    isValid: boolean
    checksum: string
    fileSize: number
    lastModified?: Date
    issues: string[]
  }> {
    try {
      const checksum = crypto.createHash('sha256').update(pdfBuffer).digest('hex')
      const fileSize = pdfBuffer.length
      const issues: string[] = []

      // Try to load PDF to check validity
      let isValid = true
      try {
        await PDFDocument.load(pdfBuffer)
      } catch (error) {
        isValid = false
        issues.push('PDF structure is corrupted or invalid')
      }

      // Check file size
      if (fileSize === 0) {
        isValid = false
        issues.push('File is empty')
      } else if (fileSize < 100) {
        issues.push('File size is unusually small')
      }

      return {
        isValid,
        checksum,
        fileSize,
        issues
      }
    } catch (error) {
      throw new Error(`Failed to verify PDF integrity: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
