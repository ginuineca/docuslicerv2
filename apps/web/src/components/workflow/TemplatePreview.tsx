import React from 'react'
import { X, Download, Clock, Tag, ArrowRight } from 'lucide-react'
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background, 
  BackgroundVariant,
  ReactFlowProvider 
} from 'reactflow'
import 'reactflow/dist/style.css'
import { WorkflowTemplate } from '../../data/workflowTemplates'
import { WorkflowNode } from './WorkflowNode'

interface TemplatePreviewProps {
  template: WorkflowTemplate | null
  isOpen: boolean
  onClose: () => void
  onUseTemplate: (template: WorkflowTemplate) => void
}

const nodeTypes = {
  workflowNode: WorkflowNode
}

export function TemplatePreview({ 
  template, 
  isOpen, 
  onClose, 
  onUseTemplate 
}: TemplatePreviewProps) {
  if (!isOpen || !template) return null

  const getDifficultyColor = (difficulty: WorkflowTemplate['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-700 border-red-200'
    }
  }

  const getCategoryIcon = (category: WorkflowTemplate['category']) => {
    switch (category) {
      case 'compliance': return '🛡️'
      case 'mixed-format': return '🔀'
      case 'document-processing': return '📄'
      case 'page-management': return '📋'
      case 'conversion': return '🔄'
      case 'image-processing': return '🖼️'
      case 'batch-operations': return '⚡'
      case 'business': return '💼'
      case 'education': return '🎓'
      case 'advanced': return '🔧'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <span className="text-3xl">{getCategoryIcon(template.category)}</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{template.name}</h2>
              <p className="text-gray-600">{template.description}</p>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`text-sm px-3 py-1 rounded-full border ${getDifficultyColor(template.difficulty)}`}>
                  {template.difficulty}
                </span>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {template.estimatedTime}
                </div>
                <span className="text-sm text-gray-500">
                  {template.nodes.length} nodes • {template.edges.length} connections
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onUseTemplate(template)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Use This Template</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto">
            {/* Use Case */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Use Case</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">{template.useCase}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {template.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Workflow Steps</h3>
              <div className="space-y-3">
                {template.nodes.map((node, index) => (
                  <div key={node.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{node.data.label}</div>
                      <div className="text-sm text-gray-500 capitalize">{node.data.type} node</div>
                    </div>
                    {index < template.nodes.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Configuration Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Configuration</h3>
              <div className="space-y-3">
                {template.nodes
                  .filter(node => node.data.config && Object.keys(node.data.config).length > 0)
                  .map(node => (
                    <div key={node.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-900 mb-2">{node.data.label}</div>
                      <div className="space-y-1">
                        {Object.entries(node.data.config || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                            <span className="text-gray-900 font-mono">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                {template.nodes.filter(node => node.data.config && Object.keys(node.data.config).length > 0).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No special configuration required</p>
                )}
              </div>
            </div>
          </div>

          {/* Workflow Visualization */}
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <ReactFlow
                nodes={template.nodes}
                edges={template.edges}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                zoomOnScroll={true}
                panOnScroll={false}
                className="bg-gray-50"
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                <Controls showInteractive={false} />
              </ReactFlow>
            </ReactFlowProvider>

            {/* Overlay Instructions */}
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
              <h4 className="font-medium text-gray-900 mb-2">Template Preview</h4>
              <p className="text-sm text-gray-600 mb-3">
                This shows how the workflow will look when you use this template. 
                You can zoom and pan to explore the workflow structure.
              </p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Input nodes</span>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Processing</span>
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span>Output</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
