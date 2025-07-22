import { Storage } from '@google-cloud/storage'
import AWS from 'aws-sdk'
import { Dropbox } from 'dropbox'
import { google } from 'googleapis'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export interface CloudProvider {
  id: 'google-drive' | 'dropbox' | 'onedrive' | 'aws-s3' | 'google-cloud'
  name: string
  icon: string
  isConfigured: boolean
}

export interface CloudFile {
  id: string
  name: string
  size: number
  mimeType: string
  modifiedTime: Date
  downloadUrl?: string
  thumbnailUrl?: string
  provider: CloudProvider['id']
  path: string
}

export interface CloudFolder {
  id: string
  name: string
  path: string
  provider: CloudProvider['id']
  parentId?: string
  files: CloudFile[]
  folders: CloudFolder[]
}

export interface UploadOptions {
  fileName?: string
  folder?: string
  overwrite?: boolean
  makePublic?: boolean
  metadata?: Record<string, any>
}

export interface DownloadOptions {
  localPath?: string
  createThumbnail?: boolean
}

export interface CloudStorageConfig {
  googleDrive?: {
    clientId: string
    clientSecret: string
    redirectUri: string
    refreshToken?: string
  }
  dropbox?: {
    accessToken: string
    clientId?: string
    clientSecret?: string
  }
  oneDrive?: {
    clientId: string
    clientSecret: string
    redirectUri: string
    refreshToken?: string
  }
  awsS3?: {
    accessKeyId: string
    secretAccessKey: string
    region: string
    bucketName: string
  }
  googleCloud?: {
    projectId: string
    keyFilename: string
    bucketName: string
  }
}

export class CloudStorageService {
  private config: CloudStorageConfig
  private googleDriveClient?: any
  private dropboxClient?: Dropbox
  private oneDriveClient?: any
  private s3Client?: AWS.S3
  private gcsClient?: Storage

  constructor(config: CloudStorageConfig = {}) {
    this.config = config
    this.initializeClients()
  }

  /**
   * Initialize cloud storage clients
   */
  private async initializeClients(): Promise<void> {
    try {
      // Initialize Google Drive
      if (this.config.googleDrive) {
        const oauth2Client = new google.auth.OAuth2(
          this.config.googleDrive.clientId,
          this.config.googleDrive.clientSecret,
          this.config.googleDrive.redirectUri
        )

        if (this.config.googleDrive.refreshToken) {
          oauth2Client.setCredentials({
            refresh_token: this.config.googleDrive.refreshToken
          })
        }

        this.googleDriveClient = google.drive({ version: 'v3', auth: oauth2Client })
      }

      // Initialize Dropbox
      if (this.config.dropbox?.accessToken) {
        this.dropboxClient = new Dropbox({
          accessToken: this.config.dropbox.accessToken
        })
      }

      // Initialize OneDrive (Microsoft Graph)
      if (this.config.oneDrive) {
        // OneDrive integration would use Microsoft Graph API
        // Implementation would be similar to Google Drive
      }

      // Initialize AWS S3
      if (this.config.awsS3) {
        AWS.config.update({
          accessKeyId: this.config.awsS3.accessKeyId,
          secretAccessKey: this.config.awsS3.secretAccessKey,
          region: this.config.awsS3.region
        })
        this.s3Client = new AWS.S3()
      }

      // Initialize Google Cloud Storage
      if (this.config.googleCloud) {
        this.gcsClient = new Storage({
          projectId: this.config.googleCloud.projectId,
          keyFilename: this.config.googleCloud.keyFilename
        })
      }

      console.log('✅ Cloud storage clients initialized')
    } catch (error) {
      console.error('Failed to initialize cloud storage clients:', error)
    }
  }

  /**
   * Get available cloud providers
   */
  getAvailableProviders(): CloudProvider[] {
    return [
      {
        id: 'google-drive',
        name: 'Google Drive',
        icon: 'google-drive',
        isConfigured: !!this.config.googleDrive?.clientId
      },
      {
        id: 'dropbox',
        name: 'Dropbox',
        icon: 'dropbox',
        isConfigured: !!this.config.dropbox?.accessToken
      },
      {
        id: 'onedrive',
        name: 'OneDrive',
        icon: 'onedrive',
        isConfigured: !!this.config.oneDrive?.clientId
      },
      {
        id: 'aws-s3',
        name: 'AWS S3',
        icon: 'aws',
        isConfigured: !!this.config.awsS3?.accessKeyId
      },
      {
        id: 'google-cloud',
        name: 'Google Cloud Storage',
        icon: 'google-cloud',
        isConfigured: !!this.config.googleCloud?.projectId
      }
    ]
  }

  /**
   * Upload file to cloud storage
   */
  async uploadFile(
    provider: CloudProvider['id'],
    filePath: string,
    options: UploadOptions = {}
  ): Promise<CloudFile> {
    const fileBuffer = await fs.readFile(filePath)
    const fileName = options.fileName || path.basename(filePath)
    const fileStats = await fs.stat(filePath)

    switch (provider) {
      case 'google-drive':
        return await this.uploadToGoogleDrive(fileBuffer, fileName, fileStats.size, options)
      case 'dropbox':
        return await this.uploadToDropbox(fileBuffer, fileName, fileStats.size, options)
      case 'aws-s3':
        return await this.uploadToS3(fileBuffer, fileName, fileStats.size, options)
      case 'google-cloud':
        return await this.uploadToGCS(fileBuffer, fileName, fileStats.size, options)
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  /**
   * Download file from cloud storage
   */
  async downloadFile(
    provider: CloudProvider['id'],
    fileId: string,
    options: DownloadOptions = {}
  ): Promise<Buffer> {
    switch (provider) {
      case 'google-drive':
        return await this.downloadFromGoogleDrive(fileId, options)
      case 'dropbox':
        return await this.downloadFromDropbox(fileId, options)
      case 'aws-s3':
        return await this.downloadFromS3(fileId, options)
      case 'google-cloud':
        return await this.downloadFromGCS(fileId, options)
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  /**
   * List files in cloud storage
   */
  async listFiles(
    provider: CloudProvider['id'],
    folderId?: string,
    limit: number = 100
  ): Promise<CloudFile[]> {
    switch (provider) {
      case 'google-drive':
        return await this.listGoogleDriveFiles(folderId, limit)
      case 'dropbox':
        return await this.listDropboxFiles(folderId, limit)
      case 'aws-s3':
        return await this.listS3Files(folderId, limit)
      case 'google-cloud':
        return await this.listGCSFiles(folderId, limit)
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  /**
   * Delete file from cloud storage
   */
  async deleteFile(provider: CloudProvider['id'], fileId: string): Promise<boolean> {
    try {
      switch (provider) {
        case 'google-drive':
          await this.deleteFromGoogleDrive(fileId)
          break
        case 'dropbox':
          await this.deleteFromDropbox(fileId)
          break
        case 'aws-s3':
          await this.deleteFromS3(fileId)
          break
        case 'google-cloud':
          await this.deleteFromGCS(fileId)
          break
        default:
          throw new Error(`Unsupported provider: ${provider}`)
      }
      return true
    } catch (error) {
      console.error(`Failed to delete file from ${provider}:`, error)
      return false
    }
  }

  /**
   * Create folder in cloud storage
   */
  async createFolder(
    provider: CloudProvider['id'],
    folderName: string,
    parentId?: string
  ): Promise<CloudFolder> {
    switch (provider) {
      case 'google-drive':
        return await this.createGoogleDriveFolder(folderName, parentId)
      case 'dropbox':
        return await this.createDropboxFolder(folderName, parentId)
      default:
        throw new Error(`Folder creation not supported for provider: ${provider}`)
    }
  }

  /**
   * Google Drive implementation
   */
  private async uploadToGoogleDrive(
    fileBuffer: Buffer,
    fileName: string,
    fileSize: number,
    options: UploadOptions
  ): Promise<CloudFile> {
    if (!this.googleDriveClient) {
      throw new Error('Google Drive client not initialized')
    }

    const media = {
      mimeType: 'application/pdf',
      body: fileBuffer
    }

    const fileMetadata = {
      name: fileName,
      parents: options.folder ? [options.folder] : undefined
    }

    const response = await this.googleDriveClient.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,size,mimeType,modifiedTime,webViewLink,thumbnailLink'
    })

    return {
      id: response.data.id,
      name: response.data.name,
      size: parseInt(response.data.size) || fileSize,
      mimeType: response.data.mimeType,
      modifiedTime: new Date(response.data.modifiedTime),
      downloadUrl: response.data.webViewLink,
      thumbnailUrl: response.data.thumbnailLink,
      provider: 'google-drive',
      path: `/${fileName}`
    }
  }

  private async downloadFromGoogleDrive(fileId: string, options: DownloadOptions): Promise<Buffer> {
    if (!this.googleDriveClient) {
      throw new Error('Google Drive client not initialized')
    }

    const response = await this.googleDriveClient.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'arraybuffer' })

    return Buffer.from(response.data)
  }

  private async listGoogleDriveFiles(folderId?: string, limit: number = 100): Promise<CloudFile[]> {
    if (!this.googleDriveClient) {
      throw new Error('Google Drive client not initialized')
    }

    const query = folderId 
      ? `'${folderId}' in parents and trashed=false`
      : "mimeType='application/pdf' and trashed=false"

    const response = await this.googleDriveClient.files.list({
      q: query,
      pageSize: limit,
      fields: 'files(id,name,size,mimeType,modifiedTime,webViewLink,thumbnailLink,parents)'
    })

    return response.data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      size: parseInt(file.size) || 0,
      mimeType: file.mimeType,
      modifiedTime: new Date(file.modifiedTime),
      downloadUrl: file.webViewLink,
      thumbnailUrl: file.thumbnailLink,
      provider: 'google-drive' as const,
      path: `/${file.name}`
    }))
  }

  private async deleteFromGoogleDrive(fileId: string): Promise<void> {
    if (!this.googleDriveClient) {
      throw new Error('Google Drive client not initialized')
    }

    await this.googleDriveClient.files.delete({ fileId })
  }

  private async createGoogleDriveFolder(folderName: string, parentId?: string): Promise<CloudFolder> {
    if (!this.googleDriveClient) {
      throw new Error('Google Drive client not initialized')
    }

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    }

    const response = await this.googleDriveClient.files.create({
      resource: fileMetadata,
      fields: 'id,name,parents'
    })

    return {
      id: response.data.id,
      name: response.data.name,
      path: `/${folderName}`,
      provider: 'google-drive',
      parentId: parentId,
      files: [],
      folders: []
    }
  }

  /**
   * Dropbox implementation
   */
  private async uploadToDropbox(
    fileBuffer: Buffer,
    fileName: string,
    fileSize: number,
    options: UploadOptions
  ): Promise<CloudFile> {
    if (!this.dropboxClient) {
      throw new Error('Dropbox client not initialized')
    }

    const filePath = options.folder ? `/${options.folder}/${fileName}` : `/${fileName}`

    const response = await this.dropboxClient.filesUpload({
      path: filePath,
      contents: fileBuffer,
      mode: options.overwrite ? 'overwrite' : 'add',
      autorename: !options.overwrite
    })

    return {
      id: response.result.id,
      name: response.result.name,
      size: response.result.size,
      mimeType: 'application/pdf',
      modifiedTime: new Date(response.result.server_modified),
      provider: 'dropbox',
      path: response.result.path_display || filePath
    }
  }

  private async downloadFromDropbox(fileId: string, options: DownloadOptions): Promise<Buffer> {
    if (!this.dropboxClient) {
      throw new Error('Dropbox client not initialized')
    }

    const response = await this.dropboxClient.filesDownload({ path: fileId })
    return Buffer.from((response.result as any).fileBinary)
  }

  private async listDropboxFiles(folderId?: string, limit: number = 100): Promise<CloudFile[]> {
    if (!this.dropboxClient) {
      throw new Error('Dropbox client not initialized')
    }

    const response = await this.dropboxClient.filesListFolder({
      path: folderId || '',
      limit: limit
    })

    return response.result.entries
      .filter((entry: any) => entry['.tag'] === 'file')
      .map((file: any) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        mimeType: 'application/pdf',
        modifiedTime: new Date(file.server_modified),
        provider: 'dropbox' as const,
        path: file.path_display
      }))
  }

  private async deleteFromDropbox(fileId: string): Promise<void> {
    if (!this.dropboxClient) {
      throw new Error('Dropbox client not initialized')
    }

    await this.dropboxClient.filesDeleteV2({ path: fileId })
  }

  private async createDropboxFolder(folderName: string, parentId?: string): Promise<CloudFolder> {
    if (!this.dropboxClient) {
      throw new Error('Dropbox client not initialized')
    }

    const folderPath = parentId ? `${parentId}/${folderName}` : `/${folderName}`

    const response = await this.dropboxClient.filesCreateFolderV2({
      path: folderPath
    })

    return {
      id: response.result.metadata.id,
      name: response.result.metadata.name,
      path: response.result.metadata.path_display || folderPath,
      provider: 'dropbox',
      parentId: parentId,
      files: [],
      folders: []
    }
  }

  /**
   * AWS S3 implementation
   */
  private async uploadToS3(
    fileBuffer: Buffer,
    fileName: string,
    fileSize: number,
    options: UploadOptions
  ): Promise<CloudFile> {
    if (!this.s3Client || !this.config.awsS3) {
      throw new Error('AWS S3 client not initialized')
    }

    const key = options.folder ? `${options.folder}/${fileName}` : fileName

    const params = {
      Bucket: this.config.awsS3.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: 'application/pdf',
      Metadata: options.metadata || {}
    }

    const response = await this.s3Client.upload(params).promise()

    return {
      id: response.Key || key,
      name: fileName,
      size: fileSize,
      mimeType: 'application/pdf',
      modifiedTime: new Date(),
      downloadUrl: response.Location,
      provider: 'aws-s3',
      path: key
    }
  }

  private async downloadFromS3(fileId: string, options: DownloadOptions): Promise<Buffer> {
    if (!this.s3Client || !this.config.awsS3) {
      throw new Error('AWS S3 client not initialized')
    }

    const params = {
      Bucket: this.config.awsS3.bucketName,
      Key: fileId
    }

    const response = await this.s3Client.getObject(params).promise()
    return response.Body as Buffer
  }

  private async listS3Files(prefix?: string, limit: number = 100): Promise<CloudFile[]> {
    if (!this.s3Client || !this.config.awsS3) {
      throw new Error('AWS S3 client not initialized')
    }

    const params = {
      Bucket: this.config.awsS3.bucketName,
      Prefix: prefix || '',
      MaxKeys: limit
    }

    const response = await this.s3Client.listObjectsV2(params).promise()

    return (response.Contents || []).map(object => ({
      id: object.Key || '',
      name: path.basename(object.Key || ''),
      size: object.Size || 0,
      mimeType: 'application/pdf',
      modifiedTime: object.LastModified || new Date(),
      provider: 'aws-s3' as const,
      path: object.Key || ''
    }))
  }

  private async deleteFromS3(fileId: string): Promise<void> {
    if (!this.s3Client || !this.config.awsS3) {
      throw new Error('AWS S3 client not initialized')
    }

    const params = {
      Bucket: this.config.awsS3.bucketName,
      Key: fileId
    }

    await this.s3Client.deleteObject(params).promise()
  }

  /**
   * Google Cloud Storage implementation
   */
  private async uploadToGCS(
    fileBuffer: Buffer,
    fileName: string,
    fileSize: number,
    options: UploadOptions
  ): Promise<CloudFile> {
    if (!this.gcsClient || !this.config.googleCloud) {
      throw new Error('Google Cloud Storage client not initialized')
    }

    const bucket = this.gcsClient.bucket(this.config.googleCloud.bucketName)
    const file = bucket.file(options.folder ? `${options.folder}/${fileName}` : fileName)

    await file.save(fileBuffer, {
      metadata: {
        contentType: 'application/pdf',
        metadata: options.metadata || {}
      }
    })

    const [metadata] = await file.getMetadata()

    return {
      id: file.name,
      name: fileName,
      size: parseInt(metadata.size) || fileSize,
      mimeType: metadata.contentType || 'application/pdf',
      modifiedTime: new Date(metadata.updated),
      provider: 'google-cloud',
      path: file.name
    }
  }

  private async downloadFromGCS(fileId: string, options: DownloadOptions): Promise<Buffer> {
    if (!this.gcsClient || !this.config.googleCloud) {
      throw new Error('Google Cloud Storage client not initialized')
    }

    const bucket = this.gcsClient.bucket(this.config.googleCloud.bucketName)
    const file = bucket.file(fileId)

    const [contents] = await file.download()
    return contents
  }

  private async listGCSFiles(prefix?: string, limit: number = 100): Promise<CloudFile[]> {
    if (!this.gcsClient || !this.config.googleCloud) {
      throw new Error('Google Cloud Storage client not initialized')
    }

    const bucket = this.gcsClient.bucket(this.config.googleCloud.bucketName)
    const [files] = await bucket.getFiles({
      prefix: prefix || '',
      maxResults: limit
    })

    return files.map(file => ({
      id: file.name,
      name: path.basename(file.name),
      size: parseInt(file.metadata.size) || 0,
      mimeType: file.metadata.contentType || 'application/pdf',
      modifiedTime: new Date(file.metadata.updated),
      provider: 'google-cloud' as const,
      path: file.name
    }))
  }

  private async deleteFromGCS(fileId: string): Promise<void> {
    if (!this.gcsClient || !this.config.googleCloud) {
      throw new Error('Google Cloud Storage client not initialized')
    }

    const bucket = this.gcsClient.bucket(this.config.googleCloud.bucketName)
    const file = bucket.file(fileId)

    await file.delete()
  }

  /**
   * Generate OAuth URL for provider authentication
   */
  generateAuthUrl(provider: CloudProvider['id'], state?: string): string {
    switch (provider) {
      case 'google-drive':
        if (!this.config.googleDrive) {
          throw new Error('Google Drive configuration not found')
        }
        
        const oauth2Client = new google.auth.OAuth2(
          this.config.googleDrive.clientId,
          this.config.googleDrive.clientSecret,
          this.config.googleDrive.redirectUri
        )

        return oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: ['https://www.googleapis.com/auth/drive.file'],
          state: state
        })

      case 'dropbox':
        if (!this.config.dropbox?.clientId) {
          throw new Error('Dropbox configuration not found')
        }

        const dropboxAuthUrl = `https://www.dropbox.com/oauth2/authorize?` +
          `client_id=${this.config.dropbox.clientId}&` +
          `response_type=code&` +
          `redirect_uri=${encodeURIComponent('http://localhost:3001/api/cloud/callback/dropbox')}&` +
          `state=${state || ''}`

        return dropboxAuthUrl

      default:
        throw new Error(`OAuth not supported for provider: ${provider}`)
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    provider: CloudProvider['id'],
    code: string
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    switch (provider) {
      case 'google-drive':
        if (!this.config.googleDrive) {
          throw new Error('Google Drive configuration not found')
        }

        const oauth2Client = new google.auth.OAuth2(
          this.config.googleDrive.clientId,
          this.config.googleDrive.clientSecret,
          this.config.googleDrive.redirectUri
        )

        const { tokens } = await oauth2Client.getToken(code)
        
        return {
          accessToken: tokens.access_token || '',
          refreshToken: tokens.refresh_token
        }

      case 'dropbox':
        // Dropbox token exchange implementation
        const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_id: this.config.dropbox?.clientId || '',
            client_secret: this.config.dropbox?.clientSecret || '',
            redirect_uri: 'http://localhost:3001/api/cloud/callback/dropbox'
          })
        })

        const data = await response.json()
        return {
          accessToken: data.access_token
        }

      default:
        throw new Error(`Token exchange not supported for provider: ${provider}`)
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(provider: CloudProvider['id']): Promise<{
    totalSpace: number
    usedSpace: number
    freeSpace: number
    fileCount: number
  }> {
    try {
      switch (provider) {
        case 'google-drive':
          if (!this.googleDriveClient) {
            throw new Error('Google Drive client not initialized')
          }

          const aboutResponse = await this.googleDriveClient.about.get({
            fields: 'storageQuota,user'
          })

          const quota = aboutResponse.data.storageQuota
          const totalSpace = parseInt(quota.limit) || 0
          const usedSpace = parseInt(quota.usage) || 0

          return {
            totalSpace,
            usedSpace,
            freeSpace: totalSpace - usedSpace,
            fileCount: 0 // Would need separate API call
          }

        case 'aws-s3':
          if (!this.s3Client || !this.config.awsS3) {
            throw new Error('AWS S3 client not initialized')
          }

          // S3 doesn't have storage limits, so we'll return bucket statistics
          const listResponse = await this.s3Client.listObjectsV2({
            Bucket: this.config.awsS3.bucketName
          }).promise()

          const totalSize = (listResponse.Contents || []).reduce((sum, obj) => sum + (obj.Size || 0), 0)

          return {
            totalSpace: -1, // Unlimited
            usedSpace: totalSize,
            freeSpace: -1, // Unlimited
            fileCount: listResponse.KeyCount || 0
          }

        default:
          return {
            totalSpace: 0,
            usedSpace: 0,
            freeSpace: 0,
            fileCount: 0
          }
      }
    } catch (error) {
      console.error(`Failed to get storage stats for ${provider}:`, error)
      return {
        totalSpace: 0,
        usedSpace: 0,
        freeSpace: 0,
        fileCount: 0
      }
    }
  }

  /**
   * Sync files between local storage and cloud
   */
  async syncFiles(
    provider: CloudProvider['id'],
    localDir: string,
    cloudFolder?: string
  ): Promise<{
    uploaded: string[]
    downloaded: string[]
    errors: string[]
  }> {
    const result = {
      uploaded: [] as string[],
      downloaded: [] as string[],
      errors: [] as string[]
    }

    try {
      // Get local files
      const localFiles = await fs.readdir(localDir)
      const pdfFiles = localFiles.filter(file => file.toLowerCase().endsWith('.pdf'))

      // Get cloud files
      const cloudFiles = await this.listFiles(provider, cloudFolder)
      const cloudFileNames = cloudFiles.map(f => f.name)

      // Upload files that don't exist in cloud
      for (const localFile of pdfFiles) {
        if (!cloudFileNames.includes(localFile)) {
          try {
            const filePath = path.join(localDir, localFile)
            await this.uploadFile(provider, filePath, { folder: cloudFolder })
            result.uploaded.push(localFile)
          } catch (error) {
            result.errors.push(`Failed to upload ${localFile}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      // Download files that don't exist locally
      for (const cloudFile of cloudFiles) {
        const localPath = path.join(localDir, cloudFile.name)
        try {
          await fs.access(localPath)
          // File exists locally, skip
        } catch {
          // File doesn't exist locally, download it
          try {
            const fileBuffer = await this.downloadFile(provider, cloudFile.id)
            await fs.writeFile(localPath, fileBuffer)
            result.downloaded.push(cloudFile.name)
          } catch (error) {
            result.errors.push(`Failed to download ${cloudFile.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      return result
    } catch (error) {
      result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  /**
   * Create backup of local files to cloud
   */
  async createBackup(
    provider: CloudProvider['id'],
    localDir: string,
    backupName?: string
  ): Promise<{
    backupId: string
    filesCount: number
    totalSize: number
    backupPath: string
  }> {
    const backupId = backupName || `backup_${Date.now()}`
    const backupFolder = `DocuSlicer_Backups/${backupId}`

    try {
      // Create backup folder
      await this.createFolder(provider, backupFolder)

      // Get all PDF files in local directory
      const localFiles = await fs.readdir(localDir)
      const pdfFiles = localFiles.filter(file => file.toLowerCase().endsWith('.pdf'))

      let totalSize = 0
      let filesCount = 0

      // Upload each file to backup folder
      for (const file of pdfFiles) {
        const filePath = path.join(localDir, file)
        const stats = await fs.stat(filePath)

        await this.uploadFile(provider, filePath, {
          folder: backupFolder,
          fileName: file
        })

        totalSize += stats.size
        filesCount++
      }

      return {
        backupId,
        filesCount,
        totalSize,
        backupPath: backupFolder
      }
    } catch (error) {
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Restore backup from cloud
   */
  async restoreBackup(
    provider: CloudProvider['id'],
    backupPath: string,
    localDir: string
  ): Promise<{
    restoredFiles: string[]
    errors: string[]
  }> {
    const result = {
      restoredFiles: [] as string[],
      errors: [] as string[]
    }

    try {
      // Ensure local directory exists
      await fs.mkdir(localDir, { recursive: true })

      // Get files from backup folder
      const backupFiles = await this.listFiles(provider, backupPath)

      // Download each file
      for (const file of backupFiles) {
        try {
          const fileBuffer = await this.downloadFile(provider, file.id)
          const localPath = path.join(localDir, file.name)

          await fs.writeFile(localPath, fileBuffer)
          result.restoredFiles.push(file.name)
        } catch (error) {
          result.errors.push(`Failed to restore ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return result
    } catch (error) {
      result.errors.push(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }
}
