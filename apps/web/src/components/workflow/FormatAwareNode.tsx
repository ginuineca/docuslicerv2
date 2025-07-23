import React from 'react'
import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { 
  Upload, 
  Scissors, 
  Merge, 
  Download, 
  FileText, 
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Image,
  FileImage,
  Archive
} from 'lucide-react'
import { getDocumentType, DocumentType } from '../../utils/documentTypes'

export interface FormatAwareNodeData {
  label: string
  type: 'input' | 'split' | 'merge' | 'extract' | 'output' | 'condition' | 'convert' | 'compress' | 'ocr' | 'process'
  status: 'idle' | 'running' | 'completed' | 'error'
  config?: Record<string, any>
  progress?: number
  error?: string
  supportedFormats?: string[]
  inputFormats?: string[]
  outputFormat?: string
  formatRestrictions?: {
    required?: string[]
    excluded?: string[]
    preferred?: string[]
  }
}

const nodeIcons = {
  input: Upload,
  split: Scissors,
  merge: Merge,
  extract: FileText,
  output: Download,
  condition: Settings,
  convert: RefreshCw,
  compress: Archive,
  ocr: FileImage,
  process: Image
}

const statusIcons = {
  idle: Clock,
  running: Play,
  completed: CheckCircle,
  error: AlertCircle
}

const nodeColors = {
  input: 'bg-blue-50 border-blue-200 text-blue-800',
  split: 'bg-purple-50 border-purple-200 text-purple-800',
  merge: 'bg-green-50 border-green-200 text-green-800',
  extract: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  output: 'bg-gray-50 border-gray-200 text-gray-800',
  condition: 'bg-orange-50 border-orange-200 text-orange-800',
  convert: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  compress: 'bg-red-50 border-red-200 text-red-800',
  ocr: 'bg-teal-50 border-teal-200 text-teal-800',
  process: 'bg-pink-50 border-pink-200 text-pink-800'
}

const statusColors = {
  idle: 'text-gray-500',
  running: 'text-blue-500',
  completed: 'text-green-500',
  error: 'text-red-500'
}

const getFormatIcon = (format: string): string => {
  const docType = getDocumentType(`file.${format}`)
  return docType?.icon || '📄'
}

const getFormatColor = (format: string): string => {
  const docType = getDocumentType(`file.${format}`)
  return docType?.color || '#6b7280'
}

export const FormatAwareNode = memo(({ data, selected }: NodeProps<FormatAwareNodeData>) => {
  const Icon = nodeIcons[data.type]
  const StatusIcon = statusIcons[data.status]
  const nodeColorClass = nodeColors[data.type]
  const statusColorClass = statusColors[data.status]

  const hasFormatRestrictions = data.supportedFormats && data.supportedFormats.length > 0
  const hasInputFormats = data.inputFormats && data.inputFormats.length > 0
  const hasOutputFormat = data.outputFormat

  return (
    <div
      className={`
        px-4 py-3 shadow-lg rounded-lg border-2 min-w-[180px] max-w-[250px]
        ${nodeColorClass}
        ${selected ? 'ring-2 ring-blue-400' : ''}
        transition-all duration-200
      `}
    >
      {/* Input Handle */}
      {data.type !== 'input' && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-4 h-4 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
          style={{ left: -8 }}
        />
      )}

      {/* Node Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4" />
          <span className="font-medium text-sm">{data.label}</span>
        </div>
        <StatusIcon className={`h-4 w-4 ${statusColorClass}`} />
      </div>

      {/* Format Information */}
      {(hasFormatRestrictions || hasInputFormats || hasOutputFormat) && (
        <div className="mb-2 space-y-1">
          {/* Input Formats */}
          {hasInputFormats && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">In:</span>
              <div className="flex flex-wrap gap-1">
                {data.inputFormats!.slice(0, 3).map(format => (
                  <span
                    key={format}
                    className="inline-flex items-center text-xs px-1 py-0.5 rounded"
                    style={{ 
                      backgroundColor: `${getFormatColor(format)}20`,
                      color: getFormatColor(format)
                    }}
                  >
                    <span className="mr-0.5">{getFormatIcon(format)}</span>
                    {format.toUpperCase()}
                  </span>
                ))}
                {data.inputFormats!.length > 3 && (
                  <span className="text-xs text-gray-400">+{data.inputFormats!.length - 3}</span>
                )}
              </div>
            </div>
          )}

          {/* Output Format */}
          {hasOutputFormat && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Out:</span>
              <span
                className="inline-flex items-center text-xs px-1 py-0.5 rounded"
                style={{ 
                  backgroundColor: `${getFormatColor(data.outputFormat!)}20`,
                  color: getFormatColor(data.outputFormat!)
                }}
              >
                <span className="mr-0.5">{getFormatIcon(data.outputFormat!)}</span>
                {data.outputFormat!.toUpperCase()}
              </span>
            </div>
          )}

          {/* Supported Formats */}
          {hasFormatRestrictions && !hasInputFormats && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Supports:</span>
              <div className="flex flex-wrap gap-1">
                {data.supportedFormats!.slice(0, 3).map(format => (
                  <span
                    key={format}
                    className="inline-flex items-center text-xs px-1 py-0.5 rounded"
                    style={{ 
                      backgroundColor: `${getFormatColor(format)}20`,
                      color: getFormatColor(format)
                    }}
                  >
                    <span className="mr-0.5">{getFormatIcon(format)}</span>
                    {format.toUpperCase()}
                  </span>
                ))}
                {data.supportedFormats!.length > 3 && (
                  <span className="text-xs text-gray-400">+{data.supportedFormats!.length - 3}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {data.status === 'running' && data.progress !== undefined && (
        <div className="mb-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${data.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">{data.progress}%</div>
        </div>
      )}

      {/* Error Message */}
      {data.status === 'error' && data.error && (
        <div className="mb-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {data.error}
        </div>
      )}

      {/* Configuration Preview */}
      {data.config && Object.keys(data.config).length > 0 && (
        <div className="text-xs text-gray-500">
          {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
              <span className="font-mono">{String(value).slice(0, 10)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Output Handle */}
      {data.type !== 'output' && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-4 h-4 bg-blue-500 border-2 border-white hover:bg-blue-600 transition-colors"
          style={{ right: -8 }}
        />
      )}
    </div>
  )
})
