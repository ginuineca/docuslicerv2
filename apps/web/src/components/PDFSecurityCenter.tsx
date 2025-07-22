import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileText, 
  Shield, 
  Lock,
  Key,
  Eye,
  EyeOff,
  Signature,
  Droplets,
  CheckCircle,
  AlertTriangle,
  Download,
  Settings,
  Zap,
  FileCheck,
  AlertCircle
} from 'lucide-react'

interface SecurityOperation {
  id: string
  name: string
  description: string
  icon: any
  color: string
  category: 'protection' | 'verification' | 'modification'
}

interface SecurityResult {
  success: boolean
  message: string
  file?: {
    name: string
    size: number
    path: string
  }
  details?: any
}

interface SecurityAudit {
  isPasswordProtected: boolean
  hasDigitalSignatures: boolean
  hasWatermarks: boolean
  isEncrypted: boolean
  permissions: {
    printing: boolean
    modifying: boolean
    copying: boolean
    annotating: boolean
  }
  securityLevel: 'none' | 'basic' | 'standard' | 'high' | 'maximum'
  vulnerabilities: string[]
  recommendations: string[]
}

interface PDFSecurityCenterProps {
  onSecurityComplete?: (result: SecurityResult) => void
  className?: string
}

export function PDFSecurityCenter({ onSecurityComplete, className = '' }: PDFSecurityCenterProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedOperation, setSelectedOperation] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<SecurityResult | null>(null)
  const [auditResult, setAuditResult] = useState<SecurityAudit | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  const securityOperations: SecurityOperation[] = [
    {
      id: 'password-protect',
      name: 'Password Protection',
      description: 'Add password protection with granular permissions',
      icon: Lock,
      color: 'blue',
      category: 'protection'
    },
    {
      id: 'watermark',
      name: 'Add Watermark',
      description: 'Add text watermarks to protect against copying',
      icon: Droplets,
      color: 'cyan',
      category: 'protection'
    },
    {
      id: 'digital-signature',
      name: 'Digital Signature',
      description: 'Add digital signatures for authenticity',
      icon: Signature,
      color: 'green',
      category: 'protection'
    },
    {
      id: 'encrypt',
      name: 'Advanced Encryption',
      description: 'Encrypt PDF with AES-256 encryption',
      icon: Shield,
      color: 'purple',
      category: 'protection'
    },
    {
      id: 'decrypt',
      name: 'Decrypt PDF',
      description: 'Decrypt password-protected or encrypted PDFs',
      icon: Key,
      color: 'orange',
      category: 'modification'
    },
    {
      id: 'remove-password',
      name: 'Remove Protection',
      description: 'Remove password protection from PDFs',
      icon: EyeOff,
      color: 'red',
      category: 'modification'
    },
    {
      id: 'audit',
      name: 'Security Audit',
      description: 'Analyze PDF security and get recommendations',
      icon: FileCheck,
      color: 'indigo',
      category: 'verification'
    },
    {
      id: 'verify-integrity',
      name: 'Verify Integrity',
      description: 'Check PDF integrity and detect corruption',
      icon: CheckCircle,
      color: 'emerald',
      category: 'verification'
    }
  ]

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadedFile(file)
    setResult(null)
    setAuditResult(null)
    setFormData({})
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  })

  const handleOperationSelect = (operationId: string) => {
    setSelectedOperation(operationId)
    setResult(null)
    setAuditResult(null)
    setFormData({})
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const executeSecurityOperation = async () => {
    if (!uploadedFile || !selectedOperation) return

    setIsProcessing(true)
    setResult(null)
    setAuditResult(null)

    try {
      const formDataObj = new FormData()
      formDataObj.append('pdf', uploadedFile)

      // Add operation-specific data
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'object') {
          formDataObj.append(key, JSON.stringify(value))
        } else {
          formDataObj.append(key, String(value))
        }
      })

      const response = await fetch(`/api/security/${selectedOperation}`, {
        method: 'POST',
        body: formDataObj
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        if (data.audit) {
          setAuditResult(data.audit)
        }
        if (onSecurityComplete) {
          onSecurityComplete(data)
        }
      } else {
        setResult({
          success: false,
          message: data.error || 'Operation failed'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const renderOperationForm = () => {
    const operation = securityOperations.find(op => op.id === selectedOperation)
    if (!operation) return null

    switch (selectedOperation) {
      case 'password-protect':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.userPassword || ''}
                  onChange={(e) => handleInputChange('userPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  placeholder="Enter user password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Owner Password (Optional)
              </label>
              <input
                type="password"
                value={formData.ownerPassword || ''}
                onChange={(e) => handleInputChange('ownerPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter owner password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="space-y-2">
                {[
                  { key: 'printing', label: 'Allow Printing' },
                  { key: 'modifying', label: 'Allow Modifying' },
                  { key: 'copying', label: 'Allow Copying' },
                  { key: 'annotating', label: 'Allow Annotating' },
                  { key: 'fillingForms', label: 'Allow Form Filling' }
                ].map(permission => (
                  <label key={permission.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.permissions?.[permission.key] || false}
                      onChange={(e) => handleInputChange('permissions', {
                        ...formData.permissions,
                        [permission.key]: e.target.checked
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{permission.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 'watermark':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Watermark Text
              </label>
              <input
                type="text"
                value={formData.text || ''}
                onChange={(e) => handleInputChange('text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter watermark text"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opacity
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={formData.opacity || 0.3}
                  onChange={(e) => handleInputChange('opacity', parseFloat(e.target.value))}
                  className="w-full"
                />
                <span className="text-xs text-gray-500">{Math.round((formData.opacity || 0.3) * 100)}%</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <input
                  type="number"
                  min="8"
                  max="200"
                  value={formData.fontSize || 48}
                  onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <select
                value={formData.position || 'center'}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="center">Center</option>
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.repeat || false}
                onChange={(e) => handleInputChange('repeat', e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">Repeat watermark across page</label>
            </div>
          </div>
        )

      case 'digital-signature':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signer Name
              </label>
              <input
                type="text"
                value={formData.signerName || ''}
                onChange={(e) => handleInputChange('signerName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter signer name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={formData.reason || ''}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Reason for signing"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Signing location"
              />
            </div>
          </div>
        )

      case 'encrypt':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Encryption Algorithm
              </label>
              <select
                value={formData.algorithm || 'AES-256'}
                onChange={(e) => handleInputChange('algorithm', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="AES-256">AES-256 (Recommended)</option>
                <option value="AES-128">AES-128</option>
                <option value="RC4-128">RC4-128</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Encryption Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password || ''}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                  placeholder="Enter encryption password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Use a strong password with at least 8 characters
              </p>
            </div>
          </div>
        )

      case 'decrypt':
      case 'remove-password':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password || ''}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getOperationColor = (color: string) => {
    const colors = {
      blue: 'border-blue-300 hover:border-blue-400 hover:bg-blue-50',
      cyan: 'border-cyan-300 hover:border-cyan-400 hover:bg-cyan-50',
      green: 'border-green-300 hover:border-green-400 hover:bg-green-50',
      purple: 'border-purple-300 hover:border-purple-400 hover:bg-purple-50',
      orange: 'border-orange-300 hover:border-orange-400 hover:bg-orange-50',
      red: 'border-red-300 hover:border-red-400 hover:bg-red-50',
      indigo: 'border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50',
      emerald: 'border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'maximum': return 'text-green-600 bg-green-100'
      case 'high': return 'text-blue-600 bg-blue-100'
      case 'standard': return 'text-yellow-600 bg-yellow-100'
      case 'basic': return 'text-orange-600 bg-orange-100'
      default: return 'text-red-600 bg-red-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <h2 className="text-lg font-medium text-gray-900">PDF Security Center</h2>
          </div>
          <div className="text-sm text-gray-500">
            Enterprise-grade PDF security
          </div>
        </div>

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
              {isDragActive ? 'Drop the PDF here' : 'Upload PDF for Security Operations'}
            </p>
            <p className="text-gray-600">
              Drag and drop a PDF file, or click to browse
            </p>
          </div>
        )}

        {/* File Info */}
        {uploadedFile && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <h3 className="font-medium text-gray-900">{uploadedFile.name}</h3>
                  <p className="text-sm text-gray-600">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadedFile(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Security Operations */}
        {uploadedFile && !selectedOperation && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Choose Security Operation</h3>
            
            {/* Group operations by category */}
            {['protection', 'verification', 'modification'].map(category => (
              <div key={category} className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                  {category} Operations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {securityOperations
                    .filter(op => op.category === category)
                    .map(operation => {
                      const Icon = operation.icon
                      return (
                        <button
                          key={operation.id}
                          onClick={() => handleOperationSelect(operation.id)}
                          className={`
                            flex flex-col items-center p-4 border-2 rounded-lg transition-colors
                            ${getOperationColor(operation.color)}
                          `}
                        >
                          <Icon className={`h-8 w-8 text-${operation.color}-600 mb-2`} />
                          <span className="text-sm font-medium text-gray-900 text-center">
                            {operation.name}
                          </span>
                          <span className="text-xs text-gray-600 text-center mt-1">
                            {operation.description}
                          </span>
                        </button>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Operation Form */}
        {selectedOperation && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">
                {securityOperations.find(op => op.id === selectedOperation)?.name}
              </h3>
              <button
                onClick={() => setSelectedOperation('')}
                className="text-gray-400 hover:text-gray-600"
              >
                ← Back
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              {renderOperationForm()}
            </div>

            <div className="flex justify-end">
              <button
                onClick={executeSecurityOperation}
                disabled={isProcessing || (selectedOperation !== 'audit' && selectedOperation !== 'verify-integrity' && !formData.password && !formData.userPassword && !formData.text && !formData.signerName)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Execute Operation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mb-6">
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center space-x-2 mb-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Success' : 'Error'}
                </span>
              </div>
              <p className={`${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </p>

              {result.file && (
                <div className="mt-3 p-3 bg-white rounded border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{result.file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(result.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Audit Results */}
        {auditResult && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Security Audit Results</h3>
            
            <div className="space-y-4">
              {/* Security Level */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">Security Level</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSecurityLevelColor(auditResult.securityLevel)}`}>
                  {auditResult.securityLevel.toUpperCase()}
                </span>
              </div>

              {/* Security Features */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Security Features</h4>
                  <div className="space-y-1">
                    {[
                      { key: 'isPasswordProtected', label: 'Password Protected' },
                      { key: 'hasDigitalSignatures', label: 'Digital Signatures' },
                      { key: 'hasWatermarks', label: 'Watermarks' },
                      { key: 'isEncrypted', label: 'Encrypted' }
                    ].map(feature => (
                      <div key={feature.key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{feature.label}</span>
                        {auditResult[feature.key as keyof SecurityAudit] ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Permissions</h4>
                  <div className="space-y-1">
                    {Object.entries(auditResult.permissions).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 capitalize">{key}</span>
                        {value ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vulnerabilities */}
              {auditResult.vulnerabilities.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Vulnerabilities</h4>
                  <div className="space-y-1">
                    {auditResult.vulnerabilities.map((vulnerability, index) => (
                      <div key={index} className="flex items-center space-x-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">{vulnerability}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {auditResult.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                  <div className="space-y-1">
                    {auditResult.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-center space-x-2 text-blue-700">
                        <Settings className="h-4 w-4" />
                        <span className="text-sm">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
