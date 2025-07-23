import React, { useState, useRef, useEffect } from 'react'
import { 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Upload, 
  Download,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Smartphone,
  Tablet,
  Monitor,
  Zap,
  FileText,
  Image,
  Scissors,
  Merge
} from 'lucide-react'

interface MobileNode {
  id: string
  type: 'input' | 'process' | 'output'
  operation: string
  label: string
  icon: React.ComponentType<any>
  config: Record<string, any>
  position: number
}

interface MobileWorkflowBuilderProps {
  onSave: (workflow: any) => void
  onRun: (workflow: any) => void
}

export function MobileWorkflowBuilder({ onSave, onRun }: MobileWorkflowBuilderProps) {
  const [nodes, setNodes] = useState<MobileNode[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showNodePicker, setShowNodePicker] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  const availableNodes = [
    { type: 'input', operation: 'upload', label: 'Upload Files', icon: Upload },
    { type: 'process', operation: 'split', label: 'Split PDF', icon: Scissors },
    { type: 'process', operation: 'merge', label: 'Merge PDFs', icon: Merge },
    { type: 'process', operation: 'extract', label: 'Extract Pages', icon: FileText },
    { type: 'process', operation: 'convert', label: 'Convert Format', icon: Image },
    { type: 'output', operation: 'download', label: 'Download', icon: Download }
  ]

  const addNode = (nodeTemplate: any) => {
    const newNode: MobileNode = {
      id: `node-${Date.now()}`,
      type: nodeTemplate.type,
      operation: nodeTemplate.operation,
      label: nodeTemplate.label,
      icon: nodeTemplate.icon,
      config: {},
      position: nodes.length
    }
    
    setNodes([...nodes, newNode])
    setShowNodePicker(false)
  }

  const removeNode = (nodeId: string) => {
    setNodes(nodes.filter(node => node.id !== nodeId))
    if (selectedNode === nodeId) {
      setSelectedNode(null)
    }
  }

  const moveNode = (nodeId: string, direction: 'up' | 'down') => {
    const nodeIndex = nodes.findIndex(node => node.id === nodeId)
    if (nodeIndex === -1) return

    const newNodes = [...nodes]
    const targetIndex = direction === 'up' ? nodeIndex - 1 : nodeIndex + 1

    if (targetIndex >= 0 && targetIndex < nodes.length) {
      [newNodes[nodeIndex], newNodes[targetIndex]] = [newNodes[targetIndex], newNodes[nodeIndex]]
      
      // Update positions
      newNodes.forEach((node, index) => {
        node.position = index
      })
      
      setNodes(newNodes)
    }
  }

  const handleTouchStart = (e: React.TouchEvent, nodeId: string) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setDraggedNode(nodeId)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !draggedNode) return
    
    const touch = e.touches[0]
    const deltaY = touch.clientY - touchStart.y
    
    // Provide haptic feedback for drag operations
    if (Math.abs(deltaY) > 50 && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !draggedNode) return
    
    const touch = e.changedTouches[0]
    const deltaY = touch.clientY - touchStart.y
    
    // Determine if this was a swipe gesture
    if (Math.abs(deltaY) > 100) {
      if (deltaY < 0) {
        moveNode(draggedNode, 'up')
      } else {
        moveNode(draggedNode, 'down')
      }
    }
    
    setTouchStart(null)
    setDraggedNode(null)
  }

  const runWorkflow = async () => {
    setIsRunning(true)
    
    // Simulate workflow execution
    for (let i = 0; i < nodes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      // Update node status or provide visual feedback
    }
    
    setIsRunning(false)
    onRun({ nodes })
  }

  const saveWorkflow = () => {
    onSave({ nodes })
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Smartphone className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900">Mobile Workflow</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={saveWorkflow}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="flex-1 overflow-y-auto p-4">
        {nodes.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Build Your Workflow</h3>
            <p className="text-gray-600 mb-6">Add steps to create a document processing workflow</p>
            <button
              onClick={() => setShowNodePicker(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
            >
              Add First Step
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {nodes.map((node, index) => {
              const Icon = node.icon
              const isSelected = selectedNode === node.id
              const isDragged = draggedNode === node.id
              
              return (
                <div key={node.id} className="relative">
                  {/* Connection Line */}
                  {index > 0 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0.5 h-3 bg-gray-300" />
                  )}
                  
                  {/* Node Card */}
                  <div
                    className={`bg-white rounded-lg border-2 p-4 transition-all duration-200 ${
                      isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                    } ${isDragged ? 'scale-105 shadow-xl' : ''}`}
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                    onTouchStart={(e) => handleTouchStart(e, node.id)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          node.type === 'input' ? 'bg-green-100' :
                          node.type === 'process' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            node.type === 'input' ? 'text-green-600' :
                            node.type === 'process' ? 'text-blue-600' : 'text-purple-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{node.label}</h3>
                          <p className="text-sm text-gray-600 capitalize">{node.type}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isRunning && (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNode(node.id)
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Expanded Configuration */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Configuration
                            </label>
                            <div className="text-sm text-gray-600">
                              Tap to configure this step
                            </div>
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => moveNode(node.id, 'up')}
                              disabled={index === 0}
                              className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm disabled:opacity-50"
                            >
                              Move Up
                            </button>
                            <button
                              onClick={() => moveNode(node.id, 'down')}
                              disabled={index === nodes.length - 1}
                              className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm disabled:opacity-50"
                            >
                              Move Down
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            {/* Add Step Button */}
            <button
              onClick={() => setShowNodePicker(true)}
              className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="h-6 w-6 mx-auto mb-1" />
              <span className="text-sm font-medium">Add Step</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <button
            onClick={runWorkflow}
            disabled={nodes.length === 0 || isRunning}
            className="flex-1 flex items-center justify-center space-x-2 py-3 bg-green-600 text-white rounded-lg font-medium disabled:bg-gray-400"
          >
            {isRunning ? (
              <>
                <Pause className="h-5 w-5" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>Run Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Node Picker Modal */}
      {showNodePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-xl max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Add Step</h2>
                <button
                  onClick={() => setShowNodePicker(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <div className="space-y-2">
                {availableNodes.map(nodeTemplate => {
                  const Icon = nodeTemplate.icon
                  return (
                    <button
                      key={`${nodeTemplate.type}-${nodeTemplate.operation}`}
                      onClick={() => addNode(nodeTemplate)}
                      className="w-full flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${
                        nodeTemplate.type === 'input' ? 'bg-green-100' :
                        nodeTemplate.type === 'process' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          nodeTemplate.type === 'input' ? 'text-green-600' :
                          nodeTemplate.type === 'process' ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900">{nodeTemplate.label}</h3>
                        <p className="text-sm text-gray-600 capitalize">{nodeTemplate.type} step</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-xl max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Workflow Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter workflow name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Describe what this workflow does"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Auto-save changes</span>
                  <input type="checkbox" className="rounded" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Offline mode</span>
                  <input type="checkbox" className="rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
