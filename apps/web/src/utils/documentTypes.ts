export interface DocumentType {
  extension: string
  mimeType: string
  category: 'document' | 'spreadsheet' | 'presentation' | 'image' | 'archive'
  name: string
  icon: string
  color: string
  supportedOperations: DocumentOperation[]
}

export type DocumentOperation = 
  | 'split' 
  | 'merge' 
  | 'extract' 
  | 'convert' 
  | 'compress' 
  | 'watermark' 
  | 'rotate' 
  | 'crop'
  | 'ocr'
  | 'redact'

export const supportedDocumentTypes: DocumentType[] = [
  // PDF Documents
  {
    extension: 'pdf',
    mimeType: 'application/pdf',
    category: 'document',
    name: 'PDF Document',
    icon: '📄',
    color: '#dc2626',
    supportedOperations: ['split', 'merge', 'extract', 'convert', 'compress', 'watermark', 'rotate', 'redact']
  },
  
  // Microsoft Office Documents
  {
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    category: 'document',
    name: 'Word Document',
    icon: '📝',
    color: '#2563eb',
    supportedOperations: ['convert', 'merge', 'extract', 'watermark']
  },
  {
    extension: 'doc',
    mimeType: 'application/msword',
    category: 'document',
    name: 'Word Document (Legacy)',
    icon: '📝',
    color: '#2563eb',
    supportedOperations: ['convert', 'extract']
  },
  {
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'spreadsheet',
    name: 'Excel Spreadsheet',
    icon: '📊',
    color: '#16a34a',
    supportedOperations: ['convert', 'split', 'merge', 'extract']
  },
  {
    extension: 'xls',
    mimeType: 'application/vnd.ms-excel',
    category: 'spreadsheet',
    name: 'Excel Spreadsheet (Legacy)',
    icon: '📊',
    color: '#16a34a',
    supportedOperations: ['convert', 'extract']
  },
  {
    extension: 'pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    category: 'presentation',
    name: 'PowerPoint Presentation',
    icon: '📊',
    color: '#dc2626',
    supportedOperations: ['convert', 'split', 'extract', 'compress']
  },
  {
    extension: 'ppt',
    mimeType: 'application/vnd.ms-powerpoint',
    category: 'presentation',
    name: 'PowerPoint Presentation (Legacy)',
    icon: '📊',
    color: '#dc2626',
    supportedOperations: ['convert', 'extract']
  },

  // Google Workspace / OpenOffice
  {
    extension: 'odt',
    mimeType: 'application/vnd.oasis.opendocument.text',
    category: 'document',
    name: 'OpenDocument Text',
    icon: '📄',
    color: '#0891b2',
    supportedOperations: ['convert', 'merge', 'extract']
  },
  {
    extension: 'ods',
    mimeType: 'application/vnd.oasis.opendocument.spreadsheet',
    category: 'spreadsheet',
    name: 'OpenDocument Spreadsheet',
    icon: '📊',
    color: '#0891b2',
    supportedOperations: ['convert', 'extract']
  },
  {
    extension: 'odp',
    mimeType: 'application/vnd.oasis.opendocument.presentation',
    category: 'presentation',
    name: 'OpenDocument Presentation',
    icon: '📊',
    color: '#0891b2',
    supportedOperations: ['convert', 'extract']
  },

  // Text Documents
  {
    extension: 'txt',
    mimeType: 'text/plain',
    category: 'document',
    name: 'Text Document',
    icon: '📄',
    color: '#6b7280',
    supportedOperations: ['convert', 'merge', 'split']
  },
  {
    extension: 'rtf',
    mimeType: 'application/rtf',
    category: 'document',
    name: 'Rich Text Format',
    icon: '📄',
    color: '#7c3aed',
    supportedOperations: ['convert', 'extract']
  },

  // Image Documents
  {
    extension: 'jpg',
    mimeType: 'image/jpeg',
    category: 'image',
    name: 'JPEG Image',
    icon: '🖼️',
    color: '#f59e0b',
    supportedOperations: ['convert', 'compress', 'rotate', 'crop', 'ocr']
  },
  {
    extension: 'jpeg',
    mimeType: 'image/jpeg',
    category: 'image',
    name: 'JPEG Image',
    icon: '🖼️',
    color: '#f59e0b',
    supportedOperations: ['convert', 'compress', 'rotate', 'crop', 'ocr']
  },
  {
    extension: 'png',
    mimeType: 'image/png',
    category: 'image',
    name: 'PNG Image',
    icon: '🖼️',
    color: '#8b5cf6',
    supportedOperations: ['convert', 'compress', 'rotate', 'crop', 'ocr']
  },
  {
    extension: 'tiff',
    mimeType: 'image/tiff',
    category: 'image',
    name: 'TIFF Image',
    icon: '🖼️',
    color: '#06b6d4',
    supportedOperations: ['convert', 'compress', 'ocr', 'split']
  },
  {
    extension: 'bmp',
    mimeType: 'image/bmp',
    category: 'image',
    name: 'Bitmap Image',
    icon: '🖼️',
    color: '#84cc16',
    supportedOperations: ['convert', 'compress', 'rotate', 'crop']
  },

  // Archive Documents
  {
    extension: 'zip',
    mimeType: 'application/zip',
    category: 'archive',
    name: 'ZIP Archive',
    icon: '📦',
    color: '#f97316',
    supportedOperations: ['extract', 'compress']
  },
  {
    extension: 'rar',
    mimeType: 'application/vnd.rar',
    category: 'archive',
    name: 'RAR Archive',
    icon: '📦',
    color: '#f97316',
    supportedOperations: ['extract']
  }
]

export const getDocumentType = (filename: string): DocumentType | null => {
  const extension = filename.split('.').pop()?.toLowerCase()
  if (!extension) return null
  
  return supportedDocumentTypes.find(type => type.extension === extension) || null
}

export const getAcceptedFileTypes = (): string => {
  return supportedDocumentTypes.map(type => `.${type.extension}`).join(',')
}

export const getMimeTypes = (): string[] => {
  return supportedDocumentTypes.map(type => type.mimeType)
}

export const getDocumentsByCategory = (category: DocumentType['category']): DocumentType[] => {
  return supportedDocumentTypes.filter(type => type.category === category)
}

export const isDocumentSupported = (filename: string): boolean => {
  return getDocumentType(filename) !== null
}

export const getOperationsForDocument = (filename: string): DocumentOperation[] => {
  const docType = getDocumentType(filename)
  return docType?.supportedOperations || []
}

export const canPerformOperation = (filename: string, operation: DocumentOperation): boolean => {
  const operations = getOperationsForDocument(filename)
  return operations.includes(operation)
}

// Document conversion matrix
export const conversionMatrix: Record<string, string[]> = {
  // PDF conversions
  'pdf': ['docx', 'txt', 'jpg', 'png', 'html'],
  
  // Office document conversions
  'docx': ['pdf', 'txt', 'html', 'odt'],
  'doc': ['pdf', 'docx', 'txt'],
  'xlsx': ['pdf', 'csv', 'ods'],
  'xls': ['pdf', 'xlsx', 'csv'],
  'pptx': ['pdf', 'jpg', 'png', 'odp'],
  'ppt': ['pdf', 'pptx', 'jpg'],
  
  // OpenDocument conversions
  'odt': ['pdf', 'docx', 'txt', 'html'],
  'ods': ['pdf', 'xlsx', 'csv'],
  'odp': ['pdf', 'pptx', 'jpg'],
  
  // Text conversions
  'txt': ['pdf', 'docx', 'html'],
  'rtf': ['pdf', 'docx', 'txt'],
  
  // Image conversions
  'jpg': ['pdf', 'png', 'bmp', 'tiff'],
  'jpeg': ['pdf', 'png', 'bmp', 'tiff'],
  'png': ['pdf', 'jpg', 'bmp', 'tiff'],
  'tiff': ['pdf', 'jpg', 'png', 'bmp'],
  'bmp': ['pdf', 'jpg', 'png', 'tiff']
}

export const getConversionOptions = (fromExtension: string): string[] => {
  return conversionMatrix[fromExtension.toLowerCase()] || []
}
