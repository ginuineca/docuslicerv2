import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileText, 
  CheckSquare, 
  Circle, 
  ChevronDown,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react'

interface FormField {
  name: string
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'button'
  value?: string
  options?: string[]
  required?: boolean
  readOnly?: boolean
}

interface FormDetectionResult {
  hasForm: boolean
  fields: FormField[]
  fieldCount: number
}

interface PDFFormProcessorProps {
  onFormFilled?: (result: any) => void
  className?: string
}

export function PDFFormProcessor({ onFormFilled, className = '' }: PDFFormProcessorProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isFilling, setIsFilling] = useState(false)
  const [formDetection, setFormDetection] = useState<FormDetectionResult | null>(null)
  const [formData, setFormData] = useState<Record<string, string | boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [filledResult, setFilledResult] = useState<any>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadedFile(file)
    setError(null)
    setFormDetection(null)
    setFormData({})
    setFilledResult(null)

    // Detect form fields
    setIsDetecting(true)
    try {
      // In a real app, this would upload the file and call the API
      // For now, we'll simulate form detection
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock form detection result
      const mockFormDetection: FormDetectionResult = {
        hasForm: true,
        fieldCount: 5,
        fields: [
          {
            name: 'firstName',
            type: 'text',
            value: '',
            required: true,
            readOnly: false
          },
          {
            name: 'lastName',
            type: 'text',
            value: '',
            required: true,
            readOnly: false
          },
          {
            name: 'email',
            type: 'text',
            value: '',
            required: true,
            readOnly: false
          },
          {
            name: 'subscribe',
            type: 'checkbox',
            value: 'false',
            required: false,
            readOnly: false
          },
          {
            name: 'country',
            type: 'dropdown',
            value: '',
            options: ['USA', 'Canada', 'UK', 'Australia', 'Other'],
            required: false,
            readOnly: false
          }
        ]
      }
      
      setFormDetection(mockFormDetection)
      
      // Initialize form data with default values
      const initialFormData: Record<string, string | boolean> = {}
      mockFormDetection.fields.forEach(field => {
        if (field.type === 'checkbox') {
          initialFormData[field.name] = field.value === 'true'
        } else {
          initialFormData[field.name] = field.value || ''
        }
      })
      setFormData(initialFormData)
      
    } catch (err) {
      setError('Failed to detect form fields')
    } finally {
      setIsDetecting(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  const handleFieldChange = (fieldName: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleFillForm = async () => {
    if (!uploadedFile || !formDetection) return

    setIsFilling(true)
    setError(null)

    try {
      // In a real app, this would call the API to fill the form
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockResult = {
        success: true,
        message: 'Form filled successfully',
        file: {
          name: 'filled_form.pdf',
          size: 125000,
          pages: 2,
          downloadUrl: '/api/pdf/download/filled_form.pdf'
        },
        fieldsProcessed: Object.keys(formData).length,
        flattened: false
      }
      
      setFilledResult(mockResult)
      
      if (onFormFilled) {
        onFormFilled(mockResult)
      }
    } catch (err) {
      setError('Failed to fill form')
    } finally {
      setIsFilling(false)
    }
  }

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text': return FileText
      case 'checkbox': return CheckSquare
      case 'radio': return Circle
      case 'dropdown': return ChevronDown
      default: return FileText
    }
  }

  const renderFormField = (field: FormField) => {
    const Icon = getFieldIcon(field.type)
    
    return (
      <div key={field.name} className="space-y-2">
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <Icon className="h-4 w-4" />
          <span>{field.name}</span>
          {field.required && <span className="text-red-500">*</span>}
          {field.readOnly && <span className="text-gray-400">(read-only)</span>}
        </label>
        
        {field.type === 'text' && (
          <input
            type="text"
            value={formData[field.name] as string || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={field.readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder={`Enter ${field.name}`}
          />
        )}
        
        {field.type === 'checkbox' && (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData[field.name] as boolean || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              disabled={field.readOnly}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100"
            />
            <span className="text-sm text-gray-600">Check this option</span>
          </label>
        )}
        
        {field.type === 'dropdown' && field.options && (
          <select
            value={formData[field.name] as string || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            disabled={field.readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Select {field.name}</option>
            {field.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )}
        
        {field.type === 'radio' && field.options && (
          <div className="space-y-2">
            {field.options.map(option => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={formData[field.name] === option}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  disabled={field.readOnly}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:bg-gray-100"
                />
                <span className="text-sm text-gray-600">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">PDF Form Processor</h2>
        
        {/* File Upload */}
        {!uploadedFile && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop the PDF here' : 'Upload PDF with Form'}
            </p>
            <p className="text-gray-600">
              Drag and drop a PDF file with form fields, or click to browse
            </p>
          </div>
        )}

        {/* File Info */}
        {uploadedFile && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="font-medium text-gray-900">{uploadedFile.name}</h3>
                <p className="text-sm text-gray-600">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {isDetecting && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Detecting form fields...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Form Detection Results */}
        {formDetection && !formDetection.hasForm && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-700">
                This PDF does not contain any form fields
              </span>
            </div>
          </div>
        )}

        {/* Form Fields */}
        {formDetection && formDetection.hasForm && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Form Fields ({formDetection.fieldCount})
              </h3>
              <button
                onClick={handleFillForm}
                disabled={isFilling}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isFilling ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Filling Form...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Fill Form</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formDetection.fields.map(renderFormField)}
            </div>
          </div>
        )}

        {/* Success Result */}
        {filledResult && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900">Form Filled Successfully!</h4>
                <p className="text-green-700 text-sm mt-1">
                  Processed {filledResult.fieldsProcessed} fields
                </p>
                <div className="flex items-center space-x-4 mt-3">
                  <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </button>
                  <button className="flex items-center space-x-2 text-green-600 hover:text-green-800">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
