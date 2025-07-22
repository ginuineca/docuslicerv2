import { useState } from 'react'
import { Node } from 'reactflow'
import { 
  Upload, 
  Scissors, 
  Merge, 
  Download, 
  FileText, 
  Settings,
  Plus,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { WorkflowNodeData } from './WorkflowNode'

interface WorkflowSidebarProps {
  selectedNode: Node<WorkflowNodeData> | null
  onAddNode: (type: WorkflowNodeData['type'], label: string) => void
  onUpdateNode: (nodeId: string, data: Partial<WorkflowNodeData>) => void
  onDeleteNode: (nodeId: string) => void
}

const nodeTemplates = [
  {
    type: 'input' as const,
    label: 'Upload PDF',
    icon: Upload,
    description: 'Upload PDF files to start the workflow'
  },
  {
    type: 'split' as const,
    label: 'Split PDF',
    icon: Scissors,
    description: 'Split PDF into multiple files'
  },
  {
    type: 'merge' as const,
    label: 'Merge PDFs',
    icon: Merge,
    description: 'Combine multiple PDFs into one'
  },
  {
    type: 'extract' as const,
    label: 'Extract Pages',
    icon: FileText,
    description: 'Extract specific pages from PDF'
  },
  {
    type: 'output' as const,
    label: 'Download Result',
    icon: Download,
    description: 'Download the processed files'
  },
  {
    type: 'condition' as const,
    label: 'Condition',
    icon: Settings,
    description: 'Add conditional logic to workflow'
  }
]

export function WorkflowSidebar({
  selectedNode,
  onAddNode,
  onUpdateNode,
  onDeleteNode
}: WorkflowSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['nodes', 'properties'])
  )

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleNodeConfigChange = (field: string, value: any) => {
    if (!selectedNode) return
    
    const newConfig = { ...selectedNode.data.config, [field]: value }
    onUpdateNode(selectedNode.id, { config: newConfig })
  }

  const handleLabelChange = (newLabel: string) => {
    if (!selectedNode) return
    onUpdateNode(selectedNode.id, { label: newLabel })
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Workflow Builder</h2>
        <p className="text-sm text-gray-600 mt-1">
          Drag and drop nodes to create your PDF processing workflow
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Node Library */}
        <div className="p-4">
          <button
            onClick={() => toggleSection('nodes')}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-sm font-medium text-gray-900">Available Nodes</h3>
            {expandedSections.has('nodes') ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {expandedSections.has('nodes') && (
            <div className="mt-3 space-y-2">
              {nodeTemplates.map((template) => {
                const Icon = template.icon
                return (
                  <button
                    key={template.type}
                    onClick={() => onAddNode(template.type, template.label)}
                    className="w-full flex items-start space-x-3 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <Icon className="h-5 w-5 text-gray-600 group-hover:text-gray-800 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-gray-800">
                        {template.label}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {template.description}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0 mt-0.5" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Node Properties */}
        {selectedNode && (
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => toggleSection('properties')}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-sm font-medium text-gray-900">Node Properties</h3>
              {expandedSections.has('properties') ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {expandedSections.has('properties') && (
              <div className="mt-3 space-y-4">
                {/* Node Info */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const template = nodeTemplates.find(t => t.type === selectedNode.data.type)
                        const Icon = template?.icon || Settings
                        return <Icon className="h-4 w-4 text-blue-600" />
                      })()}
                      <span className="text-sm font-medium text-blue-900">
                        {selectedNode.data.type.charAt(0).toUpperCase() + selectedNode.data.type.slice(1)} Node
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteNode(selectedNode.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete Node"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Label */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data.label}
                    onChange={(e) => handleLabelChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Type-specific Configuration */}
                {selectedNode.data.type === 'split' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Split Method
                    </label>
                    <select
                      value={selectedNode.data.config?.method || 'ranges'}
                      onChange={(e) => handleNodeConfigChange('method', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ranges">Custom Ranges</option>
                      <option value="pages">Individual Pages</option>
                      <option value="intervals">Fixed Intervals</option>
                    </select>
                  </div>
                )}

                {selectedNode.data.type === 'merge' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Output Name
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.config?.outputName || 'merged_document'}
                      onChange={(e) => handleNodeConfigChange('outputName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="mt-2 space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedNode.data.config?.preserveBookmarks || false}
                          onChange={(e) => handleNodeConfigChange('preserveBookmarks', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Preserve bookmarks</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedNode.data.config?.addPageNumbers || false}
                          onChange={(e) => handleNodeConfigChange('addPageNumbers', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Add page numbers</span>
                      </label>
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'extract' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pages to Extract
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 1,3,5-10"
                      value={selectedNode.data.config?.pageRange || ''}
                      onChange={(e) => handleNodeConfigChange('pageRange', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use commas for individual pages, hyphens for ranges
                    </p>
                  </div>
                )}

                {selectedNode.data.type === 'condition' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition Type
                    </label>
                    <select
                      value={selectedNode.data.config?.conditionType || 'pageCount'}
                      onChange={(e) => handleNodeConfigChange('conditionType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pageCount">Page Count</option>
                      <option value="fileSize">File Size</option>
                      <option value="fileName">File Name</option>
                    </select>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className={`
                    px-3 py-2 rounded-md text-sm font-medium
                    ${selectedNode.data.status === 'idle' ? 'bg-gray-100 text-gray-700' : ''}
                    ${selectedNode.data.status === 'running' ? 'bg-blue-100 text-blue-700' : ''}
                    ${selectedNode.data.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                    ${selectedNode.data.status === 'error' ? 'bg-red-100 text-red-700' : ''}
                  `}>
                    {selectedNode.data.status.charAt(0).toUpperCase() + selectedNode.data.status.slice(1)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
