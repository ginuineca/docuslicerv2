import React from 'react'
import { Tutorial } from '../TutorialOverlay'
import { Upload, Scissors, Download, ArrowRight, MousePointer, FileText, Zap, Target, Award } from 'lucide-react'

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
  },
  {
    id: 'interactive-mastery',
    title: 'Interactive Workflow Mastery',
    description: 'Master advanced workflow techniques with hands-on interactive challenges and real-time feedback.',
    difficulty: 'advanced',
    duration: '15 minutes',
    category: 'advanced',
    steps: [
      {
        id: 'mastery-intro',
        title: 'Welcome to Workflow Mastery!',
        description: 'This advanced tutorial will challenge you with real workflow scenarios and interactive tasks.',
        content: (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-3">🏆</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready for the Challenge?</h4>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
              <h5 className="font-medium text-purple-900 mb-2">What makes this special:</h5>
              <ul className="text-purple-800 text-sm space-y-1">
                <li>• Interactive challenges with real-time validation</li>
                <li>• Performance tracking and scoring</li>
                <li>• Advanced workflow patterns and techniques</li>
                <li>• Unlock achievements and earn XP points</li>
              </ul>
            </div>
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span>5 Challenges</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>500 XP</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-purple-500" />
                <span>3 Achievements</span>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'challenge-1',
        title: 'Challenge 1: Speed Building',
        description: 'Create a complete workflow in under 60 seconds. Ready, set, go!',
        content: (
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Speed Challenge</span>
              </div>
              <p className="text-sm text-yellow-700">
                Build a workflow with Input → Split → Output nodes and connect them all within 60 seconds!
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-red-600">01:00</div>
              <div className="text-sm text-gray-600">Time remaining</div>
            </div>
          </div>
        )
      },
      {
        id: 'challenge-2',
        title: 'Challenge 2: Complex Routing',
        description: 'Create a workflow with parallel processing paths and conditional logic.',
        content: (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Complexity Challenge</span>
              </div>
              <p className="text-sm text-blue-700">
                Build a workflow that splits input into two parallel paths: one for page extraction, one for merging.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-gray-100 rounded">
                <div className="font-medium">Input</div>
                <div className="text-gray-600">PDF Files</div>
              </div>
              <div className="text-center p-2 bg-gray-100 rounded">
                <div className="font-medium">Process</div>
                <div className="text-gray-600">Split & Route</div>
              </div>
              <div className="text-center p-2 bg-gray-100 rounded">
                <div className="font-medium">Output</div>
                <div className="text-gray-600">Results</div>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'challenge-3',
        title: 'Challenge 3: Configuration Master',
        description: 'Configure advanced node properties with precision and efficiency.',
        content: (
          <div className="space-y-3">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-800">Configuration Challenge</span>
              </div>
              <p className="text-sm text-purple-700">
                Configure a Split node to extract pages 1-5, 10-15, and 20-25 from uploaded PDFs.
              </p>
            </div>
            <div className="bg-gray-50 rounded p-2 text-xs font-mono">
              Target: pages=[1-5, 10-15, 20-25], format=separate-files
            </div>
          </div>
        )
      },
      {
        id: 'mastery-complete',
        title: 'Mastery Achieved!',
        description: 'Congratulations! You\'ve completed all challenges and earned mastery status.',
        content: (
          <div className="text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h4 className="text-xl font-bold text-gray-900">Workflow Master!</h4>
            <p className="text-gray-600">
              You've demonstrated advanced workflow skills and earned the title of Workflow Master!
            </p>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4">
              <h5 className="font-medium text-purple-900 mb-2">Achievements Unlocked:</h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-800">⚡ Speed Builder</span>
                  <span className="text-purple-600">+100 XP</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-800">🎯 Complexity Master</span>
                  <span className="text-purple-600">+200 XP</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-800">🏆 Configuration Expert</span>
                  <span className="text-purple-600">+200 XP</span>
                </div>
              </div>
              <div className="border-t border-purple-200 mt-3 pt-3">
                <div className="flex items-center justify-between font-medium">
                  <span className="text-purple-900">Total XP Earned</span>
                  <span className="text-purple-700">+500 XP</span>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ]
  }
]
