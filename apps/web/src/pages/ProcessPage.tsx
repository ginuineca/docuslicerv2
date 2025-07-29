import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components'
import { pdfService } from '../services/pdfService'
import { PDFUpload } from '../components/PDFUpload'
import { PDFViewer } from '../components/PDFViewer'
import { PDFSplitter } from '../components/PDFSplitter'
import { PDFMerger } from '../components/PDFMerger'
import { PDFFormProcessor } from '../components/PDFFormProcessor'
import { PDFOCRExtractor } from '../components/PDFOCRExtractor'
import { TemplateBrowser } from '../components/TemplateBrowser'
import { BatchProcessor } from '../components/BatchProcessor'
import { AIDocumentAnalyzer } from '../components/AIDocumentAnalyzer'
import { PDFSecurityCenter } from '../components/PDFSecurityCenter'
import { ProcessingResults } from '../components/ProcessingResults'
import { Modal } from '../components/Modal'
import { Link } from 'react-router-dom'
import { ArrowLeft, Scissors, Merge, Download, Eye, FileText, Zap, Layout, Users, Brain, Shield } from 'lucide-react'

interface ProcessedFile {
  id: string
  fileId: string
  name: string
  size: number
  pages: number
  file: File
}

interface ProcessedResult {
  id: string
  name: string
  status: 'processing' | 'completed' | 'error'
  progress: number
  downloadUrl?: string
  error?: string
  pages?: number
  size?: number
}

interface SplitRange {
  id: string
  start: number
  end: number
  name: string
}

export function ProcessPage() {
  const { user } = useAuth()
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedFile[]>([])
  const [selectedOperation, setSelectedOperation] = useState<string>('')
  const [previewFile, setPreviewFile] = useState<ProcessedFile | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [processingResults, setProcessingResults] = useState<ProcessedResult[]>([])
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null)

  const handleFilesUploaded = async (files: Array<{ file: File; fileId: string; info: any }>) => {
    // Process files with real metadata from server
    const processedFiles: ProcessedFile[] = files.map((fileData) => ({
      id: Math.random().toString(36).substr(2, 9),
      fileId: fileData.fileId,
      name: fileData.file.name,
      size: fileData.file.size,
      pages: fileData.info.pages,
      file: fileData.file
    }))

    setUploadedFiles(prev => [...prev, ...processedFiles])
  }

  const operations = [
    {
      id: 'split',
      name: 'Split PDF',
      description: 'Split a PDF into multiple files',
      icon: Scissors,
      color: 'blue'
    },
    {
      id: 'merge',
      name: 'Merge PDFs',
      description: 'Combine multiple PDFs into one',
      icon: Merge,
      color: 'green'
    },
    {
      id: 'extract',
      name: 'Extract Pages',
      description: 'Extract specific pages from PDF',
      icon: Download,
      color: 'purple'
    },
    {
      id: 'forms',
      name: 'Process Forms',
      description: 'Fill and extract PDF form data',
      icon: FileText,
      color: 'blue'
    },
    {
      id: 'ocr',
      name: 'OCR Text Extraction',
      description: 'Extract text from scanned PDFs and images',
      icon: Zap,
      color: 'purple'
    },
    {
      id: 'templates',
      name: 'Use Templates',
      description: 'Browse and use pre-built processing templates',
      icon: Layout,
      color: 'indigo'
    },
    {
      id: 'batch',
      name: 'Batch Processing',
      description: 'Process multiple files simultaneously',
      icon: Users,
      color: 'green'
    },
    {
      id: 'ai',
      name: 'AI Analysis',
      description: 'Intelligent document analysis and insights',
      icon: Brain,
      color: 'purple'
    },
    {
      id: 'security',
      name: 'PDF Security',
      description: 'Password protection, encryption, and digital signatures',
      icon: Shield,
      color: 'red'
    }
  ]

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const openPreview = (file: ProcessedFile) => {
    setPreviewFile(file)
    setIsPreviewOpen(true)
  }

  const closePreview = () => {
    setIsPreviewOpen(false)
    setPreviewFile(null)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleSplit = async (ranges: SplitRange[]) => {
    if (!selectedFile) return

    try {
      // Convert ranges to service format
      const serviceRanges = ranges.map(range => ({
        start: range.start,
        end: range.end,
        name: range.name
      }))

      // Create processing results
      const newResults: ProcessedResult[] = ranges.map(range => ({
        id: Math.random().toString(36).substr(2, 9),
        name: `${range.name}.pdf`,
        status: 'processing' as const,
        progress: 0,
        pages: range.end - range.start + 1
      }))

      setProcessingResults(prev => [...prev, ...newResults])

      // Perform actual split
      const splitResults = await pdfService.splitPDF(selectedFile.fileId, serviceRanges)

      // Update results with actual data
      setProcessingResults(prev =>
        prev.map((result, index) => {
          const splitResult = splitResults[index]
          if (splitResult) {
            return {
              ...result,
              status: splitResult.status,
              progress: splitResult.progress,
              downloadUrl: splitResult.downloadUrl,
              error: splitResult.error
            }
          }
          return result
        })
      )

    } catch (error) {
      // Handle error
      setProcessingResults(prev =>
        prev.map(result => ({
          ...result,
          status: 'error' as const,
          progress: 0,
          error: error instanceof Error ? error.message : 'Split failed'
        }))
      )
    }
  }

  const simulateProcessing = (resultId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 5
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setProcessingResults(prev =>
          prev.map(r =>
            r.id === resultId
              ? {
                  ...r,
                  status: 'completed',
                  progress: 100,
                  downloadUrl: '#', // In real app, this would be the actual download URL
                  size: Math.floor(Math.random() * 1000000) + 100000 // Simulate file size
                }
              : r
          )
        )
      } else {
        setProcessingResults(prev =>
          prev.map(r =>
            r.id === resultId
              ? { ...r, progress }
              : r
          )
        )
      }
    }, 300)
  }

  const handleDownload = (result: ProcessedResult) => {
    // In a real app, this would download the actual file
    console.log('Downloading:', result.name)
    // Simulate download
    const link = document.createElement('a')
    link.href = '#'
    link.download = result.name
    link.click()
  }

  const handleDownloadAll = () => {
    const completedResults = processingResults.filter(r => r.status === 'completed')
    completedResults.forEach(result => handleDownload(result))
  }

  const handlePreviewResult = (result: ProcessedResult) => {
    // In a real app, this would preview the processed file
    console.log('Previewing result:', result.name)
  }

  const startProcessing = () => {
    if (selectedOperation === 'split' && uploadedFiles.length > 0) {
      setSelectedFile(uploadedFiles[0]) // For now, process the first file
    } else if (selectedOperation === 'merge' && uploadedFiles.length >= 2) {
      // For merge, we work with all uploaded files
      setSelectedFile(uploadedFiles[0]) // Just to trigger the merge UI
    }
  }

  const handleMerge = async (files: any[], outputName: string) => {
    // Create a single processing result for the merged file
    const mergeResult: ProcessedResult = {
      id: Math.random().toString(36).substr(2, 9),
      name: `${outputName}.pdf`,
      status: 'processing',
      progress: 0,
      pages: files.reduce((total, file) => total + file.pages, 0),
      size: files.reduce((total, file) => total + file.size, 0)
    }

    setProcessingResults(prev => [...prev, mergeResult])
    simulateProcessing(mergeResult.id)
  }

  const handleRemoveFromMerge = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleAddMoreFiles = () => {
    // This would trigger the file upload dialog
    console.log('Add more files for merging')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <Logo />
              <h1 className="text-xl font-semibold text-gray-900">PDF Processor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Upload PDF Files
              </h2>
              <PDFUpload 
                onFilesUploaded={handleFilesUploaded}
                maxFiles={5}
                maxSize={50 * 1024 * 1024} // 50MB
              />
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Your Files ({uploadedFiles.length})
                </h2>
                <div className="space-y-3">
                  {uploadedFiles.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Eye className="h-5 w-5 text-red-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {file.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {file.pages} pages • {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openPreview(file)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Operations Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Choose Operation
              </h2>
              <div className="space-y-3">
                {operations.map(operation => {
                  const Icon = operation.icon
                  const isSelected = selectedOperation === operation.id
                  const colorClasses = {
                    blue: isSelected ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:border-blue-200',
                    green: isSelected ? 'bg-green-50 border-green-200' : 'border-gray-200 hover:border-green-200',
                    purple: isSelected ? 'bg-purple-50 border-purple-200' : 'border-gray-200 hover:border-purple-200'
                  }

                  return (
                    <button
                      key={operation.id}
                      onClick={() => setSelectedOperation(operation.id)}
                      className={`w-full text-left p-4 border rounded-lg transition-colors ${colorClasses[operation.color as keyof typeof colorClasses]}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`h-6 w-6 ${
                          operation.color === 'blue' ? 'text-blue-600' :
                          operation.color === 'green' ? 'text-green-600' :
                          'text-purple-600'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {operation.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {operation.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Process Button */}
              {selectedOperation && uploadedFiles.length > 0 && !selectedFile && (
                <div className="mt-6">
                  <button
                    onClick={startProcessing}
                    disabled={selectedOperation === 'merge' && uploadedFiles.length < 2}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Start {selectedOperation === 'split' ? 'Splitting' : selectedOperation === 'merge' ? 'Merging' : 'Processing'}
                  </button>
                  {selectedOperation === 'merge' && uploadedFiles.length < 2 && (
                    <p className="text-sm text-red-600 mt-2 text-center">
                      Upload at least 2 PDF files to merge
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* PDF Splitter */}
          {selectedFile && selectedOperation === 'split' && (
            <div className="lg:col-span-3 mt-8">
              <PDFSplitter
                file={selectedFile.file}
                fileId={selectedFile.fileId}
                totalPages={selectedFile.pages}
                onSplit={handleSplit}
                onPreview={openPreview}
              />
            </div>
          )}

          {/* PDF Merger */}
          {selectedFile && selectedOperation === 'merge' && (
            <div className="lg:col-span-3 mt-8">
              <PDFMerger
                files={uploadedFiles.map(f => ({
                  id: f.id,
                  name: f.name,
                  pages: f.pages,
                  size: f.size,
                  file: f.file
                }))}
                onMerge={handleMerge}
                onPreview={(file) => {
                  const originalFile = uploadedFiles.find(f => f.id === file.id)
                  if (originalFile) openPreview(originalFile)
                }}
                onRemoveFile={handleRemoveFromMerge}
                onAddFiles={handleAddMoreFiles}
              />
            </div>
          )}

          {/* PDF Form Processor */}
          {selectedOperation === 'forms' && (
            <div className="lg:col-span-3 mt-8">
              <PDFFormProcessor
                onFormFilled={(result) => {
                  console.log('Form filled:', result)
                  // Add to processing results
                  const formResult: ProcessedResult = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: result.file.name,
                    status: 'completed',
                    progress: 100,
                    downloadUrl: result.file.downloadUrl,
                    pages: result.file.pages,
                    size: result.file.size
                  }
                  setProcessingResults(prev => [...prev, formResult])
                }}
              />
            </div>
          )}

          {/* PDF OCR Extractor */}
          {selectedOperation === 'ocr' && (
            <div className="lg:col-span-3 mt-8">
              <PDFOCRExtractor
                onTextExtracted={(result) => {
                  console.log('Text extracted:', result)
                  // Add to processing results
                  const ocrResult: ProcessedResult = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: `${uploadedFile?.name || 'document'}_extracted_text.txt`,
                    status: 'completed',
                    progress: 100,
                    pages: result.totalPages,
                    size: result.fullText.length // Approximate size
                  }
                  setProcessingResults(prev => [...prev, ocrResult])
                }}
              />
            </div>
          )}

          {/* Template Browser */}
          {selectedOperation === 'templates' && (
            <div className="lg:col-span-3 mt-8">
              <TemplateBrowser
                onUseTemplate={(template) => {
                  console.log('Using template:', template.name)
                  // In a real app, this would execute the template
                  const templateResult: ProcessedResult = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: `${template.name}_result`,
                    status: 'completed',
                    progress: 100,
                    pages: 1,
                    size: 1024
                  }
                  setProcessingResults(prev => [...prev, templateResult])
                }}
              />
            </div>
          )}

          {/* Batch Processor */}
          {selectedOperation === 'batch' && (
            <div className="lg:col-span-3 mt-8">
              <BatchProcessor
                onJobComplete={(job) => {
                  console.log('Batch job completed:', job)
                  // Add batch results to processing results
                  if (job.result) {
                    const batchResults: ProcessedResult[] = job.result.outputFiles.map((file, index) => ({
                      id: Math.random().toString(36).substr(2, 9),
                      name: file,
                      status: 'completed',
                      progress: 100,
                      pages: 1,
                      size: Math.floor(job.result!.stats.totalSize / job.result!.outputFiles.length)
                    }))
                    setProcessingResults(prev => [...prev, ...batchResults])
                  }
                }}
              />
            </div>
          )}

          {/* AI Document Analyzer */}
          {selectedOperation === 'ai' && (
            <div className="lg:col-span-3 mt-8">
              <AIDocumentAnalyzer
                onAnalysisComplete={(results) => {
                  console.log('AI analysis completed:', results)
                  // Add AI analysis result to processing results
                  const aiResult: ProcessedResult = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: `${uploadedFile?.name || 'document'}_ai_analysis.json`,
                    status: 'completed',
                    progress: 100,
                    pages: 1,
                    size: JSON.stringify(results).length
                  }
                  setProcessingResults(prev => [...prev, aiResult])
                }}
              />
            </div>
          )}

          {/* PDF Security Center */}
          {selectedOperation === 'security' && (
            <div className="lg:col-span-3 mt-8">
              <PDFSecurityCenter
                onSecurityComplete={(result) => {
                  console.log('Security operation completed:', result)
                  // Add security result to processing results
                  if (result.success && result.file) {
                    const securityResult: ProcessedResult = {
                      id: Math.random().toString(36).substr(2, 9),
                      name: result.file.name,
                      status: 'completed',
                      progress: 100,
                      pages: 1,
                      size: result.file.size
                    }
                    setProcessingResults(prev => [...prev, securityResult])
                  }
                }}
              />
            </div>
          )}

          {/* Processing Results */}
          {processingResults.length > 0 && (
            <div className="lg:col-span-3 mt-8">
              <ProcessingResults
                results={processingResults}
                onPreview={handlePreviewResult}
                onDownload={handleDownload}
                onDownloadAll={handleDownloadAll}
              />
            </div>
          )}
        </div>
      </main>

      {/* PDF Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        title={previewFile ? `Preview: ${previewFile.name}` : 'PDF Preview'}
        size="xl"
      >
        {previewFile && (
          <PDFViewer
            file={previewFile.file}
            onLoadSuccess={(pdf) => {
              console.log('PDF loaded successfully:', pdf)
            }}
          />
        )}
      </Modal>
    </div>
  )
}
