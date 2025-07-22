import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileText, 
  Play, 
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Download,
  RefreshCw,
  Users,
  Zap
} from 'lucide-react'

interface BatchFile {
  id: string
  file: File
  name: string
  size: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number
  error?: string
}

interface BatchJob {
  id: string
  type: 'split' | 'merge' | 'ocr' | 'template'
  status: 'waiting' | 'active' | 'completed' | 'failed'
  progress: {
    current: number
    total: number
    currentFile?: string
    stage: string
    percentage: number
  } | null
  filesCount: number
  createdAt: Date
  completedAt?: Date
  result?: {
    success: boolean
    outputFiles: string[]
    errors: string[]
    stats: {
      totalFiles: number
      successfulFiles: number
      failedFiles: number
      totalSize: number
      processingTime: number
    }
  }
}

interface BatchProcessorProps {
  onJobComplete?: (job: BatchJob) => void
  className?: string
}

export function BatchProcessor({ onJobComplete, className = '' }: BatchProcessorProps) {
  const [files, setFiles] = useState<BatchFile[]>([])
  const [operation, setOperation] = useState<'split' | 'merge' | 'ocr' | 'template'>('split')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null)
  const [jobHistory, setJobHistory] = useState<BatchJob[]>([])
  const [config, setConfig] = useState<Record<string, any>>({})

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: BatchFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      status: 'pending'
    }))
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']
    },
    maxFiles: 50
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const clearAllFiles = () => {
    setFiles([])
  }

  const startBatchProcessing = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    
    try {
      // Create FormData for file upload
      const formData = new FormData()
      files.forEach(fileItem => {
        formData.append('files', fileItem.file)
      })

      // Add configuration
      Object.entries(config).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
      })

      // Simulate API call - in real app, this would call the actual API
      const mockJob: BatchJob = {
        id: `job_${Date.now()}`,
        type: operation,
        status: 'active',
        progress: {
          current: 0,
          total: files.length,
          stage: 'starting',
          percentage: 0
        },
        filesCount: files.length,
        createdAt: new Date()
      }

      setCurrentJob(mockJob)

      // Simulate processing progress
      for (let i = 0; i <= files.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const updatedJob: BatchJob = {
          ...mockJob,
          progress: {
            current: i,
            total: files.length,
            currentFile: i < files.length ? files[i].name : undefined,
            stage: i === files.length ? 'completed' : 'processing',
            percentage: Math.round((i / files.length) * 100)
          }
        }

        setCurrentJob(updatedJob)

        // Update file status
        if (i < files.length) {
          setFiles(prev => prev.map((file, index) => 
            index === i ? { ...file, status: 'processing' as const } : file
          ))
        }
      }

      // Complete the job
      const completedJob: BatchJob = {
        ...mockJob,
        status: 'completed',
        completedAt: new Date(),
        result: {
          success: true,
          outputFiles: files.map(f => `processed_${f.name}`),
          errors: [],
          stats: {
            totalFiles: files.length,
            successfulFiles: files.length,
            failedFiles: 0,
            totalSize: files.reduce((sum, f) => sum + f.size, 0),
            processingTime: files.length * 1000 // Mock processing time
          }
        }
      }

      setCurrentJob(completedJob)
      setJobHistory(prev => [completedJob, ...prev])
      
      // Mark all files as completed
      setFiles(prev => prev.map(file => ({ ...file, status: 'completed' as const })))

      if (onJobComplete) {
        onJobComplete(completedJob)
      }

    } catch (error) {
      console.error('Batch processing error:', error)
      
      const failedJob: BatchJob = {
        id: `job_${Date.now()}`,
        type: operation,
        status: 'failed',
        progress: null,
        filesCount: files.length,
        createdAt: new Date(),
        completedAt: new Date()
      }
      
      setCurrentJob(failedJob)
      setJobHistory(prev => [failedJob, ...prev])
    } finally {
      setIsProcessing(false)
    }
  }

  const cancelProcessing = () => {
    setIsProcessing(false)
    setCurrentJob(null)
    setFiles(prev => prev.map(file => ({ ...file, status: 'pending' })))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock
      case 'processing': case 'active': return RefreshCw
      case 'completed': return CheckCircle
      case 'error': case 'failed': return AlertCircle
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-100'
      case 'processing': case 'active': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'error': case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Batch Processing</h2>
          <div className="flex items-center space-x-2">
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value as any)}
              disabled={isProcessing}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="split">Batch Split</option>
              <option value="merge">Batch Merge</option>
              <option value="ocr">Batch OCR</option>
              <option value="template">Apply Template</option>
            </select>
          </div>
        </div>

        {/* File Upload Area */}
        {!isProcessing && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop files here' : 'Upload Files for Batch Processing'}
            </p>
            <p className="text-gray-600">
              Drag and drop up to 50 PDF or image files, or click to browse
            </p>
          </div>
        )}

        {/* File List */}
        {files.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">
                Files ({files.length}) - {formatFileSize(totalSize)}
              </h3>
              {!isProcessing && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearAllFiles}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map(file => {
                const StatusIcon = getStatusIcon(file.status)
                const statusColorClass = getStatusColor(file.status)

                return (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${statusColorClass}`}>
                        <StatusIcon className={`h-3 w-3 mr-1 ${file.status === 'processing' ? 'animate-spin' : ''}`} />
                        {file.status}
                      </span>
                      
                      {!isProcessing && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Current Job Progress */}
        {currentJob && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-900">
                {operation.charAt(0).toUpperCase() + operation.slice(1)} Processing
              </h4>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(currentJob.status)}`}>
                {currentJob.status}
              </span>
            </div>

            {currentJob.progress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">
                    {currentJob.progress.currentFile || currentJob.progress.stage}
                  </span>
                  <span className="text-blue-600">
                    {currentJob.progress.current}/{currentJob.progress.total} ({currentJob.progress.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${currentJob.progress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {currentJob.result && (
              <div className="mt-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-green-600">✓ Successful: {currentJob.result.stats.successfulFiles}</span>
                  </div>
                  <div>
                    <span className="text-red-600">✗ Failed: {currentJob.result.stats.failedFiles}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">⏱ Time: {formatDuration(currentJob.result.stats.processingTime)}</span>
                  </div>
                  <div>
                    <span className="text-purple-600">📁 Size: {formatFileSize(currentJob.result.stats.totalSize)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {files.length > 0 && `${files.length} files ready for ${operation} processing`}
          </div>
          
          <div className="flex items-center space-x-3">
            {isProcessing ? (
              <button
                onClick={cancelProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Pause className="h-4 w-4" />
                <span>Cancel</span>
              </button>
            ) : (
              <button
                onClick={startBatchProcessing}
                disabled={files.length === 0}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Play className="h-4 w-4" />
                <span>Start Batch Processing</span>
              </button>
            )}
          </div>
        </div>

        {/* Job History */}
        {jobHistory.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">Recent Jobs</h3>
            <div className="space-y-3">
              {jobHistory.slice(0, 5).map(job => {
                const StatusIcon = getStatusIcon(job.status)
                const statusColorClass = getStatusColor(job.status)

                return (
                  <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Zap className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {job.type.charAt(0).toUpperCase() + job.type.slice(1)} - {job.filesCount} files
                        </p>
                        <p className="text-xs text-gray-500">
                          {job.createdAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {job.result && (
                        <div className="text-xs text-gray-600">
                          {job.result.stats.successfulFiles}/{job.result.stats.totalFiles} successful
                        </div>
                      )}
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${statusColorClass}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {job.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
