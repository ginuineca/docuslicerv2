import { Node, Edge } from 'reactflow'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'document-processing' | 'page-management' | 'batch-operations' | 'advanced' | 'business' | 'education' | 'conversion' | 'image-processing'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  nodes: Node[]
  edges: Edge[]
  thumbnail?: string
  estimatedTime: string
  useCase: string
}

export const workflowTemplates: WorkflowTemplate[] = [
  // BEGINNER TEMPLATES
  {
    id: 'single-page-extract',
    name: 'Single Page Extractor',
    description: 'Extract just the first page from PDF documents',
    category: 'page-management',
    difficulty: 'beginner',
    tags: ['extract', 'first-page', 'cover'],
    estimatedTime: '1 minute',
    useCase: 'Perfect for extracting cover pages or first pages from documents',
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
          label: 'Extract First Page',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '1'
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 100 },
        data: {
          label: 'Download Page',
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
        id: 'e2-3',
        source: 'extract-1',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'remove-last-page',
    name: 'Remove Last Page',
    description: 'Remove the last page from PDF documents',
    category: 'page-management',
    difficulty: 'beginner',
    tags: ['remove', 'last-page', 'trim'],
    estimatedTime: '2 minutes',
    useCase: 'Remove blank pages, ads, or unwanted content from document ends',
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
          label: 'Extract All But Last',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '1:-1',
            excludeLastPage: true
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 100 },
        data: {
          label: 'Download Trimmed',
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
        id: 'e2-3',
        source: 'extract-1',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'odd-even-split',
    name: 'Odd/Even Page Splitter',
    description: 'Separate odd and even pages into different documents',
    category: 'page-management',
    difficulty: 'intermediate',
    tags: ['odd', 'even', 'split', 'duplex'],
    estimatedTime: '3 minutes',
    useCase: 'Perfect for separating front and back pages from scanned duplex documents',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload PDF',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'extract-odd',
        type: 'workflowNode',
        position: { x: 400, y: 100 },
        data: {
          label: 'Extract Odd Pages',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: 'odd',
            pattern: '1,3,5,7,9...'
          }
        }
      },
      {
        id: 'extract-even',
        type: 'workflowNode',
        position: { x: 400, y: 300 },
        data: {
          label: 'Extract Even Pages',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: 'even',
            pattern: '2,4,6,8,10...'
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 200 },
        data: {
          label: 'Download Both',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'extract-odd',
        type: 'smoothstep'
      },
      {
        id: 'e1-3',
        source: 'input-1',
        target: 'extract-even',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'extract-odd',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e3-4',
        source: 'extract-even',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'chapter-splitter',
    name: 'Chapter Splitter',
    description: 'Split documents into chapters based on page ranges',
    category: 'document-processing',
    difficulty: 'intermediate',
    tags: ['chapters', 'sections', 'split', 'book'],
    estimatedTime: '4 minutes',
    useCase: 'Split books, reports, or manuals into individual chapters',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Document',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'extract-ch1',
        type: 'workflowNode',
        position: { x: 350, y: 50 },
        data: {
          label: 'Chapter 1 (1-10)',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '1-10'
          }
        }
      },
      {
        id: 'extract-ch2',
        type: 'workflowNode',
        position: { x: 350, y: 150 },
        data: {
          label: 'Chapter 2 (11-20)',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '11-20'
          }
        }
      },
      {
        id: 'extract-ch3',
        type: 'workflowNode',
        position: { x: 350, y: 250 },
        data: {
          label: 'Chapter 3 (21-30)',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '21-30'
          }
        }
      },
      {
        id: 'extract-ch4',
        type: 'workflowNode',
        position: { x: 350, y: 350 },
        data: {
          label: 'Chapter 4 (31+)',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '31-'
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 600, y: 200 },
        data: {
          label: 'Download Chapters',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'extract-ch1',
        type: 'smoothstep'
      },
      {
        id: 'e1-3',
        source: 'input-1',
        target: 'extract-ch2',
        type: 'smoothstep'
      },
      {
        id: 'e1-4',
        source: 'input-1',
        target: 'extract-ch3',
        type: 'smoothstep'
      },
      {
        id: 'e1-5',
        source: 'input-1',
        target: 'extract-ch4',
        type: 'smoothstep'
      },
      {
        id: 'e2-6',
        source: 'extract-ch1',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e3-6',
        source: 'extract-ch2',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e4-6',
        source: 'extract-ch3',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e5-6',
        source: 'extract-ch4',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
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
  },
  {
    id: 'invoice-processor',
    name: 'Invoice Batch Processor',
    description: 'Process multiple invoices with extraction and organization',
    category: 'batch-operations',
    difficulty: 'advanced',
    tags: ['invoice', 'batch', 'business', 'extract'],
    estimatedTime: '6 minutes',
    useCase: 'Process batches of invoices, extract first pages, and organize by date',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Invoices',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'extract-1',
        type: 'workflowNode',
        position: { x: 300, y: 100 },
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
        id: 'split-1',
        type: 'workflowNode',
        position: { x: 300, y: 300 },
        data: {
          label: 'Split Multi-page',
          type: 'split',
          status: 'idle',
          config: {
            splitType: 'pages',
            pagesPerFile: 1
          }
        }
      },
      {
        id: 'merge-1',
        type: 'workflowNode',
        position: { x: 500, y: 200 },
        data: {
          label: 'Merge by Type',
          type: 'merge',
          status: 'idle',
          config: {
            sortBy: 'filename',
            preserveBookmarks: true
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 200 },
        data: {
          label: 'Download Organized',
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
        target: 'split-1',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'extract-1',
        target: 'merge-1',
        type: 'smoothstep'
      },
      {
        id: 'e3-4',
        source: 'split-1',
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
    id: 'presentation-handouts',
    name: 'Presentation Handout Creator',
    description: 'Convert presentation slides into printable handouts',
    category: 'document-processing',
    difficulty: 'intermediate',
    tags: ['presentation', 'handouts', 'slides', 'print'],
    estimatedTime: '4 minutes',
    useCase: 'Create handout versions of presentations with multiple slides per page',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Slides',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'split-1',
        type: 'workflowNode',
        position: { x: 300, y: 100 },
        data: {
          label: 'Split Slides',
          type: 'split',
          status: 'idle',
          config: {
            splitType: 'pages',
            pagesPerFile: 1
          }
        }
      },
      {
        id: 'merge-handout',
        type: 'workflowNode',
        position: { x: 300, y: 300 },
        data: {
          label: 'Create Handout',
          type: 'merge',
          status: 'idle',
          config: {
            layout: '4-per-page',
            addPageNumbers: true
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 500, y: 200 },
        data: {
          label: 'Download Handout',
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
        target: 'merge-handout',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'split-1',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e3-4',
        source: 'merge-handout',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'legal-redaction',
    name: 'Legal Document Processor',
    description: 'Process legal documents with redaction and page extraction',
    category: 'advanced',
    difficulty: 'advanced',
    tags: ['legal', 'redaction', 'confidential', 'extract'],
    estimatedTime: '8 minutes',
    useCase: 'Process legal documents, extract public sections, redact confidential content',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 250 },
        data: {
          label: 'Upload Legal Docs',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'condition-1',
        type: 'workflowNode',
        position: { x: 300, y: 250 },
        data: {
          label: 'Check Confidentiality',
          type: 'condition',
          status: 'idle',
          config: {
            condition: 'hasConfidentialContent'
          }
        }
      },
      {
        id: 'extract-public',
        type: 'workflowNode',
        position: { x: 500, y: 150 },
        data: {
          label: 'Extract Public Pages',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '1-5,10-15'
          }
        }
      },
      {
        id: 'redact-1',
        type: 'workflowNode',
        position: { x: 500, y: 350 },
        data: {
          label: 'Redact Confidential',
          type: 'extract',
          status: 'idle',
          config: {
            redactionMode: true,
            pageRanges: '6-9,16-'
          }
        }
      },
      {
        id: 'merge-final',
        type: 'workflowNode',
        position: { x: 700, y: 250 },
        data: {
          label: 'Merge Final Doc',
          type: 'merge',
          status: 'idle',
          config: {
            preserveBookmarks: true,
            addWatermark: 'PROCESSED'
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 900, y: 250 },
        data: {
          label: 'Download Processed',
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
        target: 'extract-public',
        type: 'smoothstep',
        label: 'Public'
      },
      {
        id: 'e2-4',
        source: 'condition-1',
        target: 'redact-1',
        type: 'smoothstep',
        label: 'Confidential'
      },
      {
        id: 'e3-5',
        source: 'extract-public',
        target: 'merge-final',
        type: 'smoothstep'
      },
      {
        id: 'e4-5',
        source: 'redact-1',
        target: 'merge-final',
        type: 'smoothstep'
      },
      {
        id: 'e5-6',
        source: 'merge-final',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'report-compiler',
    name: 'Multi-Source Report Compiler',
    description: 'Compile reports from multiple sources with cover page',
    category: 'batch-operations',
    difficulty: 'advanced',
    tags: ['report', 'compile', 'cover', 'multi-source'],
    estimatedTime: '7 minutes',
    useCase: 'Compile comprehensive reports from multiple document sources',
    nodes: [
      {
        id: 'input-cover',
        type: 'workflowNode',
        position: { x: 100, y: 100 },
        data: {
          label: 'Upload Cover',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'input-content',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Content',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'input-appendix',
        type: 'workflowNode',
        position: { x: 100, y: 300 },
        data: {
          label: 'Upload Appendix',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'merge-all',
        type: 'workflowNode',
        position: { x: 400, y: 200 },
        data: {
          label: 'Compile Report',
          type: 'merge',
          status: 'idle',
          config: {
            order: 'cover,content,appendix',
            addPageNumbers: true,
            createBookmarks: true
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 200 },
        data: {
          label: 'Download Report',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-4',
        source: 'input-cover',
        target: 'merge-all',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'input-content',
        target: 'merge-all',
        type: 'smoothstep'
      },
      {
        id: 'e3-4',
        source: 'input-appendix',
        target: 'merge-all',
        type: 'smoothstep'
      },
      {
        id: 'e4-5',
        source: 'merge-all',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'form-processor',
    name: 'Form Data Processor',
    description: 'Process filled forms and extract data pages',
    category: 'document-processing',
    difficulty: 'intermediate',
    tags: ['forms', 'data', 'extract', 'process'],
    estimatedTime: '5 minutes',
    useCase: 'Process completed forms, extract data pages, and organize submissions',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Forms',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'condition-1',
        type: 'workflowNode',
        position: { x: 300, y: 200 },
        data: {
          label: 'Check Completion',
          type: 'condition',
          status: 'idle',
          config: {
            condition: 'isFormComplete'
          }
        }
      },
      {
        id: 'extract-data',
        type: 'workflowNode',
        position: { x: 500, y: 100 },
        data: {
          label: 'Extract Data Pages',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '2-4'
          }
        }
      },
      {
        id: 'split-incomplete',
        type: 'workflowNode',
        position: { x: 500, y: 300 },
        data: {
          label: 'Flag Incomplete',
          type: 'split',
          status: 'idle',
          config: {
            addWatermark: 'INCOMPLETE'
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 200 },
        data: {
          label: 'Download Processed',
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
        target: 'extract-data',
        type: 'smoothstep',
        label: 'Complete'
      },
      {
        id: 'e2-4',
        source: 'condition-1',
        target: 'split-incomplete',
        type: 'smoothstep',
        label: 'Incomplete'
      },
      {
        id: 'e3-5',
        source: 'extract-data',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e4-5',
        source: 'split-incomplete',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'archive-organizer',
    name: 'Document Archive Organizer',
    description: 'Organize and split large document archives',
    category: 'batch-operations',
    difficulty: 'advanced',
    tags: ['archive', 'organize', 'batch', 'split'],
    estimatedTime: '10 minutes',
    useCase: 'Process large document archives, split by size, and organize by type',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 300 },
        data: {
          label: 'Upload Archive',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'condition-size',
        type: 'workflowNode',
        position: { x: 300, y: 300 },
        data: {
          label: 'Check Size',
          type: 'condition',
          status: 'idle',
          config: {
            condition: 'fileSize > 50MB'
          }
        }
      },
      {
        id: 'split-large',
        type: 'workflowNode',
        position: { x: 500, y: 200 },
        data: {
          label: 'Split Large Files',
          type: 'split',
          status: 'idle',
          config: {
            splitType: 'size',
            maxSizePerFile: '10MB'
          }
        }
      },
      {
        id: 'extract-toc',
        type: 'workflowNode',
        position: { x: 500, y: 400 },
        data: {
          label: 'Extract TOC',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '1-3'
          }
        }
      },
      {
        id: 'merge-organized',
        type: 'workflowNode',
        position: { x: 700, y: 300 },
        data: {
          label: 'Organize by Type',
          type: 'merge',
          status: 'idle',
          config: {
            sortBy: 'type',
            createIndex: true
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 900, y: 300 },
        data: {
          label: 'Download Organized',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'condition-size',
        type: 'smoothstep'
      },
      {
        id: 'e2-3',
        source: 'condition-size',
        target: 'split-large',
        type: 'smoothstep',
        label: 'Large'
      },
      {
        id: 'e2-4',
        source: 'condition-size',
        target: 'extract-toc',
        type: 'smoothstep',
        label: 'Small'
      },
      {
        id: 'e3-5',
        source: 'split-large',
        target: 'merge-organized',
        type: 'smoothstep'
      },
      {
        id: 'e4-5',
        source: 'extract-toc',
        target: 'merge-organized',
        type: 'smoothstep'
      },
      {
        id: 'e5-6',
        source: 'merge-organized',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  // BUSINESS TEMPLATES
  {
    id: 'contract-processor',
    name: 'Contract Document Processor',
    description: 'Process contracts with signature page extraction',
    category: 'business',
    difficulty: 'intermediate',
    tags: ['contract', 'signature', 'business', 'legal'],
    estimatedTime: '4 minutes',
    useCase: 'Extract signature pages from contracts and organize by type',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Contracts',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'extract-sig',
        type: 'workflowNode',
        position: { x: 350, y: 100 },
        data: {
          label: 'Extract Signatures',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '-1',
            extractLastPage: true
          }
        }
      },
      {
        id: 'extract-terms',
        type: 'workflowNode',
        position: { x: 350, y: 300 },
        data: {
          label: 'Extract Terms',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '1:-1',
            excludeLastPage: true
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 600, y: 200 },
        data: {
          label: 'Download Organized',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'extract-sig',
        type: 'smoothstep'
      },
      {
        id: 'e1-3',
        source: 'input-1',
        target: 'extract-terms',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'extract-sig',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e3-4',
        source: 'extract-terms',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'financial-report',
    name: 'Financial Report Compiler',
    description: 'Compile financial reports from multiple sources',
    category: 'business',
    difficulty: 'advanced',
    tags: ['financial', 'report', 'business', 'compile'],
    estimatedTime: '8 minutes',
    useCase: 'Compile quarterly financial reports from various department inputs',
    nodes: [
      {
        id: 'input-summary',
        type: 'workflowNode',
        position: { x: 100, y: 100 },
        data: {
          label: 'Executive Summary',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'input-financials',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Financial Data',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'input-charts',
        type: 'workflowNode',
        position: { x: 100, y: 300 },
        data: {
          label: 'Charts & Graphs',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'input-appendix',
        type: 'workflowNode',
        position: { x: 100, y: 400 },
        data: {
          label: 'Appendices',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'merge-report',
        type: 'workflowNode',
        position: { x: 400, y: 250 },
        data: {
          label: 'Compile Report',
          type: 'merge',
          status: 'idle',
          config: {
            order: 'summary,financials,charts,appendix',
            addPageNumbers: true,
            createBookmarks: true,
            addWatermark: 'CONFIDENTIAL'
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 250 },
        data: {
          label: 'Download Report',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-5',
        source: 'input-summary',
        target: 'merge-report',
        type: 'smoothstep'
      },
      {
        id: 'e2-5',
        source: 'input-financials',
        target: 'merge-report',
        type: 'smoothstep'
      },
      {
        id: 'e3-5',
        source: 'input-charts',
        target: 'merge-report',
        type: 'smoothstep'
      },
      {
        id: 'e4-5',
        source: 'input-appendix',
        target: 'merge-report',
        type: 'smoothstep'
      },
      {
        id: 'e5-6',
        source: 'merge-report',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  // EDUCATION TEMPLATES
  {
    id: 'exam-processor',
    name: 'Exam Paper Processor',
    description: 'Process exam papers and separate answer sheets',
    category: 'education',
    difficulty: 'intermediate',
    tags: ['exam', 'education', 'answer-sheet', 'grading'],
    estimatedTime: '5 minutes',
    useCase: 'Separate exam questions from answer sheets for grading',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Exam Papers',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'extract-questions',
        type: 'workflowNode',
        position: { x: 350, y: 100 },
        data: {
          label: 'Extract Questions',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '1-3'
          }
        }
      },
      {
        id: 'extract-answers',
        type: 'workflowNode',
        position: { x: 350, y: 300 },
        data: {
          label: 'Extract Answer Sheets',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '4-'
          }
        }
      },
      {
        id: 'split-students',
        type: 'workflowNode',
        position: { x: 600, y: 300 },
        data: {
          label: 'Split by Student',
          type: 'split',
          status: 'idle',
          config: {
            splitType: 'student-id',
            pagesPerStudent: 2
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 850, y: 200 },
        data: {
          label: 'Download Organized',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'extract-questions',
        type: 'smoothstep'
      },
      {
        id: 'e1-3',
        source: 'input-1',
        target: 'extract-answers',
        type: 'smoothstep'
      },
      {
        id: 'e3-4',
        source: 'extract-answers',
        target: 'split-students',
        type: 'smoothstep'
      },
      {
        id: 'e2-5',
        source: 'extract-questions',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e4-5',
        source: 'split-students',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'textbook-chapter',
    name: 'Textbook Chapter Extractor',
    description: 'Extract individual chapters from textbooks for distribution',
    category: 'education',
    difficulty: 'beginner',
    tags: ['textbook', 'chapter', 'education', 'distribute'],
    estimatedTime: '3 minutes',
    useCase: 'Extract specific chapters from textbooks for course assignments',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Textbook',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'extract-ch5',
        type: 'workflowNode',
        position: { x: 400, y: 100 },
        data: {
          label: 'Chapter 5 (50-75)',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '50-75'
          }
        }
      },
      {
        id: 'extract-ch8',
        type: 'workflowNode',
        position: { x: 400, y: 300 },
        data: {
          label: 'Chapter 8 (120-145)',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '120-145'
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 200 },
        data: {
          label: 'Download Chapters',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'extract-ch5',
        type: 'smoothstep'
      },
      {
        id: 'e1-3',
        source: 'input-1',
        target: 'extract-ch8',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'extract-ch5',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e3-4',
        source: 'extract-ch8',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'assignment-compiler',
    name: 'Assignment Submission Compiler',
    description: 'Compile student assignments into a single grading document',
    category: 'education',
    difficulty: 'intermediate',
    tags: ['assignment', 'student', 'grading', 'compile'],
    estimatedTime: '6 minutes',
    useCase: 'Compile multiple student assignments for efficient grading',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Assignments',
          type: 'input',
          status: 'idle'
        }
      },
      {
        id: 'split-1',
        type: 'workflowNode',
        position: { x: 300, y: 100 },
        data: {
          label: 'Split by Student',
          type: 'split',
          status: 'idle',
          config: {
            splitType: 'filename',
            preserveOrder: true
          }
        }
      },
      {
        id: 'extract-cover',
        type: 'workflowNode',
        position: { x: 300, y: 300 },
        data: {
          label: 'Extract Cover Pages',
          type: 'extract',
          status: 'idle',
          config: {
            pageRanges: '1'
          }
        }
      },
      {
        id: 'merge-grading',
        type: 'workflowNode',
        position: { x: 500, y: 200 },
        data: {
          label: 'Compile for Grading',
          type: 'merge',
          status: 'idle',
          config: {
            sortBy: 'student-name',
            addSeparators: true,
            addPageNumbers: true
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 200 },
        data: {
          label: 'Download Compiled',
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
        target: 'extract-cover',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'split-1',
        target: 'merge-grading',
        type: 'smoothstep'
      },
      {
        id: 'e3-4',
        source: 'extract-cover',
        target: 'merge-grading',
        type: 'smoothstep'
      },
      {
        id: 'e4-5',
        source: 'merge-grading',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  // CONVERSION TEMPLATES
  {
    id: 'office-to-pdf',
    name: 'Office Documents to PDF',
    description: 'Convert Word, Excel, and PowerPoint files to PDF format',
    category: 'conversion',
    difficulty: 'beginner',
    tags: ['convert', 'office', 'pdf', 'word', 'excel', 'powerpoint'],
    estimatedTime: '2 minutes',
    useCase: 'Convert Microsoft Office documents to PDF for sharing and archiving',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Office Docs',
          type: 'input',
          status: 'idle',
          config: {
            acceptedTypes: ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt']
          }
        }
      },
      {
        id: 'convert-1',
        type: 'workflowNode',
        position: { x: 400, y: 200 },
        data: {
          label: 'Convert to PDF',
          type: 'convert',
          status: 'idle',
          config: {
            outputFormat: 'pdf',
            preserveFormatting: true,
            embedFonts: true
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 200 },
        data: {
          label: 'Download PDFs',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'convert-1',
        type: 'smoothstep'
      },
      {
        id: 'e2-3',
        source: 'convert-1',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'pdf-to-office',
    name: 'PDF to Office Converter',
    description: 'Convert PDF files to editable Word, Excel, or PowerPoint formats',
    category: 'conversion',
    difficulty: 'intermediate',
    tags: ['convert', 'pdf', 'word', 'excel', 'editable'],
    estimatedTime: '3 minutes',
    useCase: 'Convert PDFs back to editable Office formats for modification',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 250 },
        data: {
          label: 'Upload PDFs',
          type: 'input',
          status: 'idle',
          config: {
            acceptedTypes: ['pdf']
          }
        }
      },
      {
        id: 'condition-1',
        type: 'workflowNode',
        position: { x: 300, y: 250 },
        data: {
          label: 'Detect Content Type',
          type: 'condition',
          status: 'idle',
          config: {
            condition: 'detectDocumentType'
          }
        }
      },
      {
        id: 'convert-word',
        type: 'workflowNode',
        position: { x: 500, y: 150 },
        data: {
          label: 'Convert to Word',
          type: 'convert',
          status: 'idle',
          config: {
            outputFormat: 'docx',
            preserveLayout: true
          }
        }
      },
      {
        id: 'convert-excel',
        type: 'workflowNode',
        position: { x: 500, y: 250 },
        data: {
          label: 'Convert to Excel',
          type: 'convert',
          status: 'idle',
          config: {
            outputFormat: 'xlsx',
            detectTables: true
          }
        }
      },
      {
        id: 'convert-ppt',
        type: 'workflowNode',
        position: { x: 500, y: 350 },
        data: {
          label: 'Convert to PowerPoint',
          type: 'convert',
          status: 'idle',
          config: {
            outputFormat: 'pptx',
            preserveSlides: true
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 750, y: 250 },
        data: {
          label: 'Download Converted',
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
        target: 'convert-word',
        type: 'smoothstep',
        label: 'Text Document'
      },
      {
        id: 'e2-4',
        source: 'condition-1',
        target: 'convert-excel',
        type: 'smoothstep',
        label: 'Spreadsheet'
      },
      {
        id: 'e2-5',
        source: 'condition-1',
        target: 'convert-ppt',
        type: 'smoothstep',
        label: 'Presentation'
      },
      {
        id: 'e3-6',
        source: 'convert-word',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e4-6',
        source: 'convert-excel',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e5-6',
        source: 'convert-ppt',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  // IMAGE PROCESSING TEMPLATES
  {
    id: 'image-to-pdf',
    name: 'Images to PDF Compiler',
    description: 'Convert multiple images into a single PDF document',
    category: 'image-processing',
    difficulty: 'beginner',
    tags: ['image', 'pdf', 'compile', 'jpg', 'png'],
    estimatedTime: '2 minutes',
    useCase: 'Create PDF documents from scanned images or photo collections',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Images',
          type: 'input',
          status: 'idle',
          config: {
            acceptedTypes: ['jpg', 'jpeg', 'png', 'tiff', 'bmp']
          }
        }
      },
      {
        id: 'process-1',
        type: 'workflowNode',
        position: { x: 350, y: 100 },
        data: {
          label: 'Optimize Images',
          type: 'compress',
          status: 'idle',
          config: {
            quality: 85,
            maxWidth: 1920,
            maxHeight: 1080
          }
        }
      },
      {
        id: 'merge-1',
        type: 'workflowNode',
        position: { x: 350, y: 300 },
        data: {
          label: 'Compile to PDF',
          type: 'merge',
          status: 'idle',
          config: {
            outputFormat: 'pdf',
            pageSize: 'A4',
            fitToPage: true
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 600, y: 200 },
        data: {
          label: 'Download PDF',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'process-1',
        type: 'smoothstep'
      },
      {
        id: 'e1-3',
        source: 'input-1',
        target: 'merge-1',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'process-1',
        target: 'output-1',
        type: 'smoothstep'
      },
      {
        id: 'e3-4',
        source: 'merge-1',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'ocr-processor',
    name: 'OCR Text Extractor',
    description: 'Extract text from images and scanned documents using OCR',
    category: 'image-processing',
    difficulty: 'intermediate',
    tags: ['ocr', 'text', 'extract', 'scan', 'image'],
    estimatedTime: '4 minutes',
    useCase: 'Convert scanned documents and images to searchable, editable text',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload Images/Scans',
          type: 'input',
          status: 'idle',
          config: {
            acceptedTypes: ['jpg', 'jpeg', 'png', 'tiff', 'pdf']
          }
        }
      },
      {
        id: 'preprocess-1',
        type: 'workflowNode',
        position: { x: 300, y: 100 },
        data: {
          label: 'Enhance Image',
          type: 'process',
          status: 'idle',
          config: {
            deskew: true,
            denoise: true,
            sharpen: true
          }
        }
      },
      {
        id: 'ocr-1',
        type: 'workflowNode',
        position: { x: 300, y: 300 },
        data: {
          label: 'Extract Text (OCR)',
          type: 'ocr',
          status: 'idle',
          config: {
            language: 'eng',
            confidence: 80,
            preserveLayout: true
          }
        }
      },
      {
        id: 'convert-1',
        type: 'workflowNode',
        position: { x: 500, y: 200 },
        data: {
          label: 'Convert to Document',
          type: 'convert',
          status: 'idle',
          config: {
            outputFormat: 'docx',
            preserveFormatting: true
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 700, y: 200 },
        data: {
          label: 'Download Text',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'preprocess-1',
        type: 'smoothstep'
      },
      {
        id: 'e1-3',
        source: 'input-1',
        target: 'ocr-1',
        type: 'smoothstep'
      },
      {
        id: 'e2-4',
        source: 'preprocess-1',
        target: 'convert-1',
        type: 'smoothstep'
      },
      {
        id: 'e3-4',
        source: 'ocr-1',
        target: 'convert-1',
        type: 'smoothstep'
      },
      {
        id: 'e4-5',
        source: 'convert-1',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  },
  {
    id: 'universal-converter',
    name: 'Universal Document Converter',
    description: 'Convert between any supported document formats',
    category: 'conversion',
    difficulty: 'advanced',
    tags: ['convert', 'universal', 'any-format', 'batch'],
    estimatedTime: '5 minutes',
    useCase: 'Convert any document type to any other supported format with batch processing',
    nodes: [
      {
        id: 'input-1',
        type: 'workflowNode',
        position: { x: 100, y: 300 },
        data: {
          label: 'Upload Any Documents',
          type: 'input',
          status: 'idle',
          config: {
            acceptedTypes: 'all'
          }
        }
      },
      {
        id: 'detect-1',
        type: 'workflowNode',
        position: { x: 300, y: 300 },
        data: {
          label: 'Detect Format',
          type: 'condition',
          status: 'idle',
          config: {
            condition: 'detectFileType'
          }
        }
      },
      {
        id: 'convert-pdf',
        type: 'workflowNode',
        position: { x: 500, y: 100 },
        data: {
          label: 'Convert to PDF',
          type: 'convert',
          status: 'idle',
          config: {
            outputFormat: 'pdf'
          }
        }
      },
      {
        id: 'convert-office',
        type: 'workflowNode',
        position: { x: 500, y: 200 },
        data: {
          label: 'Convert to Office',
          type: 'convert',
          status: 'idle',
          config: {
            outputFormat: 'auto-office'
          }
        }
      },
      {
        id: 'convert-image',
        type: 'workflowNode',
        position: { x: 500, y: 300 },
        data: {
          label: 'Convert to Image',
          type: 'convert',
          status: 'idle',
          config: {
            outputFormat: 'jpg',
            quality: 90
          }
        }
      },
      {
        id: 'convert-text',
        type: 'workflowNode',
        position: { x: 500, y: 400 },
        data: {
          label: 'Convert to Text',
          type: 'convert',
          status: 'idle',
          config: {
            outputFormat: 'txt',
            preserveLayout: false
          }
        }
      },
      {
        id: 'merge-1',
        type: 'workflowNode',
        position: { x: 700, y: 300 },
        data: {
          label: 'Organize Results',
          type: 'merge',
          status: 'idle',
          config: {
            groupByFormat: true,
            createFolders: true
          }
        }
      },
      {
        id: 'output-1',
        type: 'workflowNode',
        position: { x: 900, y: 300 },
        data: {
          label: 'Download Converted',
          type: 'output',
          status: 'idle'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'input-1',
        target: 'detect-1',
        type: 'smoothstep'
      },
      {
        id: 'e2-3',
        source: 'detect-1',
        target: 'convert-pdf',
        type: 'smoothstep',
        label: 'To PDF'
      },
      {
        id: 'e2-4',
        source: 'detect-1',
        target: 'convert-office',
        type: 'smoothstep',
        label: 'To Office'
      },
      {
        id: 'e2-5',
        source: 'detect-1',
        target: 'convert-image',
        type: 'smoothstep',
        label: 'To Image'
      },
      {
        id: 'e2-6',
        source: 'detect-1',
        target: 'convert-text',
        type: 'smoothstep',
        label: 'To Text'
      },
      {
        id: 'e3-7',
        source: 'convert-pdf',
        target: 'merge-1',
        type: 'smoothstep'
      },
      {
        id: 'e4-7',
        source: 'convert-office',
        target: 'merge-1',
        type: 'smoothstep'
      },
      {
        id: 'e5-7',
        source: 'convert-image',
        target: 'merge-1',
        type: 'smoothstep'
      },
      {
        id: 'e6-7',
        source: 'convert-text',
        target: 'merge-1',
        type: 'smoothstep'
      },
      {
        id: 'e7-8',
        source: 'merge-1',
        target: 'output-1',
        type: 'smoothstep'
      }
    ]
  }
]
