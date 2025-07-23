import { Node, Edge } from 'reactflow'
import { WorkflowTemplate } from './workflowTemplates'

/**
 * Optimized, tested, and functional workflow templates
 * These templates are designed for real-world performance and reliability
 */

export const optimizedWorkflowTemplates: WorkflowTemplate[] = [
  // FAST PDF PROCESSING TEMPLATES
  {
    id: 'lightning-pdf-split',
    name: 'Lightning PDF Split',
    description: 'Ultra-fast PDF splitting with parallel processing and smart caching',
    category: 'document-processing',
    difficulty: 'beginner',
    tier: 'free',
    tags: ['pdf', 'split', 'fast', 'parallel'],
    estimatedTime: '30 seconds',
    useCase: 'Split large PDFs into individual pages with maximum speed',
    businessValue: 'Process 100+ page documents in under 30 seconds',
    nodes: [
      {
        id: 'input-fast',
        type: 'workflowNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload PDF',
          type: 'input',
          status: 'idle',
          config: {
            acceptedTypes: ['pdf'],
            maxFileSize: '100MB',
            enablePreview: true,
            validatePDF: true
          }
        }
      },
      {
        id: 'analyze-fast',
        type: 'workflowNode',
        position: { x: 300, y: 200 },
        data: {
          label: 'Analyze Structure',
          type: 'analyze',
          status: 'idle',
          config: {
            extractMetadata: true,
            countPages: true,
            detectEncryption: true,
            cacheResults: true,
            parallel: true
          }
        }
      },
      {
        id: 'split-fast',
        type: 'workflowNode',
        position: { x: 500, y: 200 },
        data: {
          label: 'Parallel Split',
          type: 'split',
          status: 'idle',
          config: {
            splitMode: 'individual-pages',
            parallelWorkers: 4,
            chunkSize: 10,
            preserveQuality: true,
            enableCaching: true,
            outputFormat: 'pdf',
            namingPattern: 'page-{number}'
          }
        }
      },
      {
        id: 'optimize-fast',
        type: 'workflowNode',
        position: { x: 700, y: 200 },
        data: {
          label: 'Optimize Output',
          type: 'optimize',
          status: 'idle',
          config: {
            compressImages: true,
            removeUnusedObjects: true,
            optimizeForWeb: false,
            qualityLevel: 'high',
            parallel: true
          }
        }
      },
      {
        id: 'output-fast',
        type: 'workflowNode',
        position: { x: 900, y: 200 },
        data: {
          label: 'Download Results',
          type: 'output',
          status: 'idle',
          config: {
            packageFormat: 'zip',
            includeManifest: true,
            enablePreview: true,
            autoDownload: false
          }
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'input-fast', target: 'analyze-fast', type: 'smoothstep' },
      { id: 'e2', source: 'analyze-fast', target: 'split-fast', type: 'smoothstep' },
      { id: 'e3', source: 'split-fast', target: 'optimize-fast', type: 'smoothstep' },
      { id: 'e4', source: 'optimize-fast', target: 'output-fast', type: 'smoothstep' }
    ]
  },

  // INTELLIGENT DOCUMENT PROCESSOR
  {
    id: 'smart-document-processor',
    name: 'Smart Document Processor',
    description: 'AI-powered document classification and intelligent processing',
    category: 'advanced',
    difficulty: 'intermediate',
    tier: 'professional',
    tags: ['ai', 'classification', 'smart', 'automation'],
    estimatedTime: '2 minutes',
    useCase: 'Automatically classify and process mixed document types',
    businessValue: 'Reduce manual sorting by 90% with 95%+ accuracy',
    nodes: [
      {
        id: 'input-smart',
        type: 'workflowNode',
        position: { x: 100, y: 300 },
        data: {
          label: 'Upload Documents',
          type: 'input',
          status: 'idle',
          config: {
            acceptedTypes: ['pdf', 'docx', 'jpg', 'png'],
            batchUpload: true,
            maxBatchSize: 50,
            enableDragDrop: true
          }
        }
      },
      {
        id: 'classify-smart',
        type: 'workflowNode',
        position: { x: 350, y: 200 },
        data: {
          label: 'AI Classification',
          type: 'ai-classify',
          status: 'idle',
          config: {
            model: 'document-classifier-v2',
            confidence: 0.85,
            categories: ['invoice', 'contract', 'receipt', 'form', 'letter', 'report'],
            enableLearning: true,
            cacheResults: true,
            parallel: true
          }
        }
      },
      {
        id: 'route-invoices',
        type: 'workflowNode',
        position: { x: 600, y: 100 },
        data: {
          label: 'Process Invoices',
          type: 'condition',
          status: 'idle',
          config: {
            condition: 'classification === "invoice"',
            trueAction: 'extract-invoice-data',
            falseAction: 'continue'
          }
        }
      },
      {
        id: 'route-contracts',
        type: 'workflowNode',
        position: { x: 600, y: 200 },
        data: {
          label: 'Process Contracts',
          type: 'condition',
          status: 'idle',
          config: {
            condition: 'classification === "contract"',
            trueAction: 'extract-contract-terms',
            falseAction: 'continue'
          }
        }
      },
      {
        id: 'route-forms',
        type: 'workflowNode',
        position: { x: 600, y: 300 },
        data: {
          label: 'Process Forms',
          type: 'condition',
          status: 'idle',
          config: {
            condition: 'classification === "form"',
            trueAction: 'extract-form-data',
            falseAction: 'continue'
          }
        }
      },
      {
        id: 'extract-data',
        type: 'workflowNode',
        position: { x: 850, y: 200 },
        data: {
          label: 'Extract Data',
          type: 'ai-extract',
          status: 'idle',
          config: {
            model: 'data-extractor-v3',
            extractionRules: 'dynamic',
            outputFormat: 'structured-json',
            validateData: true,
            confidence: 0.9,
            parallel: true
          }
        }
      },
      {
        id: 'organize-smart',
        type: 'workflowNode',
        position: { x: 1100, y: 200 },
        data: {
          label: 'Organize Results',
          type: 'organize',
          status: 'idle',
          config: {
            groupBy: 'classification',
            createFolders: true,
            includeMetadata: true,
            generateReport: true
          }
        }
      },
      {
        id: 'output-smart',
        type: 'workflowNode',
        position: { x: 1350, y: 200 },
        data: {
          label: 'Export Results',
          type: 'output',
          status: 'idle',
          config: {
            formats: ['json', 'csv', 'pdf-report'],
            includeOriginals: true,
            createSummary: true
          }
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'input-smart', target: 'classify-smart', type: 'smoothstep' },
      { id: 'e2', source: 'classify-smart', target: 'route-invoices', type: 'smoothstep' },
      { id: 'e3', source: 'classify-smart', target: 'route-contracts', type: 'smoothstep' },
      { id: 'e4', source: 'classify-smart', target: 'route-forms', type: 'smoothstep' },
      { id: 'e5', source: 'route-invoices', target: 'extract-data', type: 'smoothstep' },
      { id: 'e6', source: 'route-contracts', target: 'extract-data', type: 'smoothstep' },
      { id: 'e7', source: 'route-forms', target: 'extract-data', type: 'smoothstep' },
      { id: 'e8', source: 'extract-data', target: 'organize-smart', type: 'smoothstep' },
      { id: 'e9', source: 'organize-smart', target: 'output-smart', type: 'smoothstep' }
    ]
  },

  // BATCH OCR POWERHOUSE
  {
    id: 'batch-ocr-powerhouse',
    name: 'Batch OCR Powerhouse',
    description: 'High-performance OCR processing with quality optimization and validation',
    category: 'batch-operations',
    difficulty: 'intermediate',
    tier: 'professional',
    tags: ['ocr', 'batch', 'text-extraction', 'quality'],
    estimatedTime: '5 minutes',
    useCase: 'Extract text from large batches of scanned documents with high accuracy',
    businessValue: 'Process 1000+ pages with 98%+ accuracy in minutes',
    nodes: [
      {
        id: 'input-ocr',
        type: 'workflowNode',
        position: { x: 100, y: 250 },
        data: {
          label: 'Upload Images/PDFs',
          type: 'input',
          status: 'idle',
          config: {
            acceptedTypes: ['pdf', 'jpg', 'png', 'tiff', 'bmp'],
            batchUpload: true,
            maxBatchSize: 1000,
            validateImages: true
          }
        }
      },
      {
        id: 'preprocess-ocr',
        type: 'workflowNode',
        position: { x: 300, y: 150 },
        data: {
          label: 'Image Enhancement',
          type: 'preprocess',
          status: 'idle',
          config: {
            deskew: true,
            denoise: true,
            enhanceContrast: true,
            normalizeResolution: 300,
            cropBorders: true,
            parallel: true,
            cacheResults: true
          }
        }
      },
      {
        id: 'quality-check',
        type: 'workflowNode',
        position: { x: 300, y: 350 },
        data: {
          label: 'Quality Assessment',
          type: 'analyze',
          status: 'idle',
          config: {
            checkReadability: true,
            detectBlur: true,
            assessContrast: true,
            minimumQuality: 0.7,
            autoReject: false
          }
        }
      },
      {
        id: 'ocr-engine',
        type: 'workflowNode',
        position: { x: 550, y: 250 },
        data: {
          label: 'OCR Processing',
          type: 'ocr',
          status: 'idle',
          config: {
            engine: 'tesseract-v5',
            languages: ['eng', 'spa', 'fra'],
            oem: 3,
            psm: 6,
            confidence: 60,
            parallelWorkers: 8,
            enableGPU: true,
            preserveLayout: true
          }
        }
      },
      {
        id: 'text-validation',
        type: 'workflowNode',
        position: { x: 800, y: 250 },
        data: {
          label: 'Text Validation',
          type: 'validate',
          status: 'idle',
          config: {
            spellCheck: true,
            grammarCheck: false,
            confidenceFilter: 0.8,
            removeGarbage: true,
            formatText: true
          }
        }
      },
      {
        id: 'export-text',
        type: 'workflowNode',
        position: { x: 1050, y: 250 },
        data: {
          label: 'Export Text',
          type: 'output',
          status: 'idle',
          config: {
            formats: ['txt', 'docx', 'pdf-searchable'],
            includeConfidence: true,
            preserveFormatting: true,
            createIndex: true
          }
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'input-ocr', target: 'preprocess-ocr', type: 'smoothstep' },
      { id: 'e2', source: 'input-ocr', target: 'quality-check', type: 'smoothstep' },
      { id: 'e3', source: 'preprocess-ocr', target: 'ocr-engine', type: 'smoothstep' },
      { id: 'e4', source: 'quality-check', target: 'ocr-engine', type: 'smoothstep' },
      { id: 'e5', source: 'ocr-engine', target: 'text-validation', type: 'smoothstep' },
      { id: 'e6', source: 'text-validation', target: 'export-text', type: 'smoothstep' }
    ]
  },

  // ENTERPRISE DOCUMENT MERGER
  {
    id: 'enterprise-merger',
    name: 'Enterprise Document Merger',
    description: 'Professional-grade document merging with bookmarks, TOC, and optimization',
    category: 'document-processing',
    difficulty: 'advanced',
    tier: 'enterprise',
    tags: ['merge', 'enterprise', 'bookmarks', 'toc'],
    estimatedTime: '3 minutes',
    useCase: 'Merge multiple documents into professional publications with navigation',
    businessValue: 'Create publication-ready documents with automated navigation',
    nodes: [
      {
        id: 'input-merge',
        type: 'workflowNode',
        position: { x: 100, y: 300 },
        data: {
          label: 'Upload Documents',
          type: 'input',
          status: 'idle',
          config: {
            acceptedTypes: ['pdf', 'docx'],
            maintainOrder: true,
            allowReordering: true,
            maxFiles: 100
          }
        }
      },
      {
        id: 'analyze-structure',
        type: 'workflowNode',
        position: { x: 300, y: 200 },
        data: {
          label: 'Analyze Structure',
          type: 'analyze',
          status: 'idle',
          config: {
            extractTitles: true,
            detectHeadings: true,
            analyzeLayout: true,
            extractMetadata: true,
            parallel: true
          }
        }
      },
      {
        id: 'normalize-format',
        type: 'workflowNode',
        position: { x: 300, y: 400 },
        data: {
          label: 'Normalize Format',
          type: 'normalize',
          status: 'idle',
          config: {
            standardizePageSize: 'A4',
            unifyMargins: true,
            normalizeOrientation: true,
            optimizeImages: true
          }
        }
      },
      {
        id: 'create-toc',
        type: 'workflowNode',
        position: { x: 550, y: 200 },
        data: {
          label: 'Generate TOC',
          type: 'generate-toc',
          status: 'idle',
          config: {
            autoDetectHeadings: true,
            includePageNumbers: true,
            maxDepth: 3,
            tocStyle: 'professional',
            linkToSections: true
          }
        }
      },
      {
        id: 'add-bookmarks',
        type: 'workflowNode',
        position: { x: 550, y: 300 },
        data: {
          label: 'Add Bookmarks',
          type: 'add-bookmarks',
          status: 'idle',
          config: {
            autoBookmarks: true,
            bookmarkDepth: 3,
            includePageBookmarks: false,
            customBookmarks: []
          }
        }
      },
      {
        id: 'merge-documents',
        type: 'workflowNode',
        position: { x: 800, y: 300 },
        data: {
          label: 'Merge Documents',
          type: 'merge',
          status: 'idle',
          config: {
            preserveBookmarks: true,
            includeTOC: true,
            addPageNumbers: true,
            pageNumberStyle: 'bottom-center',
            optimizeSize: true
          }
        }
      },
      {
        id: 'final-optimization',
        type: 'workflowNode',
        position: { x: 1050, y: 300 },
        data: {
          label: 'Final Optimization',
          type: 'optimize',
          status: 'idle',
          config: {
            compressImages: true,
            removeUnusedObjects: true,
            optimizeForPrint: true,
            validatePDF: true,
            addMetadata: true
          }
        }
      },
      {
        id: 'output-merge',
        type: 'workflowNode',
        position: { x: 1300, y: 300 },
        data: {
          label: 'Download Result',
          type: 'output',
          status: 'idle',
          config: {
            filename: 'merged-document.pdf',
            includeReport: true,
            enablePreview: true,
            qualityReport: true
          }
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'input-merge', target: 'analyze-structure', type: 'smoothstep' },
      { id: 'e2', source: 'input-merge', target: 'normalize-format', type: 'smoothstep' },
      { id: 'e3', source: 'analyze-structure', target: 'create-toc', type: 'smoothstep' },
      { id: 'e4', source: 'analyze-structure', target: 'add-bookmarks', type: 'smoothstep' },
      { id: 'e5', source: 'normalize-format', target: 'merge-documents', type: 'smoothstep' },
      { id: 'e6', source: 'create-toc', target: 'merge-documents', type: 'smoothstep' },
      { id: 'e7', source: 'add-bookmarks', target: 'merge-documents', type: 'smoothstep' },
      { id: 'e8', source: 'merge-documents', target: 'final-optimization', type: 'smoothstep' },
      { id: 'e9', source: 'final-optimization', target: 'output-merge', type: 'smoothstep' }
    ]
  },

  // COMPLIANCE DOCUMENT PROCESSOR
  {
    id: 'compliance-processor',
    name: 'Compliance Document Processor',
    description: 'GDPR/HIPAA compliant document processing with audit trails and encryption',
    category: 'compliance',
    difficulty: 'advanced',
    tier: 'enterprise',
    tags: ['compliance', 'gdpr', 'hipaa', 'audit', 'security'],
    estimatedTime: '4 minutes',
    useCase: 'Process sensitive documents with full compliance and audit trails',
    businessValue: 'Ensure regulatory compliance and avoid penalties up to $20M',
    industryFocus: ['healthcare', 'finance', 'legal', 'government'],
    nodes: [
      {
        id: 'secure-input',
        type: 'workflowNode',
        position: { x: 100, y: 300 },
        data: {
          label: 'Secure Upload',
          type: 'secure-input',
          status: 'idle',
          config: {
            encryption: 'AES-256',
            auditLog: true,
            accessControl: true,
            virusScan: true,
            validateIntegrity: true
          }
        }
      },
      {
        id: 'classify-sensitivity',
        type: 'workflowNode',
        position: { x: 350, y: 200 },
        data: {
          label: 'Classify Sensitivity',
          type: 'ai-classify',
          status: 'idle',
          config: {
            model: 'sensitivity-classifier',
            categories: ['public', 'internal', 'confidential', 'restricted'],
            detectPII: true,
            detectPHI: true,
            auditClassification: true
          }
        }
      },
      {
        id: 'pii-detection',
        type: 'workflowNode',
        position: { x: 350, y: 400 },
        data: {
          label: 'PII/PHI Detection',
          type: 'detect-pii',
          status: 'idle',
          config: {
            detectSSN: true,
            detectCreditCard: true,
            detectHealthInfo: true,
            detectBiometric: true,
            confidence: 0.95,
            logDetections: true
          }
        }
      },
      {
        id: 'redaction-engine',
        type: 'workflowNode',
        position: { x: 600, y: 300 },
        data: {
          label: 'Smart Redaction',
          type: 'redact',
          status: 'idle',
          config: {
            redactionMethod: 'black-box',
            preserveLayout: true,
            auditRedactions: true,
            customRules: [],
            reversible: false
          }
        }
      },
      {
        id: 'compliance-check',
        type: 'workflowNode',
        position: { x: 850, y: 200 },
        data: {
          label: 'Compliance Check',
          type: 'compliance-check',
          status: 'idle',
          config: {
            regulations: ['GDPR', 'HIPAA', 'CCPA'],
            generateReport: true,
            validateCompliance: true,
            auditTrail: true
          }
        }
      },
      {
        id: 'secure-storage',
        type: 'workflowNode',
        position: { x: 850, y: 400 },
        data: {
          label: 'Secure Storage',
          type: 'secure-store',
          status: 'idle',
          config: {
            encryption: 'AES-256',
            accessLogging: true,
            retentionPolicy: 'auto',
            backupEncrypted: true
          }
        }
      },
      {
        id: 'audit-report',
        type: 'workflowNode',
        position: { x: 1100, y: 300 },
        data: {
          label: 'Generate Audit Report',
          type: 'generate-report',
          status: 'idle',
          config: {
            includeTimestamps: true,
            includeUserActions: true,
            includeDataFlow: true,
            signReport: true,
            exportFormat: 'pdf'
          }
        }
      },
      {
        id: 'secure-output',
        type: 'workflowNode',
        position: { x: 1350, y: 300 },
        data: {
          label: 'Secure Download',
          type: 'secure-output',
          status: 'idle',
          config: {
            encryption: 'AES-256',
            accessControl: true,
            downloadLogging: true,
            expirationTime: '24h'
          }
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'secure-input', target: 'classify-sensitivity', type: 'smoothstep' },
      { id: 'e2', source: 'secure-input', target: 'pii-detection', type: 'smoothstep' },
      { id: 'e3', source: 'classify-sensitivity', target: 'redaction-engine', type: 'smoothstep' },
      { id: 'e4', source: 'pii-detection', target: 'redaction-engine', type: 'smoothstep' },
      { id: 'e5', source: 'redaction-engine', target: 'compliance-check', type: 'smoothstep' },
      { id: 'e6', source: 'redaction-engine', target: 'secure-storage', type: 'smoothstep' },
      { id: 'e7', source: 'compliance-check', target: 'audit-report', type: 'smoothstep' },
      { id: 'e8', source: 'secure-storage', target: 'audit-report', type: 'smoothstep' },
      { id: 'e9', source: 'audit-report', target: 'secure-output', type: 'smoothstep' }
    ]
  }
]

// Template performance configurations
export const templatePerformanceConfigs = {
  'lightning-pdf-split': {
    parallelNodes: ['analyze-fast', 'split-fast', 'optimize-fast'],
    cacheableNodes: ['analyze-fast', 'split-fast'],
    criticalPath: ['input-fast', 'analyze-fast', 'split-fast', 'optimize-fast', 'output-fast'],
    estimatedSpeedup: 0.7,
    resourceRequirements: { cpu: 'medium', memory: 'medium', disk: 'high' }
  },
  'smart-document-processor': {
    parallelNodes: ['route-invoices', 'route-contracts', 'route-forms'],
    cacheableNodes: ['classify-smart', 'extract-data'],
    criticalPath: ['input-smart', 'classify-smart', 'extract-data', 'organize-smart', 'output-smart'],
    estimatedSpeedup: 0.6,
    resourceRequirements: { cpu: 'high', memory: 'high', disk: 'medium' }
  },
  'batch-ocr-powerhouse': {
    parallelNodes: ['preprocess-ocr', 'quality-check', 'ocr-engine'],
    cacheableNodes: ['preprocess-ocr', 'ocr-engine'],
    criticalPath: ['input-ocr', 'preprocess-ocr', 'ocr-engine', 'text-validation', 'export-text'],
    estimatedSpeedup: 0.8,
    resourceRequirements: { cpu: 'very-high', memory: 'high', disk: 'medium' }
  },
  'enterprise-merger': {
    parallelNodes: ['analyze-structure', 'normalize-format', 'create-toc', 'add-bookmarks'],
    cacheableNodes: ['analyze-structure', 'normalize-format'],
    criticalPath: ['input-merge', 'merge-documents', 'final-optimization', 'output-merge'],
    estimatedSpeedup: 0.5,
    resourceRequirements: { cpu: 'medium', memory: 'high', disk: 'high' }
  },
  'compliance-processor': {
    parallelNodes: ['classify-sensitivity', 'pii-detection', 'compliance-check', 'secure-storage'],
    cacheableNodes: ['classify-sensitivity', 'pii-detection'],
    criticalPath: ['secure-input', 'redaction-engine', 'audit-report', 'secure-output'],
    estimatedSpeedup: 0.4,
    resourceRequirements: { cpu: 'high', memory: 'medium', disk: 'medium' }
  }
}

// Template validation rules
export const templateValidationRules = {
  requiredNodes: ['input', 'output'],
  maxNodes: 20,
  maxEdges: 50,
  allowedNodeTypes: [
    'input', 'output', 'split', 'merge', 'extract', 'ocr', 'ai-classify', 
    'ai-extract', 'condition', 'analyze', 'optimize', 'preprocess', 
    'validate', 'organize', 'generate-toc', 'add-bookmarks', 'redact',
    'detect-pii', 'compliance-check', 'secure-input', 'secure-output',
    'secure-store', 'generate-report', 'normalize'
  ],
  performanceThresholds: {
    maxExecutionTime: 600000, // 10 minutes
    maxMemoryUsage: 2048, // 2GB
    minCacheHitRate: 0.3,
    minParallelEfficiency: 0.4
  }
}
