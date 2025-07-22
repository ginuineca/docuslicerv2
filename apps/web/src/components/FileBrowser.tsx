import { useState, useMemo } from 'react'
import { 
  Grid, 
  List, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  MoreVertical,
  Calendar,
  FileText,
  Folder,
  SortAsc,
  SortDesc
} from 'lucide-react'

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

interface FileBrowserProps {
  files: FileItem[]
  onPreview: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  onDelete: (file: FileItem) => void
  onRename: (file: FileItem, newName: string) => void
  className?: string
}

type ViewMode = 'grid' | 'list'
type SortField = 'name' | 'size' | 'createdAt' | 'modifiedAt'
type SortOrder = 'asc' | 'desc'

export function FileBrowser({
  files,
  onPreview,
  onDownload,
  onDelete,
  onRename,
  className = ''
}: FileBrowserProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('modifiedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || file.status === statusFilter
      
      return matchesSearch && matchesStatus
    })

    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'createdAt' || sortField === 'modifiedAt') {
        const dateA = aValue instanceof Date ? aValue : new Date(aValue)
        const dateB = bValue instanceof Date ? bValue : new Date(bValue)

        aValue = isNaN(dateA.getTime()) ? 0 : dateA.getTime()
        bValue = isNaN(dateB.getTime()) ? 0 : dateB.getTime()
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [files, searchQuery, sortField, sortOrder, statusFilter])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles)
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId)
    } else {
      newSelection.add(fileId)
    }
    setSelectedFiles(newSelection)
  }

  const selectAll = () => {
    if (selectedFiles.size === filteredAndSortedFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(filteredAndSortedFiles.map(f => f.id)))
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            My Documents ({filteredAndSortedFiles.length})
          </h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 border rounded-md ${showFilters ? 'bg-blue-50 border-blue-200' : 'border-gray-300'}`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="error">Error</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                  <option value="createdAt">Created</option>
                  <option value="modifiedAt">Modified</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedFiles.size > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700">
              {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Download Selected
              </button>
              <button className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File List/Grid */}
      <div className="p-6">
        {filteredAndSortedFiles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try adjusting your search or filters' : 'Upload some PDF files to get started'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedFiles.map(file => (
              <div
                key={file.id}
                className={`relative p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
                  selectedFiles.has(file.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => toggleFileSelection(file.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <FileText className="h-8 w-8 text-red-500" />
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(file.status)}`}>
                    {file.status}
                  </span>
                </div>
                
                <h3 className="font-medium text-gray-900 truncate mb-1">{file.name}</h3>
                <p className="text-sm text-gray-500 mb-2">
                  {file.pages && `${file.pages} pages • `}{formatFileSize(file.size)}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(file.modifiedAt)}
                </p>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onPreview(file)
                      }}
                      className="p-1 bg-white rounded shadow hover:bg-gray-50"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDownload(file)
                      }}
                      className="p-1 bg-white rounded shadow hover:bg-gray-50"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {/* List Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-500 border-b">
              <div className="col-span-1">
                <input
                  type="checkbox"
                  checked={selectedFiles.size === filteredAndSortedFiles.length && filteredAndSortedFiles.length > 0}
                  onChange={selectAll}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="col-span-4 cursor-pointer" onClick={() => handleSort('name')}>
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  {sortField === 'name' && (
                    sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                  )}
                </div>
              </div>
              <div className="col-span-2 cursor-pointer" onClick={() => handleSort('size')}>
                <div className="flex items-center space-x-1">
                  <span>Size</span>
                  {sortField === 'size' && (
                    sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                  )}
                </div>
              </div>
              <div className="col-span-2 cursor-pointer" onClick={() => handleSort('modifiedAt')}>
                <div className="flex items-center space-x-1">
                  <span>Modified</span>
                  {sortField === 'modifiedAt' && (
                    sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                  )}
                </div>
              </div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* List Items */}
            {filteredAndSortedFiles.map(file => (
              <div
                key={file.id}
                className={`grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 ${
                  selectedFiles.has(file.id) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="col-span-4 flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    {file.pages && (
                      <p className="text-xs text-gray-500">{file.pages} pages</p>
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </div>
                <div className="col-span-2 text-sm text-gray-500">
                  {formatDate(file.modifiedAt)}
                </div>
                <div className="col-span-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(file.status)}`}>
                    {file.status}
                  </span>
                </div>
                <div className="col-span-1">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onPreview(file)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDownload(file)}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(file)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
