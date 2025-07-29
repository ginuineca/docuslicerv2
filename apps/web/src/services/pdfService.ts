import { apiClient } from './apiClient'

export interface SplitRange {
  start: number
  end: number
  name: string
}

export interface MergeOptions {
  outputName: string
  preserveBookmarks?: boolean
  addPageNumbers?: boolean
}

export interface ProcessingResult {
  id: string
  name: string
  status: 'processing' | 'completed' | 'error'
  progress: number
  downloadUrl?: string
  error?: string
  pages?: number
  size?: number
}

export interface PDFInfo {
  pages: number
  size: number
  title?: string
  author?: string
  creationDate?: string
}

export class PDFService {
  /**
   * Upload and analyze a PDF file
   */
  async uploadPDF(file: File): Promise<{ fileId: string; info: PDFInfo }> {
    const formData = new FormData()
    formData.append('pdf', file)

    const response = await apiClient.post('/api/pdf/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  }

  /**
   * Split a PDF into multiple files
   */
  async splitPDF(fileId: string, ranges: SplitRange[]): Promise<ProcessingResult[]> {
    const response = await apiClient.post('/api/pdf/split', {
      fileId,
      ranges,
    })

    return response.data.results
  }

  /**
   * Merge multiple PDFs into one
   */
  async mergePDFs(fileIds: string[], options: MergeOptions): Promise<ProcessingResult> {
    const response = await apiClient.post('/api/pdf/merge', {
      fileIds,
      ...options,
    })

    return response.data.result
  }

  /**
   * Extract pages from a PDF
   */
  async extractPages(fileId: string, pages: number[], outputName?: string): Promise<ProcessingResult> {
    const response = await apiClient.post('/api/pdf/extract', {
      fileId,
      pages,
      outputName,
    })

    return response.data.result
  }

  /**
   * Convert PDF to other formats
   */
  async convertPDF(fileId: string, format: 'docx' | 'xlsx' | 'pptx' | 'html' | 'txt' | 'jpg' | 'png'): Promise<ProcessingResult> {
    const response = await apiClient.post('/api/pdf/convert', {
      fileId,
      format,
    })

    return response.data.result
  }

  /**
   * Perform OCR on a PDF
   */
  async performOCR(fileId: string, language?: string): Promise<ProcessingResult> {
    const response = await apiClient.post('/api/pdf/ocr', {
      fileId,
      language: language || 'eng',
    })

    return response.data.result
  }

  /**
   * Add watermark to PDF
   */
  async addWatermark(fileId: string, watermarkText: string, options?: {
    opacity?: number
    fontSize?: number
    rotation?: number
    position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  }): Promise<ProcessingResult> {
    const response = await apiClient.post('/api/pdf/watermark', {
      fileId,
      watermarkText,
      ...options,
    })

    return response.data.result
  }

  /**
   * Encrypt PDF with password
   */
  async encryptPDF(fileId: string, password: string): Promise<ProcessingResult> {
    const response = await apiClient.post('/api/pdf/encrypt', {
      fileId,
      password,
    })

    return response.data.result
  }

  /**
   * Remove password from PDF
   */
  async decryptPDF(fileId: string, password: string): Promise<ProcessingResult> {
    const response = await apiClient.post('/api/pdf/decrypt', {
      fileId,
      password,
    })

    return response.data.result
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(resultId: string): Promise<ProcessingResult> {
    const response = await apiClient.get(`/api/pdf/status/${resultId}`)
    return response.data.result
  }

  /**
   * Download processed file
   */
  async downloadFile(resultId: string): Promise<Blob> {
    const response = await apiClient.get(`/api/pdf/download/${resultId}`, {
      responseType: 'blob',
    })

    return response.data
  }

  /**
   * Get PDF preview/thumbnail
   */
  async getPDFPreview(fileId: string, page: number = 1): Promise<string> {
    const response = await apiClient.get(`/api/pdf/preview/${fileId}/${page}`, {
      responseType: 'blob',
    })

    return URL.createObjectURL(response.data)
  }

  /**
   * Batch process multiple files
   */
  async batchProcess(operations: Array<{
    fileId: string
    operation: 'split' | 'merge' | 'convert' | 'ocr' | 'watermark' | 'encrypt'
    options: any
  }>): Promise<ProcessingResult[]> {
    const response = await apiClient.post('/api/pdf/batch', {
      operations,
    })

    return response.data.results
  }

  /**
   * Get file information
   */
  async getFileInfo(fileId: string): Promise<PDFInfo> {
    const response = await apiClient.get(`/api/pdf/info/${fileId}`)
    return response.data.info
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(fileId: string): Promise<void> {
    await apiClient.delete(`/api/pdf/file/${fileId}`)
  }
}

export const pdfService = new PDFService()
