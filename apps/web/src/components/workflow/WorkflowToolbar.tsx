import { 
  Play, 
  Save, 
  Trash2, 
  Download, 
  Upload, 
  Settings,
  Zap,
  Pause,
  RotateCcw
} from 'lucide-react'

interface WorkflowToolbarProps {
  onSave: () => void
  onRun: () => void
  onClear: () => void
  onImport?: () => void
  onExport?: () => void
  isRunning: boolean
  nodeCount: number
  edgeCount: number
}

export function WorkflowToolbar({
  onSave,
  onRun,
  onClear,
  onImport,
  onExport,
  isRunning,
  nodeCount,
  edgeCount
}: WorkflowToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section - Main Actions */}
        <div className="flex items-center space-x-3">
          <button
            data-tutorial="run-workflow"
            onClick={onRun}
            disabled={isRunning || nodeCount === 0}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors
              ${isRunning || nodeCount === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
              }
            `}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Run Workflow</span>
              </>
            )}
          </button>

          <button
            data-tutorial="save-workflow"
            onClick={onSave}
            disabled={nodeCount === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>

          <div className="h-6 w-px bg-gray-300" />

          <button
            onClick={onClear}
            disabled={nodeCount <= 1}
            className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear</span>
          </button>
        </div>

        {/* Center Section - Workflow Stats */}
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{nodeCount} nodes</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>{edgeCount} connections</span>
          </div>
          {isRunning && (
            <div className="flex items-center space-x-2 text-green-600">
              <Zap className="h-4 w-4 animate-pulse" />
              <span>Processing...</span>
            </div>
          )}
        </div>

        {/* Right Section - Import/Export */}
        <div className="flex items-center space-x-2">
          {onImport && (
            <button
              onClick={onImport}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Import Workflow"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
          )}

          {onExport && (
            <button
              onClick={onExport}
              disabled={nodeCount === 0}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              title="Export Workflow"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          <div className="h-6 w-px bg-gray-300" />

          <button
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Workflow Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar (shown when running) */}
      {isRunning && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-green-600 h-1 rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      )}
    </div>
  )
}
