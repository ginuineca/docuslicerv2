import { useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Merge, GripVertical, Eye, X, Plus, Download } from 'lucide-react'

interface MergeFile {
  id: string
  name: string
  pages: number
  size: number
  file: File
}

interface PDFMergerProps {
  files: MergeFile[]
  onMerge: (files: MergeFile[], outputName: string) => void
  onPreview: (file: MergeFile) => void
  onRemoveFile: (fileId: string) => void
  onAddFiles: () => void
}

export function PDFMerger({ 
  files, 
  onMerge, 
  onPreview, 
  onRemoveFile, 
  onAddFiles 
}: PDFMergerProps) {
  const [mergeFiles, setMergeFiles] = useState<MergeFile[]>(files)
  const [outputName, setOutputName] = useState<string>('merged_document')
  const [preserveBookmarks, setPreserveBookmarks] = useState<boolean>(true)
  const [addPageNumbers, setAddPageNumbers] = useState<boolean>(false)

  // Update local state when files prop changes
  useState(() => {
    setMergeFiles(files)
  }, [files])

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(mergeFiles)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setMergeFiles(items)
  }, [mergeFiles])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTotalPages = () => {
    return mergeFiles.reduce((total, file) => total + file.pages, 0)
  }

  const getTotalSize = () => {
    return mergeFiles.reduce((total, file) => total + file.size, 0)
  }

  const canMerge = mergeFiles.length >= 2 && outputName.trim() !== ''

  const handleMerge = () => {
    if (canMerge) {
      onMerge(mergeFiles, outputName)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Merge className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-medium text-gray-900">Merge PDFs</h3>
      </div>

      {/* Output Configuration */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output File Name
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={outputName}
            onChange={(e) => setOutputName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter output file name"
          />
          <span className="text-sm text-gray-500">.pdf</span>
        </div>
      </div>

      {/* Merge Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Merge Options
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preserveBookmarks}
              onChange={(e) => setPreserveBookmarks(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Preserve bookmarks</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={addPageNumbers}
              onChange={(e) => setAddPageNumbers(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Add continuous page numbering</span>
          </label>
        </div>
      </div>

      {/* File List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Files to Merge ({mergeFiles.length} files, {getTotalPages()} pages)
          </label>
          <button
            onClick={onAddFiles}
            className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Files</span>
          </button>
        </div>

        {mergeFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Merge className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No files selected for merging</p>
            <button
              onClick={onAddFiles}
              className="mt-2 text-green-600 hover:text-green-700 text-sm"
            >
              Add PDF files to merge
            </button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="merge-files">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 ${
                    snapshot.isDraggingOver ? 'bg-green-50' : ''
                  } rounded-lg p-2 transition-colors`}
                >
                  {mergeFiles.map((file, index) => (
                    <Draggable key={file.id} draggableId={file.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`
                            flex items-center space-x-3 p-3 bg-white border rounded-lg
                            ${snapshot.isDragging ? 'shadow-lg border-green-300' : 'border-gray-200'}
                            transition-all
                          `}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-green-600">
                                #{index + 1}
                              </span>
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {file.pages} pages • {formatFileSize(file.size)}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onPreview(file)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onRemoveFile(file.id)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                              title="Remove"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Summary */}
      {mergeFiles.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Merge Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Files:</span>
              <span className="ml-1 font-medium">{mergeFiles.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Pages:</span>
              <span className="ml-1 font-medium">{getTotalPages()}</span>
            </div>
            <div>
              <span className="text-gray-500">Estimated Size:</span>
              <span className="ml-1 font-medium">{formatFileSize(getTotalSize())}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {!canMerge && (
            <span>
              {mergeFiles.length < 2 
                ? 'Add at least 2 files to merge' 
                : 'Enter output file name'
              }
            </span>
          )}
        </div>

        <button
          onClick={handleMerge}
          disabled={!canMerge}
          className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Merge className="h-4 w-4" />
          <span>Merge PDFs</span>
        </button>
      </div>
    </div>
  )
}
