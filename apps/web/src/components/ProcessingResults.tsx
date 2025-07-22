import { useState } from 'react'
import { Download, Eye, CheckCircle, AlertCircle, Clock } from 'lucide-react'

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

interface ProcessingResultsProps {
  results: ProcessedResult[]
  onPreview: (result: ProcessedResult) => void
  onDownload: (result: ProcessedResult) => void
  onDownloadAll: () => void
}

export function ProcessingResults({ 
  results, 
  onPreview, 
  onDownload, 
  onDownloadAll 
}: ProcessingResultsProps) {
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set())

  const completedResults = results.filter(r => r.status === 'completed')
  const processingResults = results.filter(r => r.status === 'processing')
  const errorResults = results.filter(r => r.status === 'error')

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedResults)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedResults(newSelection)
  }

  const selectAll = () => {
    if (selectedResults.size === completedResults.length) {
      setSelectedResults(new Set())
    } else {
      setSelectedResults(new Set(completedResults.map(r => r.id)))
    }
  }

  const downloadSelected = () => {
    selectedResults.forEach(id => {
      const result = results.find(r => r.id === id)
      if (result && result.status === 'completed') {
        onDownload(result)
      }
    })
  }

  if (results.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Processing Results ({results.length} files)
        </h3>
        
        {completedResults.length > 0 && (
          <div className="flex items-center space-x-3">
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {selectedResults.size === completedResults.length ? 'Deselect All' : 'Select All'}
            </button>
            
            {selectedResults.size > 0 && (
              <button
                onClick={downloadSelected}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Download Selected ({selectedResults.size})</span>
              </button>
            )}
            
            <button
              onClick={onDownloadAll}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download All</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Completed</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">{completedResults.length}</p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Processing</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">{processingResults.length}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-800">Errors</span>
          </div>
          <p className="text-2xl font-bold text-red-900 mt-1">{errorResults.length}</p>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {results.map(result => (
          <div
            key={result.id}
            className={`p-4 border rounded-lg ${
              result.status === 'completed' ? 'border-green-200 bg-green-50' :
              result.status === 'error' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                {result.status === 'completed' && (
                  <input
                    type="checkbox"
                    checked={selectedResults.has(result.id)}
                    onChange={() => toggleSelection(result.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {result.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {result.status === 'processing' && <Clock className="h-4 w-4 text-blue-600" />}
                    {result.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                    
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.name}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1">
                    {result.pages && (
                      <span className="text-xs text-gray-500">
                        {result.pages} pages
                      </span>
                    )}
                    {result.size && (
                      <span className="text-xs text-gray-500">
                        {formatFileSize(result.size)}
                      </span>
                    )}
                    {result.status === 'error' && result.error && (
                      <span className="text-xs text-red-600">
                        {result.error}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar for Processing */}
              {result.status === 'processing' && (
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${result.progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 min-w-0">
                    {Math.round(result.progress)}%
                  </span>
                </div>
              )}

              {/* Actions for Completed */}
              {result.status === 'completed' && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onPreview(result)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDownload(result)}
                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-md"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
