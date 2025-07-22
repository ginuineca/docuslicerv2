import express from 'express'
import { FileService } from '../services/fileService'
import { z } from 'zod'

const router = express.Router()
const fileService = new FileService()

// Initialize file service
fileService.initialize().catch(console.error)

// Validation schemas
const searchSchema = z.object({
  query: z.string().min(1),
  directory: z.string().optional()
})

const deleteSchema = z.object({
  filePath: z.string().min(1)
})

/**
 * List all files
 */
router.get('/list', async (req, res) => {
  try {
    const { directory } = req.query
    const files = await fileService.listFiles(directory as string)
    
    res.json({
      success: true,
      files,
      count: files.length
    })
  } catch (error) {
    console.error('List files error:', error)
    res.status(500).json({
      error: 'Failed to list files',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Get file information by ID
 */
router.get('/info/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params
    const file = await fileService.getFileById(fileId)
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' })
    }
    
    res.json({
      success: true,
      file
    })
  } catch (error) {
    console.error('Get file info error:', error)
    res.status(500).json({
      error: 'Failed to get file information',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Search files
 */
router.get('/search', async (req, res) => {
  try {
    const { query, directory } = searchSchema.parse(req.query)
    const files = await fileService.searchFiles(query, directory)
    
    res.json({
      success: true,
      files,
      count: files.length,
      query
    })
  } catch (error) {
    console.error('Search files error:', error)
    res.status(500).json({
      error: 'Failed to search files',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Delete file
 */
router.delete('/delete', async (req, res) => {
  try {
    const { filePath } = deleteSchema.parse(req.body)
    
    // Validate file exists
    const isValid = await fileService.validateFile(filePath)
    if (!isValid) {
      return res.status(404).json({ error: 'File not found' })
    }
    
    const success = await fileService.deleteFile(filePath)
    
    if (success) {
      res.json({
        success: true,
        message: 'File deleted successfully'
      })
    } else {
      res.status(500).json({
        error: 'Failed to delete file'
      })
    }
  } catch (error) {
    console.error('Delete file error:', error)
    res.status(500).json({
      error: 'Failed to delete file',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Get storage statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await fileService.getStorageStats()
    
    res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Get storage stats error:', error)
    res.status(500).json({
      error: 'Failed to get storage statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Clean up old files
 */
router.post('/cleanup', async (req, res) => {
  try {
    const { maxAgeDays = 7 } = req.body
    const deletedCount = await fileService.cleanupOldFiles(maxAgeDays)
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old files`,
      deletedCount
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    res.status(500).json({
      error: 'Failed to cleanup files',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Move file
 */
router.post('/move', async (req, res) => {
  try {
    const { sourcePath, targetDir, newName } = req.body
    
    if (!sourcePath || !targetDir) {
      return res.status(400).json({ error: 'Source path and target directory are required' })
    }
    
    // Validate source file exists
    const isValid = await fileService.validateFile(sourcePath)
    if (!isValid) {
      return res.status(404).json({ error: 'Source file not found' })
    }
    
    const newPath = await fileService.moveFile(sourcePath, targetDir, newName)
    const fileInfo = await fileService.getFileInfo(newPath)
    
    res.json({
      success: true,
      message: 'File moved successfully',
      file: fileInfo
    })
  } catch (error) {
    console.error('Move file error:', error)
    res.status(500).json({
      error: 'Failed to move file',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Copy file
 */
router.post('/copy', async (req, res) => {
  try {
    const { sourcePath, targetDir, newName } = req.body
    
    if (!sourcePath || !targetDir) {
      return res.status(400).json({ error: 'Source path and target directory are required' })
    }
    
    // Validate source file exists
    const isValid = await fileService.validateFile(sourcePath)
    if (!isValid) {
      return res.status(404).json({ error: 'Source file not found' })
    }
    
    const newPath = await fileService.copyFile(sourcePath, targetDir, newName)
    const fileInfo = await fileService.getFileInfo(newPath)
    
    res.json({
      success: true,
      message: 'File copied successfully',
      file: fileInfo
    })
  } catch (error) {
    console.error('Copy file error:', error)
    res.status(500).json({
      error: 'Failed to copy file',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
