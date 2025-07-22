import fs from 'fs/promises'
import path from 'path'
import { PDFService } from './pdfService'

export interface FileInfo {
  id: string
  name: string
  originalName: string
  size: number
  type: string
  path: string
  createdAt: Date
  modifiedAt: Date
  metadata?: {
    pageCount?: number
    title?: string
    author?: string
  }
}

export interface ProcessingJob {
  id: string
  type: 'split' | 'merge' | 'extract'
  status: 'pending' | 'processing' | 'completed' | 'error'
  inputFiles: string[]
  outputFiles: string[]
  createdAt: Date
  completedAt?: Date
  error?: string
  progress: number
}

export class FileService {
  private pdfService: PDFService
  private uploadDir: string
  private outputDir: string

  constructor() {
    this.pdfService = new PDFService()
    this.uploadDir = path.join(process.cwd(), 'uploads', 'temp')
    this.outputDir = path.join(process.cwd(), 'uploads', 'output')
  }

  /**
   * Initialize directories
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true })
    await fs.mkdir(this.outputDir, { recursive: true })
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await fs.stat(filePath)
    const filename = path.basename(filePath)
    const ext = path.extname(filePath)
    
    let metadata: FileInfo['metadata'] = {}
    
    // Get PDF metadata if it's a PDF file
    if (ext.toLowerCase() === '.pdf') {
      try {
        const pdfInfo = await this.pdfService.getPDFInfo(filePath)
        metadata = {
          pageCount: pdfInfo.pageCount,
          title: pdfInfo.title,
          author: pdfInfo.author
        }
      } catch (error) {
        console.warn('Failed to get PDF metadata:', error)
      }
    }

    return {
      id: path.basename(filename, ext),
      name: filename,
      originalName: filename,
      size: stats.size,
      type: ext.toLowerCase().slice(1),
      path: filePath,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      metadata
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(directory: string = this.uploadDir): Promise<FileInfo[]> {
    try {
      const files = await fs.readdir(directory)
      const fileInfos: FileInfo[] = []

      for (const file of files) {
        const filePath = path.join(directory, file)
        const stats = await fs.stat(filePath)
        
        if (stats.isFile()) {
          try {
            const fileInfo = await this.getFileInfo(filePath)
            fileInfos.push(fileInfo)
          } catch (error) {
            console.warn(`Failed to get info for file ${file}:`, error)
          }
        }
      }

      return fileInfos.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
    } catch (error) {
      console.error('Error listing files:', error)
      return []
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath)
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }

  /**
   * Clean up old files (older than specified days)
   */
  async cleanupOldFiles(maxAgeDays: number = 7): Promise<number> {
    const maxAge = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000)
    let deletedCount = 0

    const directories = [this.uploadDir, this.outputDir]

    for (const dir of directories) {
      try {
        const files = await fs.readdir(dir, { withFileTypes: true })
        
        for (const file of files) {
          const filePath = path.join(dir, file.name)
          
          if (file.isFile()) {
            const stats = await fs.stat(filePath)
            if (stats.mtime.getTime() < maxAge) {
              await fs.unlink(filePath)
              deletedCount++
            }
          } else if (file.isDirectory()) {
            // Recursively clean subdirectories
            const subFiles = await fs.readdir(filePath)
            let isEmpty = true
            
            for (const subFile of subFiles) {
              const subFilePath = path.join(filePath, subFile)
              const subStats = await fs.stat(subFilePath)
              
              if (subStats.mtime.getTime() < maxAge) {
                await fs.unlink(subFilePath)
                deletedCount++
              } else {
                isEmpty = false
              }
            }
            
            // Remove empty directory
            if (isEmpty) {
              try {
                await fs.rmdir(filePath)
              } catch (error) {
                // Directory might not be empty, ignore
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to cleanup directory ${dir}:`, error)
      }
    }

    return deletedCount
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    uploadedFiles: number
    uploadedSize: number
    outputFiles: number
    outputSize: number
  }> {
    const uploadFiles = await this.listFiles(this.uploadDir)
    const outputFiles = await this.listFiles(this.outputDir)

    const uploadedSize = uploadFiles.reduce((sum, file) => sum + file.size, 0)
    const outputSize = outputFiles.reduce((sum, file) => sum + file.size, 0)

    return {
      totalFiles: uploadFiles.length + outputFiles.length,
      totalSize: uploadedSize + outputSize,
      uploadedFiles: uploadFiles.length,
      uploadedSize,
      outputFiles: outputFiles.length,
      outputSize
    }
  }

  /**
   * Search files by name or metadata
   */
  async searchFiles(query: string, directory?: string): Promise<FileInfo[]> {
    const files = await this.listFiles(directory)
    const searchTerm = query.toLowerCase()

    return files.filter(file => {
      const nameMatch = file.name.toLowerCase().includes(searchTerm)
      const titleMatch = file.metadata?.title?.toLowerCase().includes(searchTerm)
      const authorMatch = file.metadata?.author?.toLowerCase().includes(searchTerm)
      
      return nameMatch || titleMatch || authorMatch
    })
  }

  /**
   * Move file to a different directory
   */
  async moveFile(sourcePath: string, targetDir: string, newName?: string): Promise<string> {
    await fs.mkdir(targetDir, { recursive: true })
    
    const filename = newName || path.basename(sourcePath)
    const targetPath = path.join(targetDir, filename)
    
    await fs.rename(sourcePath, targetPath)
    return targetPath
  }

  /**
   * Copy file to a different directory
   */
  async copyFile(sourcePath: string, targetDir: string, newName?: string): Promise<string> {
    await fs.mkdir(targetDir, { recursive: true })
    
    const filename = newName || path.basename(sourcePath)
    const targetPath = path.join(targetDir, filename)
    
    await fs.copyFile(sourcePath, targetPath)
    return targetPath
  }

  /**
   * Get file by ID
   */
  async getFileById(fileId: string): Promise<FileInfo | null> {
    const uploadFiles = await this.listFiles(this.uploadDir)
    const outputFiles = await this.listFiles(this.outputDir)
    
    const allFiles = [...uploadFiles, ...outputFiles]
    return allFiles.find(file => file.id === fileId) || null
  }

  /**
   * Validate file exists and is accessible
   */
  async validateFile(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}
