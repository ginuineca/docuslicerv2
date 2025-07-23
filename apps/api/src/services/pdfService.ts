import { PDFDocument, PDFPage, rgb, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'

export interface SplitRange {
  start: number
  end: number
  name: string
}

export interface SplitOptions {
  ranges: SplitRange[]
  outputDir: string
}

export interface MergeOptions {
  outputName: string
  preserveBookmarks?: boolean
  addPageNumbers?: boolean
  outputDir: string
}

export class PDFService {
  /**
   * Split a PDF into multiple files based on page ranges
   */
  async splitPDF(inputPath: string, options: SplitOptions): Promise<string[]> {
    try {
      // Read the input PDF
      const inputBuffer = await fs.readFile(inputPath)
      const pdfDoc = await PDFDocument.load(inputBuffer)
      const totalPages = pdfDoc.getPageCount()

      const outputFiles: string[] = []

      // Validate ranges
      for (const range of options.ranges) {
        if (range.start < 1 || range.end > totalPages || range.start > range.end) {
          throw new Error(`Invalid range: ${range.start}-${range.end}. PDF has ${totalPages} pages.`)
        }
      }

      // Create output directory if it doesn't exist
      await fs.mkdir(options.outputDir, { recursive: true })

      // Process each range
      for (const range of options.ranges) {
        const newPdf = await PDFDocument.create()
        
        // Copy pages for this range
        const pagesToCopy = []
        for (let i = range.start - 1; i < range.end; i++) {
          pagesToCopy.push(i)
        }

        const copiedPages = await newPdf.copyPages(pdfDoc, pagesToCopy)
        copiedPages.forEach(page => newPdf.addPage(page))

        // Save the split PDF
        const outputPath = path.join(options.outputDir, `${range.name}.pdf`)
        const pdfBytes = await newPdf.save()
        await fs.writeFile(outputPath, pdfBytes)
        
        outputFiles.push(outputPath)
      }

      return outputFiles
    } catch (error) {
      console.error('Error splitting PDF:', error)
      throw new Error(`Failed to split PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Merge multiple PDFs into a single file
   */
  async mergePDFs(inputPaths: string[], options: MergeOptions): Promise<string> {
    try {
      const mergedPdf = await PDFDocument.create()
      let totalPages = 0

      // Create output directory if it doesn't exist
      await fs.mkdir(options.outputDir, { recursive: true })

      // Process each input file
      for (const inputPath of inputPaths) {
        const inputBuffer = await fs.readFile(inputPath)
        const pdfDoc = await PDFDocument.load(inputBuffer)
        const pageCount = pdfDoc.getPageCount()

        // Copy all pages from this PDF
        const pagesToCopy = Array.from({ length: pageCount }, (_, i) => i)
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pagesToCopy)

        // Add pages to merged PDF
        copiedPages.forEach((page, index) => {
          mergedPdf.addPage(page)
          
          // Add page numbers if requested
          if (options.addPageNumbers) {
            const pageNumber = totalPages + index + 1
            this.addPageNumber(page, pageNumber)
          }
        })

        totalPages += pageCount
      }

      // Save the merged PDF
      const outputPath = path.join(options.outputDir, `${options.outputName}.pdf`)
      const pdfBytes = await mergedPdf.save()
      await fs.writeFile(outputPath, pdfBytes)

      return outputPath
    } catch (error) {
      console.error('Error merging PDFs:', error)
      throw new Error(`Failed to merge PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract specific pages from a PDF
   */
  async extractPages(inputPath: string, pageNumbers: number[], outputPath: string): Promise<string> {
    try {
      const inputBuffer = await fs.readFile(inputPath)
      const pdfDoc = await PDFDocument.load(inputBuffer)
      const totalPages = pdfDoc.getPageCount()

      // Validate page numbers
      for (const pageNum of pageNumbers) {
        if (pageNum < 1 || pageNum > totalPages) {
          throw new Error(`Invalid page number: ${pageNum}. PDF has ${totalPages} pages.`)
        }
      }

      const newPdf = await PDFDocument.create()
      
      // Convert to 0-based indices and copy pages
      const pageIndices = pageNumbers.map(num => num - 1)
      const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices)
      copiedPages.forEach(page => newPdf.addPage(page))

      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath)
      await fs.mkdir(outputDir, { recursive: true })

      // Save the extracted PDF
      const pdfBytes = await newPdf.save()
      await fs.writeFile(outputPath, pdfBytes)

      return outputPath
    } catch (error) {
      console.error('Error extracting pages:', error)
      throw new Error(`Failed to extract pages: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get PDF metadata and page count
   */
  async getPDFInfo(inputPath: string): Promise<{
    pageCount: number
    title?: string
    author?: string
    subject?: string
    creator?: string
    producer?: string
    creationDate?: Date
    modificationDate?: Date
  }> {
    try {
      const inputBuffer = await fs.readFile(inputPath)
      const pdfDoc = await PDFDocument.load(inputBuffer)

      const pageCount = pdfDoc.getPageCount()
      const title = pdfDoc.getTitle()
      const author = pdfDoc.getAuthor()
      const subject = pdfDoc.getSubject()
      const creator = pdfDoc.getCreator()
      const producer = pdfDoc.getProducer()
      const creationDate = pdfDoc.getCreationDate()
      const modificationDate = pdfDoc.getModificationDate()

      return {
        pageCount,
        title: title || undefined,
        author: author || undefined,
        subject: subject || undefined,
        creator: creator || undefined,
        producer: producer || undefined,
        creationDate: creationDate || undefined,
        modificationDate: modificationDate || undefined
      }
    } catch (error) {
      console.error('Error getting PDF info:', error)
      throw new Error(`Failed to get PDF info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate if a file is a valid PDF
   */
  async validatePDF(inputPath: string): Promise<boolean> {
    try {
      const inputBuffer = await fs.readFile(inputPath)
      await PDFDocument.load(inputBuffer)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Add page number to a PDF page
   */
  private addPageNumber(page: PDFPage, pageNumber: number): void {
    const { width, height } = page.getSize()
    
    page.drawText(`${pageNumber}`, {
      x: width - 50,
      y: 20,
      size: 10,
      color: rgb(0.5, 0.5, 0.5)
    })
  }

  /**
   * Detect and extract form fields from a PDF
   */
  async detectFormFields(inputPath: string): Promise<{
    hasForm: boolean
    fields: Array<{
      name: string
      type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'button'
      value?: string
      options?: string[]
      required?: boolean
      readOnly?: boolean
    }>
  }> {
    try {
      const inputBuffer = await fs.readFile(inputPath)
      const pdfDoc = await PDFDocument.load(inputBuffer)
      const form = pdfDoc.getForm()

      if (!form) {
        return { hasForm: false, fields: [] }
      }

      const fields = form.getFields()
      const formFields = fields.map(field => {
        const fieldName = field.getName()
        let fieldType: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'button' = 'text'
        let value: string | undefined
        let options: string[] | undefined

        if (field instanceof PDFTextField) {
          fieldType = 'text'
          value = field.getText() || undefined
        } else if (field instanceof PDFCheckBox) {
          fieldType = 'checkbox'
          value = field.isChecked() ? 'true' : 'false'
        } else if (field instanceof PDFRadioGroup) {
          fieldType = 'radio'
          value = field.getSelected() || undefined
          options = field.getOptions()
        } else if (field instanceof PDFDropdown) {
          fieldType = 'dropdown'
          value = field.getSelected()?.[0] || undefined
          options = field.getOptions()
        }

        return {
          name: fieldName,
          type: fieldType,
          value,
          options,
          required: false, // pdf-lib doesn't expose required flag easily
          readOnly: field.isReadOnly()
        }
      })

      return {
        hasForm: fields.length > 0,
        fields: formFields
      }
    } catch (error) {
      console.error('Error detecting form fields:', error)
      throw new Error(`Failed to detect form fields: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Fill form fields in a PDF
   */
  async fillFormFields(
    inputPath: string,
    fieldData: Record<string, string | boolean>,
    outputPath: string,
    flatten: boolean = false
  ): Promise<string> {
    try {
      const inputBuffer = await fs.readFile(inputPath)
      const pdfDoc = await PDFDocument.load(inputBuffer)
      const form = pdfDoc.getForm()

      if (!form) {
        throw new Error('PDF does not contain a form')
      }

      // Fill each field
      for (const [fieldName, fieldValue] of Object.entries(fieldData)) {
        try {
          const field = form.getField(fieldName)

          if (field instanceof PDFTextField) {
            field.setText(String(fieldValue))
          } else if (field instanceof PDFCheckBox) {
            if (typeof fieldValue === 'boolean') {
              if (fieldValue) {
                field.check()
              } else {
                field.uncheck()
              }
            } else {
              // Handle string values for checkboxes
              const boolValue = fieldValue === 'true' || fieldValue === '1' || fieldValue === 'yes'
              if (boolValue) {
                field.check()
              } else {
                field.uncheck()
              }
            }
          } else if (field instanceof PDFRadioGroup) {
            field.select(String(fieldValue))
          } else if (field instanceof PDFDropdown) {
            field.select(String(fieldValue))
          }
        } catch (fieldError) {
          console.warn(`Failed to fill field ${fieldName}:`, fieldError)
          // Continue with other fields
        }
      }

      // Flatten the form if requested (makes fields non-editable)
      if (flatten) {
        form.flatten()
      }

      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath)
      await fs.mkdir(outputDir, { recursive: true })

      // Save the filled PDF
      const pdfBytes = await pdfDoc.save()
      await fs.writeFile(outputPath, pdfBytes)

      return outputPath
    } catch (error) {
      console.error('Error filling form fields:', error)
      throw new Error(`Failed to fill form fields: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract form data from a filled PDF
   */
  async extractFormData(inputPath: string): Promise<Record<string, string | boolean>> {
    try {
      const formInfo = await this.detectFormFields(inputPath)

      if (!formInfo.hasForm) {
        return {}
      }

      const formData: Record<string, string | boolean> = {}

      for (const field of formInfo.fields) {
        if (field.value !== undefined) {
          if (field.type === 'checkbox') {
            formData[field.name] = field.value === 'true'
          } else {
            formData[field.name] = field.value
          }
        }
      }

      return formData
    } catch (error) {
      console.error('Error extracting form data:', error)
      throw new Error(`Failed to extract form data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a new PDF form with specified fields
   */
  async createForm(
    fields: Array<{
      name: string
      type: 'text' | 'checkbox' | 'radio' | 'dropdown'
      x: number
      y: number
      width: number
      height: number
      options?: string[]
      defaultValue?: string
    }>,
    outputPath: string,
    pageSize: { width: number; height: number } = { width: 612, height: 792 } // Letter size
  ): Promise<string> {
    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([pageSize.width, pageSize.height])
      const form = pdfDoc.getForm()

      for (const fieldDef of fields) {
        switch (fieldDef.type) {
          case 'text':
            const textField = form.createTextField(fieldDef.name)
            textField.addToPage(page, {
              x: fieldDef.x,
              y: fieldDef.y,
              width: fieldDef.width,
              height: fieldDef.height
            })
            if (fieldDef.defaultValue) {
              textField.setText(fieldDef.defaultValue)
            }
            break

          case 'checkbox':
            const checkBox = form.createCheckBox(fieldDef.name)
            checkBox.addToPage(page, {
              x: fieldDef.x,
              y: fieldDef.y,
              width: fieldDef.width,
              height: fieldDef.height
            })
            break

          case 'radio':
            if (fieldDef.options && fieldDef.options.length > 0) {
              const radioGroup = form.createRadioGroup(fieldDef.name)
              fieldDef.options.forEach((option, index) => {
                radioGroup.addOptionToPage(option, page, {
                  x: fieldDef.x,
                  y: fieldDef.y - (index * (fieldDef.height + 5)),
                  width: fieldDef.width,
                  height: fieldDef.height
                })
              })
            }
            break

          case 'dropdown':
            if (fieldDef.options && fieldDef.options.length > 0) {
              const dropdown = form.createDropdown(fieldDef.name)
              dropdown.addOptions(fieldDef.options)
              dropdown.addToPage(page, {
                x: fieldDef.x,
                y: fieldDef.y,
                width: fieldDef.width,
                height: fieldDef.height
              })
              if (fieldDef.defaultValue) {
                dropdown.select(fieldDef.defaultValue)
              }
            }
            break
        }
      }

      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath)
      await fs.mkdir(outputDir, { recursive: true })

      // Save the form PDF
      const pdfBytes = await pdfDoc.save()
      await fs.writeFile(outputPath, pdfBytes)

      return outputPath
    } catch (error) {
      console.error('Error creating form:', error)
      throw new Error(`Failed to create form: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Compress PDF file to reduce size
   */
  async compressPDF(
    inputPath: string,
    outputPath: string,
    options: {
      quality?: 'low' | 'medium' | 'high'
      removeMetadata?: boolean
      optimizeImages?: boolean
      removeUnusedObjects?: boolean
    } = {}
  ): Promise<string> {
    try {
      const {
        quality = 'medium',
        removeMetadata = true,
        optimizeImages = true,
        removeUnusedObjects = true
      } = options

      // Read the input PDF
      const existingPdfBytes = await fs.readFile(inputPath)
      const pdfDoc = await PDFDocument.load(existingPdfBytes)

      // Remove metadata if requested
      if (removeMetadata) {
        pdfDoc.setTitle('')
        pdfDoc.setAuthor('')
        pdfDoc.setSubject('')
        pdfDoc.setKeywords([])
        pdfDoc.setProducer('')
        pdfDoc.setCreator('')
      }

      // Note: pdf-lib has limited compression capabilities
      // In a production environment, you might want to use a more specialized library
      // like pdf2pic + sharp for image optimization, or integrate with external services

      // Save the optimized PDF
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: removeUnusedObjects,
        addDefaultPage: false
      })

      await fs.writeFile(outputPath, pdfBytes)

      // Calculate compression ratio
      const originalSize = existingPdfBytes.length
      const compressedSize = pdfBytes.length
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)

      console.log(`PDF compressed: ${originalSize} bytes -> ${compressedSize} bytes (${compressionRatio}% reduction)`)

      return outputPath
    } catch (error) {
      console.error('Error compressing PDF:', error)
      throw new Error(`Failed to compress PDF: ${error.message}`)
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath)
      } catch (error) {
        console.warn(`Failed to delete file ${filePath}:`, error)
      }
    }
  }
}
