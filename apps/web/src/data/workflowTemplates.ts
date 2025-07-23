import { Node, Edge } from 'reactflow'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'document-processing' | 'page-management' | 'batch-operations' | 'advanced'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  nodes: Node[]
  edges: Edge[]
  thumbnail?: string
  estimatedTime: string
  useCase: string
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'simple-split',
    name: 'Simple PDF Split',
    description: 'Split a PDF document into individual pages',
    category: 'document-processing',
    difficulty: 'beginner',
    tags: ['split', 'pages', 'basic'],
    estimatedTime: '2 minutes',
    useCase: 'Perfect for separating multi-page documents into individual files',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 100 },
        data: {
          label: 'Upload PDF',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'split-1',
        type: 'workflowNode',
        position: { x: 400, y: 100 },
        data: {
          label: 'Split by Pages',
          type: 'split',
          status: 'idle',
          config: {
            splitType: 'pages',
            pagesPerFile: 1
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 100 },
        data: {
          label: 'Download Files',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'split-1',
        type: 'smoothstep'
      },
      {
        id: 'e2-3',
        source: 'split-1',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'page-extraction',
    name: 'Page Range Extraction',
    description: 'Extract specific page ranges from PDF documents',
    category: 'page-management',
    difficulty: 'intermediate',
    tags: ['extract', 'pages', 'range'],
    estimatedTime: '3 minutes',
    useCase: 'Extract specific sections like chapters or appendices from documents',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 100 },
        data: {
          label: 'Upload PDF',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'extract-1',
        type: 'workflowNode',
        position: { x: 400, y: 100 },
        data: {
          label: 'Extract Pages 1-5',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '1-5'
          }
        }
      },
      {
        id: 'extract-2',
        type: 'workflowNode',
        position: { x: 400, y: 250 },
        data: {
          label: 'Extract Pages 10-15',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '10-15'
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 175 },
        data: {
          label: 'Download Extracts',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'extract-1',
        type: 'smoothstep'
      },
      {
        id: 'e1-3',
        source: 'input-1',
        target: 'extract-2',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'extract-1',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e3-4',
        source: 'extract-2',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'merge-documents',
    name: 'Document Merger',
    description: 'Combine multiple PDF files into a single document',
    category: 'document-processing',
    difficulty: 'beginner',
    tags: ['merge', 'combine', 'documents'],
    estimatedTime: '2 minutes',
    useCase: 'Combine reports, invoices, or related documents into one file',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 100 },
        data: {
          label: 'Upload PDFs',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'merge-1',
        type: 'workflowNode',
        position: { x: 400, y: 100 },
        data: {
          label: 'Merge Documents',
          type: 'merge',
          status: 'idle',
          config: {
            preserveBookmarks: true,
            addPageNumbers: false
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 100 },
        data: {
          label: 'Download Merged',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'merge-1',
        type: 'smoothstep'
      },
      {
        id: 'e2-3',
        source: 'merge-1',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'batch-processing',
    name: 'Batch Document Processing',
    description: 'Process multiple documents with split and merge operations',
    category: 'batch-operations',
    difficulty: 'advanced',
    tags: ['batch', 'split', 'merge', 'complex'],
    estimatedTime: '5 minutes',
    useCase: 'Process large batches of documents with complex routing',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Batch Upload',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'split-1',
        type: 'workflowNode',
        position: { x: 300, y: 100 },
        data: {
          label: 'Split Documents',
          type: 'split',
          status: 'idle'
        }
      },
      {
        id: 'extract-1',
        type: 'workflowNode',
        position: { x: 300, y: 300 },
        data: {
          label: 'Extract First Page',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '1'
          }
        }
      },
      {
        id: 'merge-1',
        type: 'workflowNode',
        position: { x: 500, y: 200 },
        data: {
          label: 'Merge Results',
          type: 'merge',
          status: 'idle'
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 200 },
        data: {
          label: 'Download Results',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'split-1',
        type: 'smoothstep'
      },
      {
        id: 'e1-3',
        source: 'input-1',
        target: 'extract-1',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'split-1',
        target: 'merge-1',
        type: 'smoothstep'
      },
      {
        id: 'e3-4',
        source: 'extract-1',
        target: 'merge-1',
        type: 'smoothstep'
      },
      {
        id: 'e4-5',
        source: 'merge-1',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'conditional-processing',
    name: 'Smart Document Router',
    description: 'Route documents based on page count with conditional logic',
    category: 'advanced',
    difficulty: 'advanced',
    tags: ['conditional', 'routing', 'smart', 'logic'],
    estimatedTime: '7 minutes',
    useCase: 'Automatically route documents based on size or content',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Documents',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'condition-1',
        type: 'workflowNode',
        position: { x: 350, y: 200 },
        data: {
          label: 'Check Page Count',
          type: 'condition',
          status: 'idle',
          config: {
            condition: 'pageCount > 10'
          }
        }
      },
      {
        id: 'split-1',
        type: 'workflowNode',
        position: { x: 600, y: 100 },
        data: {
          label: 'Split Large Docs',
          type: 'split',
          status: 'idle'
        }
      },
      {
        id: 'merge-1',
        type: 'workflowNode',
        position: { x: 600, y: 300 },
        data: {
          label: 'Merge Small Docs',
          type: 'merge',
          status: 'idle'
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 850, y: 200 },
        data: {
          label: 'Download Results',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'condition-1',
        type: 'smoothstep'
      },
      {
        id: 'e2-3',
        source: 'condition-1',
        target: 'split-1',
        type: 'smoothstep',
        label: 'Large (>10 pages)'
      },
      {
        id: 'e2-4',
        source: 'condition-1',
        target: 'merge-1',
        type: 'smoothstep',
        label: 'Small (≤10 pages)'
      },
      {
        id: 'e3-5',
        source: 'split-1',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e4-5',
        source: 'merge-1',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  }
]
