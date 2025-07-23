import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components'
import { WorkflowBuilderWrapper } from '../components/workflow/WorkflowBuilder'
import { TutorialManager } from '../components/tutorial/TutorialManager'
import { WelcomeTutorial } from '../components/tutorial/WelcomeTutorial'
import { HelpProvider } from '../components/tutorial/ContextualHelp'
import { TutorialRecommendations, useTutorialRecommendations } from '../components/tutorial/TutorialRecommendations'
import { TemplateBrowser } from '../components/workflow/TemplateBrowser'
import { TemplatePreview } from '../components/workflow/TemplatePreview'
import { MultiFormatUpload } from '../components/upload/MultiFormatUpload'
import { WorkflowTemplate } from '../data/workflowTemplates'
import { getDocumentType } from '../utils/documentTypes'
import { Link } from 'react-router-dom'
import { ArrowLeft, Workflow, Save, Play, Share, Layout, Upload, AlertCircle, CheckCircle, Clock, BookOpen } from 'lucide-react'
import { Node, Edge } from 'reactflow'
import { workflowService, type Workflow as BackendWorkflow } from '../services/workflowService'

interface SavedWorkflow {
  id: string
  name: string
  description: string
  nodes: Node[]
  edges: Edge[]
  createdAt: Date
  updatedAt: Date
  isTemplate: boolean
}

interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startedAt: Date
  completedAt?: Date
  error?: string
  inputFiles: string[]
  outputFiles: string[]
}

export function WorkflowsPage() {
  const { user } = useAuth()
  const [currentWorkflow, setCurrentWorkflow] = useState<SavedWorkflow | null>(null)
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTutorials, setShowTutorials] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<WorkflowTemplate | null>(null)
  const tutorialRecommendations = useTutorialRecommendations()

  // Load workflows from backend on component mount
  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const workflows = await workflowService.getWorkflows()

      if (workflows.length === 0) {
        console.log('📋 No workflows found, starting with empty list')
        setSavedWorkflows([])
        return
      }

      const savedWorkflows = workflows.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description,
        nodes: w.nodes.map(node => ({
          id: node.id,
          type: 'workflowNode',
          position: node.position,
          data: {
            label: node.label,
            type: node.type,
            status: node.status,
            config: node.config,
            progress: node.progress
          }
        })) as Node[],
        edges: w.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target
        })) as Edge[],
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        isTemplate: false
      }))
      setSavedWorkflows(savedWorkflows)
      console.log(`✅ Loaded ${savedWorkflows.length} workflows`)
    } catch (error) {
      console.error('Failed to load workflows:', error)
      setError('Workflow service is not available. You can still create workflows, but they won\'t be saved.')
      setSavedWorkflows([]) // Set empty array so UI still works
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveWorkflow = (workflow: { nodes: Node[]; edges: Edge[] }) => {
    setShowSaveDialog(true)
  }

  const confirmSaveWorkflow = async (workflow: { nodes: Node[]; edges: Edge[] }) => {
    try {
      setIsLoading(true)
      setError(null)

      // Create a local workflow if backend is not available
      const localWorkflow: SavedWorkflow = {
        id: `local-${Date.now()}`,
        name: workflowName || 'Untitled Workflow',
        description: workflowDescription || '',
        nodes: workflow.nodes,
        edges: workflow.edges,
        createdAt: new Date(),
        updatedAt: new Date(),
        isTemplate: false
      }

      try {
        const savedWorkflow = await workflowService.createWorkflow({
          name: workflowName || 'Untitled Workflow',
          description: workflowDescription || '',
          nodes: workflow.nodes,
          edges: workflow.edges
        })

        const newWorkflow: SavedWorkflow = {
          id: savedWorkflow.id,
          name: savedWorkflow.name,
          description: savedWorkflow.description,
          nodes: savedWorkflow.nodes.map(node => ({
            id: node.id,
            type: 'workflowNode',
            position: node.position,
            data: {
              label: node.label,
              type: node.type,
              status: node.status,
              config: node.config,
              progress: node.progress
            }
          })) as Node[],
          edges: savedWorkflow.edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target
          })) as Edge[],
          createdAt: savedWorkflow.createdAt,
          updatedAt: savedWorkflow.updatedAt,
          isTemplate: false
        }

        setSavedWorkflows(prev => [...prev, newWorkflow])
        setCurrentWorkflow(newWorkflow)
      } catch (backendError) {
        console.warn('Backend save failed, saving locally:', backendError)
        setSavedWorkflows(prev => [...prev, localWorkflow])
        setCurrentWorkflow(localWorkflow)
        setError('Workflow saved locally only (backend not available)')
      }

      setShowSaveDialog(false)
      setWorkflowName('')
      setWorkflowDescription('')
    } catch (error) {
      console.error('Save workflow error:', error)
      setError('Failed to save workflow')
    } finally {
      setIsLoading(false)
    }
  }

  const getOperationFromNodeType = (type: string): string => {
    const operationMap: Record<string, string> = {
      'input': 'file-input',
      'split': 'pdf-split',
      'merge': 'pdf-merge',
      'extract': 'pdf-extract-pages',
      'output': 'file-output',
      'condition': 'condition'
    }
    return operationMap[type] || type
  }

  const handleRunWorkflow = async (workflow: { nodes: Node[]; edges: Edge[] }) => {
    if (uploadedFiles.length === 0) {
      setError('Please upload files before running the workflow')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Check if backend is available by trying to execute
      try {
        // First save the workflow if it's not saved yet
        let workflowId = currentWorkflow?.id
        if (!workflowId) {
          const tempName = `Temp Workflow ${Date.now()}`
          const savedWorkflow = await workflowService.createWorkflow({
            name: tempName,
            description: 'Temporary workflow for execution',
            nodes: workflow.nodes,
            edges: workflow.edges
          })
          workflowId = savedWorkflow.id
        }

        // Execute workflow with uploaded files
        const execution = await workflowService.executeWorkflow(workflowId, uploadedFiles)
        setCurrentExecution(execution)

        // Poll for execution status
        pollExecutionStatus(execution.id)
      } catch (backendError) {
        console.warn('Backend execution failed, simulating workflow:', backendError)

        // Simulate workflow execution for demo purposes
        const mockExecution: WorkflowExecution = {
          id: `mock-${Date.now()}`,
          workflowId: currentWorkflow?.id || 'temp',
          status: 'running',
          progress: 0,
          startedAt: new Date(),
          inputFiles: uploadedFiles.map(f => f.name),
          outputFiles: []
        }

        setCurrentExecution(mockExecution)
        setError('Running in demo mode (backend not available)')

        // Simulate progress
        simulateWorkflowProgress(mockExecution)
      }
    } catch (error) {
      console.error('Run workflow error:', error)
      setError('Failed to run workflow')
    } finally {
      setIsLoading(false)
    }
  }

  const simulateWorkflowProgress = (execution: WorkflowExecution) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        progress = 100
        setCurrentExecution({
          ...execution,
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
          outputFiles: ['processed_document.pdf']
        })
        clearInterval(interval)
      } else {
        setCurrentExecution({
          ...execution,
          progress: Math.round(progress)
        })
      }
    }, 1000)
  }

  const pollExecutionStatus = async (executionId: string) => {
    const poll = async () => {
      try {
        const execution = await workflowService.getExecution(executionId)
        setCurrentExecution(execution)

        if (execution.status === 'running') {
          setTimeout(poll, 2000) // Poll every 2 seconds
        }
      } catch (error) {
        console.error('Failed to poll execution status:', error)
      }
    }

    poll()
  }

  const loadWorkflow = (workflow: SavedWorkflow) => {
    setCurrentWorkflow(workflow)
    // The workflow builder would need to be updated to accept initial nodes/edges
  }

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    // Create a new workflow from template
    const newWorkflow: SavedWorkflow = {
      id: `template-${Date.now()}`,
      name: `${template.name} (from template)`,
      description: template.description,
      nodes: template.nodes,
      edges: template.edges,
      createdAt: new Date(),
      updatedAt: new Date(),
      isTemplate: false
    }

    setCurrentWorkflow(newWorkflow)
    setShowTemplates(false)
    setPreviewTemplate(null)
  }

  const handlePreviewTemplate = (template: WorkflowTemplate) => {
    setPreviewTemplate(template)
  }

  const handleUseTemplate = (template: WorkflowTemplate) => {
    handleSelectTemplate(template)
    setPreviewTemplate(null)
  }

  const handleFileUpload = (uploadedFiles: any[]) => {
    const files = uploadedFiles.map(uf => uf.file)
    setUploadedFiles(files)
    setError(null)
  }



  const deleteWorkflow = async (workflowId: string) => {
    try {
      await workflowService.deleteWorkflow(workflowId)
      setSavedWorkflows(prev => prev.filter(w => w.id !== workflowId))
      if (currentWorkflow?.id === workflowId) {
        setCurrentWorkflow(null)
      }
    } catch (error) {
      console.error('Delete workflow error:', error)
      setError('Failed to delete workflow')
    }
  }

  return (
    <HelpProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <Logo />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Document Workflow Builder</h1>
                {currentWorkflow && (
                  <p className="text-sm text-gray-600">{currentWorkflow.name}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowTutorials(true)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Tutorials
              </button>
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Saved Workflows Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">My Workflows</h2>
            <button
              onClick={() => setCurrentWorkflow(null)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              New
            </button>
          </div>

          {savedWorkflows.length === 0 ? (
            <div className="text-center py-8">
              <Workflow className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No workflows yet</p>
              <p className="text-gray-400 text-xs mt-1">Create your first workflow</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedWorkflows.map(workflow => (
                <div
                  key={workflow.id}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-colors
                    ${currentWorkflow?.id === workflow.id 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => loadWorkflow(workflow)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {workflow.name}
                      </h3>
                      {workflow.description && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {workflow.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                        <span>{workflow.nodes.length} nodes</span>
                        <span>•</span>
                        <span>{workflow.edges.length} connections</span>
                      </div>
                    </div>
                    {workflow.isTemplate && (
                      <Layout className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">
                      {workflow.updatedAt.toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteWorkflow(workflow.id)
                      }}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Workflow Area */}
        <div className="flex-1 flex flex-col">
          {/* File Upload and Status Panel */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Input Files</h3>
              {currentExecution && (
                <div className="flex items-center space-x-2">
                  {currentExecution.status === 'running' && (
                    <Clock className="h-4 w-4 text-blue-500 animate-spin" />
                  )}
                  {currentExecution.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {currentExecution.status === 'failed' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    currentExecution.status === 'running' ? 'text-blue-600' :
                    currentExecution.status === 'completed' ? 'text-green-600' :
                    currentExecution.status === 'failed' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    {currentExecution.status.charAt(0).toUpperCase() + currentExecution.status.slice(1)}
                    {currentExecution.status === 'running' && ` (${currentExecution.progress}%)`}
                  </span>
                </div>
              )}
            </div>

            {/* Multi-Format File Upload */}
            <MultiFormatUpload
              onFilesChange={handleFileUpload}
              maxFiles={20}
              className="mb-4"
            />



            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Execution Progress */}
            {currentExecution && currentExecution.status === 'running' && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Processing workflow...</span>
                  <span>{currentExecution.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${currentExecution.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Workflow Builder */}
          <div className="flex-1">
            <WorkflowBuilderWrapper
              onSave={handleSaveWorkflow}
              onRun={handleRunWorkflow}
              onShowTemplates={() => setShowTemplates(true)}
              initialNodes={currentWorkflow?.nodes}
              initialEdges={currentWorkflow?.edges}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Save Workflow</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter workflow name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what this workflow does"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmSaveWorkflow({ nodes: [], edges: [] })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Manager */}
      <TutorialManager
        isOpen={showTutorials}
        onClose={() => setShowTutorials(false)}
      />

      {/* Welcome Tutorial */}
      <WelcomeTutorial
        onStartTutorial={() => {
          setShowWelcome(false)
          setShowTutorials(true)
        }}
        onDismiss={() => setShowWelcome(false)}
      />

      {/* Tutorial Recommendations */}
      <TutorialRecommendations
        userActivity={tutorialRecommendations.userActivity}
        onSelectTutorial={(tutorial) => {
          setShowTutorials(true)
          // Could set selected tutorial here
        }}
        onDismiss={() => {
          // Handle recommendation dismissal
        }}
      />

      {/* Template Browser */}
      <TemplateBrowser
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
        onPreviewTemplate={handlePreviewTemplate}
      />

      {/* Template Preview */}
      <TemplatePreview
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={handleUseTemplate}
      />
      </div>
    </HelpProvider>
  )
}
