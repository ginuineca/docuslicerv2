import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { CloudStorageService, CloudStorageConfig } from '../services/cloudStorageService'
import { z } from 'zod'
import { asyncHandler, ValidationError } from '../middleware/errorHandler'

const router = express.Router()

// Initialize cloud storage service with environment configuration
const cloudConfig: CloudStorageConfig = {
  googleDrive: process.env.GOOGLE_DRIVE_CLIENT_ID ? {
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3001/api/cloud/callback/google-drive',
    refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  } : undefined,
  dropbox: process.env.DROPBOX_ACCESS_TOKEN ? {
    accessToken: process.env.DROPBOX_ACCESS_TOKEN,
    clientId: process.env.DROPBOX_CLIENT_ID,
    clientSecret: process.env.DROPBOX_CLIENT_SECRET
  } : undefined,
  awsS3: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucketName: process.env.AWS_S3_BUCKET_NAME || 'docuslicer-storage'
  } : undefined,
  googleCloud: process.env.GOOGLE_CLOUD_PROJECT_ID ? {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || '',
    bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME || 'docuslicer-gcs'
  } : undefined
}

const cloudService = new CloudStorageService(cloudConfig)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'cloud')
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
    fileSize: 100 * 1024 * 1024 // 100MB
  }
})

// Validation schemas
const providerSchema = z.enum(['google-drive', 'dropbox', 'onedrive', 'aws-s3', 'google-cloud'])

const uploadOptionsSchema = z.object({
  fileName: z.string().optional(),
  folder: z.string().optional(),
  overwrite: z.boolean().optional(),
  makePublic: z.boolean().optional()
})

/**
 * Get available cloud providers
 */
router.get('/providers', (req, res) => {
  const providers = cloudService.getAvailableProviders()
  
  res.json({
    success: true,
    providers,
    configured: providers.filter(p => p.isConfigured).length,
    total: providers.length
  })
})

/**
 * Generate OAuth URL for provider authentication
 */
router.get('/auth/:provider', asyncHandler(async (req, res) => {
  const provider = providerSchema.parse(req.params.provider)
  const state = req.query.state as string

  try {
    const authUrl = cloudService.generateAuthUrl(provider, state)
    
    res.json({
      success: true,
      authUrl,
      provider,
      message: 'Redirect user to this URL for authentication'
    })
  } catch (error) {
    throw new ValidationError(`Authentication not available for ${provider}`)
  }
}))

/**
 * Handle OAuth callback
 */
router.get('/callback/:provider', asyncHandler(async (req, res) => {
  const provider = providerSchema.parse(req.params.provider)
  const code = req.query.code as string
  const state = req.query.state as string

  if (!code) {
    throw new ValidationError('Authorization code is required')
  }

  try {
    const tokens = await cloudService.exchangeCodeForToken(provider, code)
    
    // In a real application, you would store these tokens securely
    // associated with the user's account
    
    res.json({
      success: true,
      message: `Successfully authenticated with ${provider}`,
      provider,
      hasRefreshToken: !!tokens.refreshToken,
      // Don't return actual tokens in response for security
      tokenReceived: true
    })
  } catch (error) {
    throw new ValidationError(`Failed to exchange code for token: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Upload file to cloud storage
 */
router.post('/upload/:provider',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const provider = providerSchema.parse(req.params.provider)
    
    if (!req.file) {
      throw new ValidationError('No file uploaded')
    }

    const options = uploadOptionsSchema.parse(req.body)

    try {
      const cloudFile = await cloudService.uploadFile(provider, req.file.path, options)

      // Clean up local file
      await fs.unlink(req.file.path)

      res.json({
        success: true,
        message: 'File uploaded successfully',
        file: cloudFile,
        provider
      })
    } catch (error) {
      // Clean up local file on error
      await fs.unlink(req.file.path).catch(() => {})
      throw error
    }
  })
)

/**
 * Download file from cloud storage
 */
router.get('/download/:provider/:fileId', asyncHandler(async (req, res) => {
  const provider = providerSchema.parse(req.params.provider)
  const fileId = req.params.fileId

  try {
    const fileBuffer = await cloudService.downloadFile(provider, fileId)
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${fileId}"`)
    res.setHeader('Content-Length', fileBuffer.length)
    
    res.send(fileBuffer)
  } catch (error) {
    throw new ValidationError(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * List files in cloud storage
 */
router.get('/files/:provider', asyncHandler(async (req, res) => {
  const provider = providerSchema.parse(req.params.provider)
  const folderId = req.query.folder as string
  const limit = parseInt(req.query.limit as string) || 100

  try {
    const files = await cloudService.listFiles(provider, folderId, limit)
    
    res.json({
      success: true,
      files,
      count: files.length,
      provider,
      folder: folderId || 'root'
    })
  } catch (error) {
    throw new ValidationError(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Delete file from cloud storage
 */
router.delete('/files/:provider/:fileId', asyncHandler(async (req, res) => {
  const provider = providerSchema.parse(req.params.provider)
  const fileId = req.params.fileId

  try {
    const success = await cloudService.deleteFile(provider, fileId)
    
    if (success) {
      res.json({
        success: true,
        message: 'File deleted successfully',
        fileId,
        provider
      })
    } else {
      throw new ValidationError('Failed to delete file')
    }
  } catch (error) {
    throw new ValidationError(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Create folder in cloud storage
 */
router.post('/folders/:provider', asyncHandler(async (req, res) => {
  const provider = providerSchema.parse(req.params.provider)
  const { folderName, parentId } = req.body

  if (!folderName) {
    throw new ValidationError('Folder name is required')
  }

  try {
    const folder = await cloudService.createFolder(provider, folderName, parentId)
    
    res.json({
      success: true,
      message: 'Folder created successfully',
      folder,
      provider
    })
  } catch (error) {
    throw new ValidationError(`Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get storage statistics
 */
router.get('/stats/:provider', asyncHandler(async (req, res) => {
  const provider = providerSchema.parse(req.params.provider)

  try {
    const stats = await cloudService.getStorageStats(provider)
    
    res.json({
      success: true,
      stats: {
        ...stats,
        usagePercentage: stats.totalSpace > 0 ? Math.round((stats.usedSpace / stats.totalSpace) * 100) : 0,
        formattedTotalSpace: formatBytes(stats.totalSpace),
        formattedUsedSpace: formatBytes(stats.usedSpace),
        formattedFreeSpace: formatBytes(stats.freeSpace)
      },
      provider
    })
  } catch (error) {
    throw new ValidationError(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Sync files between local and cloud storage
 */
router.post('/sync/:provider', asyncHandler(async (req, res) => {
  const provider = providerSchema.parse(req.params.provider)
  const { localDir, cloudFolder } = req.body

  if (!localDir) {
    throw new ValidationError('Local directory path is required')
  }

  try {
    const syncResult = await cloudService.syncFiles(provider, localDir, cloudFolder)
    
    res.json({
      success: true,
      message: 'Sync completed',
      result: syncResult,
      provider,
      summary: {
        uploaded: syncResult.uploaded.length,
        downloaded: syncResult.downloaded.length,
        errors: syncResult.errors.length
      }
    })
  } catch (error) {
    throw new ValidationError(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Create backup
 */
router.post('/backup/:provider', asyncHandler(async (req, res) => {
  const provider = providerSchema.parse(req.params.provider)
  const { localDir, backupName } = req.body

  if (!localDir) {
    throw new ValidationError('Local directory path is required')
  }

  try {
    const backup = await cloudService.createBackup(provider, localDir, backupName)
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      backup: {
        ...backup,
        formattedSize: formatBytes(backup.totalSize)
      },
      provider
    })
  } catch (error) {
    throw new ValidationError(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Restore backup
 */
router.post('/restore/:provider', asyncHandler(async (req, res) => {
  const provider = providerSchema.parse(req.params.provider)
  const { backupPath, localDir } = req.body

  if (!backupPath || !localDir) {
    throw new ValidationError('Backup path and local directory are required')
  }

  try {
    const restoreResult = await cloudService.restoreBackup(provider, backupPath, localDir)
    
    res.json({
      success: true,
      message: 'Restore completed',
      result: restoreResult,
      provider,
      summary: {
        restored: restoreResult.restoredFiles.length,
        errors: restoreResult.errors.length
      }
    })
  } catch (error) {
    throw new ValidationError(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}))

/**
 * Get cloud storage capabilities
 */
router.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    capabilities: {
      providers: {
        'google-drive': {
          name: 'Google Drive',
          features: ['upload', 'download', 'list', 'delete', 'folders', 'oauth', 'sync', 'backup'],
          maxFileSize: '5TB',
          storageLimit: '15GB (free)'
        },
        'dropbox': {
          name: 'Dropbox',
          features: ['upload', 'download', 'list', 'delete', 'folders', 'oauth', 'sync', 'backup'],
          maxFileSize: '50GB',
          storageLimit: '2GB (free)'
        },
        'onedrive': {
          name: 'OneDrive',
          features: ['upload', 'download', 'list', 'delete', 'folders', 'oauth'],
          maxFileSize: '250GB',
          storageLimit: '5GB (free)'
        },
        'aws-s3': {
          name: 'AWS S3',
          features: ['upload', 'download', 'list', 'delete', 'sync', 'backup'],
          maxFileSize: '5TB',
          storageLimit: 'Pay-as-you-go'
        },
        'google-cloud': {
          name: 'Google Cloud Storage',
          features: ['upload', 'download', 'list', 'delete', 'sync', 'backup'],
          maxFileSize: '5TB',
          storageLimit: 'Pay-as-you-go'
        }
      },
      supportedFormats: ['PDF', 'Images (for OCR)'],
      features: {
        oauth: 'OAuth 2.0 authentication for supported providers',
        sync: 'Bidirectional file synchronization',
        backup: 'Automated backup and restore',
        folders: 'Folder organization and management',
        batch: 'Batch upload and download operations'
      }
    }
  })
})

/**
 * Utility function to format bytes
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  if (bytes === -1) return 'Unlimited'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default router
