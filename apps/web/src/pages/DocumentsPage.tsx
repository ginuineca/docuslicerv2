import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components'
import { FileBrowser } from '../components/FileBrowser'
import { ProcessingHistory } from '../components/ProcessingHistory'
import { PDFViewer } from '../components/PDFViewer'
import { Modal } from '../components/Modal'
import { Link } from 'react-router-dom'
import { ArrowLeft, Upload, Plus, FolderOpen, Clock } from 'lucide-react'

interface FileItem {
  id: string
  name: string
  type: 'pdf' | 'folder'
  size: number
  pages?: number
  createdAt: Date
  modifiedAt: Date
  status: 'completed' | 'processing' | 'error'
  thumbnail?: string
  tags: string[]
}

interface ProcessingJob {
  id: string
  type: 'split' | 'merge' | 'extract' | 'convert'
  status: 'completed' | 'processing' | 'error' | 'cancelled'
  inputFiles: string[]
  outputFiles: string[]
  createdAt: Date
  completedAt?: Date
  duration?: number
  error?: string
  settings?: Record<string, any>
}

export function DocumentsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'files' | 'history'>('files')
  const [files, setFiles] = useState<FileItem[]>([])
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([])
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const mockFiles: FileItem[] = [
      {
        id: '1',
        name: 'Annual Report 2024.pdf',
        type: 'pdf',
        size: 2500000,
        pages: 45,
        createdAt: new Date('2024-01-15'),
        modifiedAt: new Date('2024-01-15'),
        status: 'completed',
        tags: ['report', 'annual', '2024']
      },
      {
        id: '2',
        name: 'Contract Template.pdf',
        type: 'pdf',
        size: 850000,
        pages: 12,
        createdAt: new Date('2024-01-10'),
        modifiedAt: new Date('2024-01-12'),
        status: 'completed',
        tags: ['contract', 'template', 'legal']
      },
      {
        id: '3',
        name: 'Invoice_2024_001.pdf',
        type: 'pdf',
        size: 125000,
        pages: 2,
        createdAt: new Date('2024-01-20'),
        modifiedAt: new Date('2024-01-20'),
        status: 'processing',
        tags: ['invoice', '2024', 'billing']
      },
      {
        id: '4',
        name: 'User Manual v2.pdf',
        type: 'pdf',
        size: 5200000,
        pages: 128,
        createdAt: new Date('2024-01-08'),
        modifiedAt: new Date('2024-01-18'),
        status: 'completed',
        tags: ['manual', 'documentation', 'v2']
      }
    ]

    const mockJobs: ProcessingJob[] = [
      {
        id: 'job1',
        type: 'split',
        status: 'completed',
        inputFiles: ['Annual Report 2024.pdf'],
        outputFiles: ['Annual_Report_Part1.pdf', 'Annual_Report_Part2.pdf', 'Annual_Report_Part3.pdf'],
        createdAt: new Date('2024-01-20T10:30:00'),
        completedAt: new Date('2024-01-20T10:32:15'),
        duration: 135
      },
      {
        id: 'job2',
        type: 'merge',
        status: 'completed',
        inputFiles: ['Contract_Page1.pdf', 'Contract_Page2.pdf', 'Contract_Appendix.pdf'],
        outputFiles: ['Complete_Contract.pdf'],
        createdAt: new Date('2024-01-19T14:15:00'),
        completedAt: new Date('2024-01-19T14:16:30'),
        duration: 90
      },
      {
        id: 'job3',
        type: 'split',
        status: 'error',
        inputFiles: ['Corrupted_File.pdf'],
        outputFiles: [],
        createdAt: new Date('2024-01-18T16:45:00'),
        error: 'File appears to be corrupted or password protected'
      },
      {
        id: 'job4',
        type: 'extract',
        status: 'processing',
        inputFiles: ['User Manual v2.pdf'],
        outputFiles: [],
        createdAt: new Date('2024-01-20T11:00:00')
      }
    ]

    setFiles(mockFiles)
    setProcessingJobs(mockJobs)
  }, [])

  const handlePreview = (file: FileItem) => {
    setPreviewFile(file)
    setIsPreviewOpen(true)
  }

  const handleDownload = (file: FileItem) => {
    console.log('Downloading:', file.name)
    // In real app, this would trigger actual download
  }

  const handleDelete = (file: FileItem) => {
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      setFiles(prev => prev.filter(f => f.id !== file.id))
    }
  }

  const handleRename = (file: FileItem, newName: string) => {
    setFiles(prev => prev.map(f => 
      f.id === file.id ? { ...f, name: newName } : f
    ))
  }

  const handleJobPreview = (jobId: string, fileName: string) => {
    console.log('Previewing job result:', jobId, fileName)
    // In real app, this would open the processed file
  }

  const handleJobDownload = (jobId: string, fileName: string) => {
    console.log('Downloading job result:', jobId, fileName)
    // In real app, this would download the processed file
  }

  const handleJobRetry = (jobId: string) => {
    console.log('Retrying job:', jobId)
    // In real app, this would retry the failed job
  }

  const closePreview = () => {
    setIsPreviewOpen(false)
    setPreviewFile(null)
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
              <h1 className="text-xl font-semibold text-gray-900">My Documents</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/process"
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                <span>Process PDFs</span>
              </Link>
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('files')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-4 w-4" />
                  <span>My Files ({files.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Processing History ({processingJobs.length})</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'files' ? (
          <FileBrowser
            files={files}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onRename={handleRename}
          />
        ) : (
          <ProcessingHistory
            jobs={processingJobs}
            onPreview={handleJobPreview}
            onDownload={handleJobDownload}
            onRetry={handleJobRetry}
          />
        )}

        {/* Quick Actions */}
        {activeTab === 'files' && files.length === 0 && (
          <div className="text-center py-12">
            <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-6">
              Start by uploading and processing your first PDF document
            </p>
            <Link
              to="/process"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              <Upload className="h-5 w-5" />
              <span>Upload & Process PDFs</span>
            </Link>
          </div>
        )}
      </main>

      {/* PDF Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        title={previewFile ? `Preview: ${previewFile.name}` : 'PDF Preview'}
        size="xl"
      >
        {previewFile && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              PDF preview would be shown here for: {previewFile.name}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              In a real application, this would display the actual PDF content
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
