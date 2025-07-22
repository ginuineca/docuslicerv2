import { useState, useMemo } from 'react'
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Scissors, 
  Merge, 
  Download, 
  Eye,
  Calendar,
  Filter,
  Search
} from 'lucide-react'

interface ProcessingJob {
  id: string
  type: 'split' | 'merge' | 'extract' | 'convert'
  status: 'completed' | 'processing' | 'error' | 'cancelled'
  inputFiles: string[]
  outputFiles: string[]
  createdAt: Date
  completedAt?: Date
  duration?: number // in seconds
  error?: string
  settings?: Record<string, any>
}

interface ProcessingHistoryProps {
  jobs: ProcessingJob[]
  onPreview: (jobId: string, fileName: string) => void
  onDownload: (jobId: string, fileName: string) => void
  onRetry: (jobId: string) => void
  className?: string
}

export function ProcessingHistory({
  jobs,
  onPreview,
  onDownload,
  onRetry,
  className = ''
}: ProcessingHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.inputFiles.some(file => 
        file.toLowerCase().includes(searchQuery.toLowerCase())
      ) || job.outputFiles.some(file => 
        file.toLowerCase().includes(searchQuery.toLowerCase())
      )

      const matchesStatus = statusFilter === 'all' || job.status === statusFilter
      const matchesType = typeFilter === 'all' || job.type === typeFilter

      let matchesDate = true
      if (dateFilter !== 'all') {
        const now = new Date()
        const jobDate = job.createdAt
        
        switch (dateFilter) {
          case 'today':
            matchesDate = jobDate.toDateString() === now.toDateString()
            break
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = jobDate >= weekAgo
            break
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesDate = jobDate >= monthAgo
            break
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesDate
    }).sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)

      const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime()
      const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime()

      return timeB - timeA
    })
  }, [jobs, searchQuery, statusFilter, typeFilter, dateFilter])

  const getJobIcon = (type: string) => {
    switch (type) {
      case 'split': return Scissors
      case 'merge': return Merge
      case 'extract': return Download
      default: return Clock
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'error': return AlertCircle
      case 'cancelled': return AlertCircle
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'cancelled': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getJobSummary = (job: ProcessingJob) => {
    switch (job.type) {
      case 'split':
        return `Split ${job.inputFiles.length} file into ${job.outputFiles.length} parts`
      case 'merge':
        return `Merged ${job.inputFiles.length} files into ${job.outputFiles.length} document`
      case 'extract':
        return `Extracted pages from ${job.inputFiles.length} file`
      default:
        return `Processed ${job.inputFiles.length} file(s)`
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Processing History ({filteredJobs.length})
        </h2>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="error">Error</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="split">Split</option>
            <option value="merge">Merge</option>
            <option value="extract">Extract</option>
            <option value="convert">Convert</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Job List */}
      <div className="divide-y divide-gray-200">
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No processing history</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all'
                ? 'No jobs match your current filters'
                : 'Start processing some PDFs to see your history here'
              }
            </p>
          </div>
        ) : (
          filteredJobs.map(job => {
            const JobIcon = getJobIcon(job.type)
            const StatusIcon = getStatusIcon(job.status)

            return (
              <div key={job.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  {/* Job Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <JobIcon className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900 capitalize">
                          {job.type} Operation
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {job.status}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(job.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {getJobSummary(job)}
                    </p>

                    {/* Input Files */}
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Input Files:</p>
                      <div className="flex flex-wrap gap-1">
                        {job.inputFiles.map((file, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {file}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Output Files */}
                    {job.outputFiles.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Output Files:</p>
                        <div className="flex flex-wrap gap-1">
                          {job.outputFiles.map((file, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
                            >
                              <span>{file}</span>
                              {job.status === 'completed' && (
                                <div className="flex items-center space-x-1 ml-2">
                                  <button
                                    onClick={() => onPreview(job.id, file)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Preview"
                                  >
                                    <Eye className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => onDownload(job.id, file)}
                                    className="text-green-600 hover:text-green-800"
                                    title="Download"
                                  >
                                    <Download className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Job Stats */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {job.duration && (
                        <span>Duration: {formatDuration(job.duration)}</span>
                      )}
                      {job.completedAt && (
                        <span>Completed: {formatDate(job.completedAt)}</span>
                      )}
                    </div>

                    {/* Error Message */}
                    {job.status === 'error' && job.error && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-700">{job.error}</p>
                        <button
                          onClick={() => onRetry(job.id)}
                          className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Retry Operation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
