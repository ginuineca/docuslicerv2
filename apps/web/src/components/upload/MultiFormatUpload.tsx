import React, { useState, useCallback } from 'react'
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { getDocumentType, getAcceptedFileTypes, supportedDocumentTypes, DocumentType } from '../../utils/documentTypes'

interface UploadedFile {
  file: File
  id: string
  documentType: DocumentType | null
  status: 'uploading' | 'success' | 'error'
  error?: string
}

interface MultiFormatUploadProps {
  onFilesChange: (files: UploadedFile[]) => void
  maxFiles?: number
  className?: string
}

export function MultiFormatUpload({ 
  onFilesChange, 
  maxFiles = 10, 
  className = '' 
}: MultiFormatUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const processFiles = useCallback((files: FileList) => {
    const newFiles: UploadedFile[] = []
    
    Array.from(files).forEach((file, index) => {
      if (uploadedFiles.length + newFiles.length >= maxFiles) return
      
      const documentType = getDocumentType(file.name)
      const uploadedFile: UploadedFile = {
        file,
        id: `${Date.now()}-${index}`,
        documentType,
        status: documentType ? 'success' : 'error',
        error: documentType ? undefined : 'Unsupported file type'
      }
      
      newFiles.push(uploadedFile)
    })
    
    const updatedFiles = [...uploadedFiles, ...newFiles]
    setUploadedFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }, [uploadedFiles, maxFiles, onFilesChange])

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      processFiles(files)
    }
    // Reset input
    event.target.value = ''
  }, [processFiles])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
    
    const files = event.dataTransfer.files
    if (files) {
      processFiles(files)
    }
  }, [processFiles])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId)
    setUploadedFiles(updatedFiles)
    onFilesChange(updatedFiles)
  }, [uploadedFiles, onFilesChange])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const groupedDocTypes = supportedDocumentTypes.reduce((acc, docType) => {
    if (!acc[docType.category]) {
      acc[docType.category] = []
    }
    acc[docType.category].push(docType)
    return acc
  }, {} as Record<string, DocumentType[]>)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          multiple
          accept={getAcceptedFileTypes()}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Documents
        </h3>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Supports PDF, Word, Excel, PowerPoint, Images, and more
        </p>
        
        {uploadedFiles.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            {uploadedFiles.length} of {maxFiles} files uploaded
          </div>
        )}
      </div>

      {/* Supported Formats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Supported Formats</h4>
        <div className="space-y-3">
          {Object.entries(groupedDocTypes).map(([category, types]) => (
            <div key={category}>
              <h5 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                {category === 'document' ? 'Documents' :
                 category === 'spreadsheet' ? 'Spreadsheets' :
                 category === 'presentation' ? 'Presentations' :
                 category === 'image' ? 'Images' :
                 category === 'archive' ? 'Archives' : category}
              </h5>
              <div className="flex flex-wrap gap-2">
                {types.map(docType => (
                  <span
                    key={docType.extension}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${docType.color}20`,
                      color: docType.color 
                    }}
                  >
                    <span className="mr-1">{docType.icon}</span>
                    .{docType.extension.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Uploaded Files</h4>
          <div className="space-y-2">
            {uploadedFiles.map(uploadedFile => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {uploadedFile.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : uploadedFile.status === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {uploadedFile.documentType && (
                      <span className="text-lg">{uploadedFile.documentType.icon}</span>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {uploadedFile.file.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(uploadedFile.file.size)}
                        {uploadedFile.documentType && (
                          <span className="ml-2">• {uploadedFile.documentType.name}</span>
                        )}
                      </div>
                      {uploadedFile.error && (
                        <div className="text-sm text-red-600">
                          {uploadedFile.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(uploadedFile.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
