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
  Clock
} from 'lucide-react'

export interface WorkflowNodeData {
  label: string
  type: 'input' | 'split' | 'merge' | 'extract' | 'output' | 'condition'
  status: 'idle' | 'running' | 'completed' | 'error'
  config?: Record<string, any>
  progress?: number
  error?: string
}

const nodeIcons = {
  input: Upload,
  split: Scissors,
  merge: Merge,
  extract: FileText,
  output: Download,
  condition: Settings
}

const nodeColors = {
  input: 'bg-blue-100 border-blue-300 text-blue-700',
  split: 'bg-purple-100 border-purple-300 text-purple-700',
  merge: 'bg-green-100 border-green-300 text-green-700',
  extract: 'bg-orange-100 border-orange-300 text-orange-700',
  output: 'bg-gray-100 border-gray-300 text-gray-700',
  condition: 'bg-yellow-100 border-yellow-300 text-yellow-700'
}

const statusIcons = {
  idle: null,
  running: Clock,
  completed: CheckCircle,
  error: AlertCircle
}

const statusColors = {
  idle: '',
  running: 'text-blue-500',
  completed: 'text-green-500',
  error: 'text-red-500'
}

export const WorkflowNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const Icon = nodeIcons[data.type]
  const StatusIcon = statusIcons[data.status]
  const nodeColorClass = nodeColors[data.type]
  const statusColorClass = statusColors[data.status]

  return (
    <div
      className={`
        px-4 py-3 shadow-lg rounded-lg border-2 min-w-[150px]
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
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      )}

      {/* Node Content */}
      <div className="flex items-center space-x-2">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{data.label}</div>
          {data.status === 'running' && data.progress !== undefined && (
            <div className="mt-1">
              <div className="w-full bg-white bg-opacity-50 rounded-full h-1.5">
                <div
                  className="bg-current h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${data.progress}%` }}
                />
              </div>
              <div className="text-xs mt-1">{Math.round(data.progress)}%</div>
            </div>
          )}
          {data.status === 'error' && data.error && (
            <div className="text-xs text-red-600 mt-1 truncate" title={data.error}>
              {data.error}
            </div>
          )}
        </div>
        {StatusIcon && (
          <StatusIcon className={`h-4 w-4 flex-shrink-0 ${statusColorClass}`} />
        )}
      </div>

      {/* Configuration Indicator */}
      {data.config && Object.keys(data.config).length > 0 && (
        <div className="mt-2 text-xs opacity-75">
          {data.type === 'split' && data.config.ranges && (
            <span>{data.config.ranges.length} ranges</span>
          )}
          {data.type === 'merge' && data.config.files && (
            <span>{data.config.files.length} files</span>
          )}
          {data.type === 'extract' && data.config.pages && (
            <span>{data.config.pages.length} pages</span>
          )}
        </div>
      )}

      {/* Output Handle */}
      {data.type !== 'output' && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      )}
    </div>
  )
})

WorkflowNode.displayName = 'WorkflowNode'
