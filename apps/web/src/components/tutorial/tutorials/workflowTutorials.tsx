import React from 'react'
import { Tutorial } from '../TutorialOverlay'
import { Upload, Scissors, Download, ArrowRight, MousePointer, FileText } from 'lucide-react'

export const workflowTutorials: Tutorial[] = [
  {
    id: 'basic-workflow',
    title: 'Creating Your First Workflow',
    description: 'Learn the basics of creating a simple PDF processing workflow with drag-and-drop nodes.',
    difficulty: 'beginner',
    duration: '5 minutes',
    category: 'basics',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Workflow Builder',
        description: 'The workflow builder lets you create automated PDF processing pipelines using visual drag-and-drop nodes.',
        content: (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">What is a workflow?</h4>
              <p className="text-blue-800 text-sm">
                A workflow is a series of connected steps that process your PDF files automatically. 
                Each step performs a specific action like splitting, merging, or extracting pages.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Upload className="h-4 w-4 mr-1 text-blue-500" />
                Input
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center">
                <Scissors className="h-4 w-4 mr-1 text-purple-500" />
                Process
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center">
                <Download className="h-4 w-4 mr-1 text-gray-500" />
                Output
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'interface-overview',
        title: 'Understanding the Interface',
        description: 'Let\'s explore the main components of the workflow builder interface.',
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-1">Left Sidebar</h5>
                <p className="text-sm text-gray-600">Node library and properties panel</p>
              </div>
              <div className="border rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-1">Main Canvas</h5>
                <p className="text-sm text-gray-600">Drag and drop area for building workflows</p>
              </div>
              <div className="border rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-1">Top Toolbar</h5>
                <p className="text-sm text-gray-600">Save, run, and manage workflow actions</p>
              </div>
              <div className="border rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-1">File Upload</h5>
                <p className="text-sm text-gray-600">Upload PDF files to process</p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'add-input-node',
        title: 'Add an Input Node',
        description: 'Every workflow starts with an input node. Click "Add Input" in the sidebar to add one.',
        target: '[data-tutorial="add-input"]',
        action: 'click',
        content: (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-blue-600">
              <Upload className="h-5 w-5" />
              <span className="font-medium">Input Node</span>
            </div>
            <p className="text-sm text-gray-600">
              Input nodes represent the starting point of your workflow. They receive the PDF files you upload.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Tip:</strong> Input nodes can only have output connections (green handles on the right).
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'add-processing-node',
        title: 'Add a Processing Node',
        description: 'Now add a processing node like "Split PDF" to perform an action on your files.',
        target: '[data-tutorial="add-split"]',
        action: 'click',
        content: (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-purple-600">
              <Scissors className="h-5 w-5" />
              <span className="font-medium">Split PDF Node</span>
            </div>
            <p className="text-sm text-gray-600">
              Processing nodes transform your files. The Split PDF node divides a PDF into separate pages or ranges.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Processing nodes have both input (blue, left) and output (green, right) handles.
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'add-output-node',
        title: 'Add an Output Node',
        description: 'Complete your workflow with an output node to save the processed files.',
        target: '[data-tutorial="add-output"]',
        action: 'click',
        content: (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-gray-600">
              <Download className="h-5 w-5" />
              <span className="font-medium">Output Node</span>
            </div>
            <p className="text-sm text-gray-600">
              Output nodes save the final results of your workflow. They represent the end point of processing.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Remember:</strong> Output nodes only have input connections (blue handles on the left).
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'connect-nodes',
        title: 'Connect the Nodes',
        description: 'Now connect your nodes by dragging from green output handles to blue input handles.',
        action: 'drag',
        content: (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Output Handle</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Input Handle</span>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-yellow-900 mb-2">How to Connect:</h5>
              <ol className="text-sm text-yellow-800 space-y-1">
                <li>1. Hover over a node to see its connection handles</li>
                <li>2. Click and drag from a green handle (output)</li>
                <li>3. Drop on a blue handle (input) of another node</li>
                <li>4. See the animated connection line appear!</li>
              </ol>
            </div>
          </div>
        )
      },
      {
        id: 'upload-files',
        title: 'Upload Test Files',
        description: 'Upload some PDF files to test your workflow.',
        target: '[data-tutorial="file-upload"]',
        action: 'click',
        content: (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-blue-600">
              <FileText className="h-5 w-5" />
              <span className="font-medium">File Upload</span>
            </div>
            <p className="text-sm text-gray-600">
              Upload PDF files that you want to process through your workflow. You can upload multiple files at once.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Supported:</strong> Only PDF files are supported for workflow processing.
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'run-workflow',
        title: 'Run Your Workflow',
        description: 'Click the "Run Workflow" button to execute your workflow and see the results.',
        target: '[data-tutorial="run-workflow"]',
        action: 'click',
        content: (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-green-600">
              <MousePointer className="h-5 w-5" />
              <span className="font-medium">Execute Workflow</span>
            </div>
            <p className="text-sm text-gray-600">
              Running the workflow will process your uploaded files through each connected node in sequence.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Watch:</strong> You'll see real-time progress as each step completes!
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'save-workflow',
        title: 'Save Your Workflow',
        description: 'Save your workflow so you can reuse it later with different files.',
        target: '[data-tutorial="save-workflow"]',
        action: 'click',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Saving your workflow allows you to reuse the same processing steps with different PDF files in the future.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-800">
                <strong>Pro Tip:</strong> Give your workflow a descriptive name so you can easily find it later!
              </p>
            </div>
          </div>
        )
      },
      {
        id: 'congratulations',
        title: 'Congratulations!',
        description: 'You\'ve successfully created your first workflow! You now know the basics of the workflow builder.',
        content: (
          <div className="text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h4 className="text-lg font-medium text-gray-900">Workflow Created Successfully!</h4>
            <p className="text-gray-600">
              You've learned how to create nodes, connect them, upload files, and run workflows.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">What's Next?</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Try the "Advanced Workflows" tutorial</li>
                <li>• Experiment with different node types</li>
                <li>• Create workflows for your own PDF processing needs</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'advanced-workflow',
    title: 'Advanced Workflow Techniques',
    description: 'Learn to create complex workflows with multiple processing steps, conditions, and parallel paths.',
    difficulty: 'intermediate',
    duration: '10 minutes',
    category: 'workflows',
    steps: [
      {
        id: 'complex-intro',
        title: 'Building Complex Workflows',
        description: 'Advanced workflows can have multiple paths, conditions, and parallel processing steps.',
        content: (
          <div className="space-y-4">
            <p className="text-gray-600">
              In this tutorial, you'll learn to create workflows that can handle complex PDF processing scenarios.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Advanced Features:</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Multiple processing paths</li>
                <li>• Conditional logic nodes</li>
                <li>• Parallel processing</li>
                <li>• File merging and splitting</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'parallel-processing',
        title: 'Parallel Processing Paths',
        description: 'Create workflows that process files through multiple paths simultaneously.',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              You can split your workflow into parallel paths to perform different operations on the same input files.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Example:</strong> Split a PDF, then both extract specific pages AND merge with another document.
              </p>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'node-configuration',
    title: 'Configuring Node Properties',
    description: 'Learn how to configure each node type with specific settings and parameters.',
    difficulty: 'intermediate',
    duration: '8 minutes',
    category: 'workflows',
    steps: [
      {
        id: 'config-intro',
        title: 'Node Configuration Basics',
        description: 'Each node type has specific configuration options that control how it processes files.',
        content: (
          <div className="space-y-4">
            <p className="text-gray-600">
              Proper node configuration is key to creating effective workflows that meet your specific needs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border rounded-lg p-3">
                <h5 className="font-medium text-purple-600 mb-1">Split Node</h5>
                <p className="text-xs text-gray-600">Page ranges, split by size</p>
              </div>
              <div className="border rounded-lg p-3">
                <h5 className="font-medium text-green-600 mb-1">Merge Node</h5>
                <p className="text-xs text-gray-600">File order, bookmarks</p>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  {
    id: 'workflow-templates',
    title: 'Using Workflow Templates',
    description: 'Discover pre-built workflow templates for common PDF processing tasks.',
    difficulty: 'beginner',
    duration: '6 minutes',
    category: 'basics',
    steps: [
      {
        id: 'templates-intro',
        title: 'Workflow Templates',
        description: 'Templates provide pre-configured workflows for common PDF processing scenarios.',
        content: (
          <div className="space-y-4">
            <p className="text-gray-600">
              Templates are a great way to get started quickly with proven workflow patterns.
            </p>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Available Templates:</h4>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• Document Splitting</li>
                <li>• Page Extraction</li>
                <li>• File Merging</li>
                <li>• Batch Processing</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  }
]
