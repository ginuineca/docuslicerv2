import React, { useState, useRef } from 'react'
import { 
  Shield, 
  PenTool, 
  Upload, 
  Download, 
  Lock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Calendar,
  FileText,
  X,
  Eye,
  Settings
} from 'lucide-react'

interface SignatureField {
  id: string
  x: number
  y: number
  width: number
  height: number
  page: number
  required: boolean
  signerEmail?: string
  signerName?: string
  signed?: boolean
  signedAt?: Date
  signatureData?: string
}

interface DigitalSignatureProps {
  documentId: string
  documentName: string
  onSignatureComplete: (signedDocument: Blob) => void
  onClose: () => void
}

export function DigitalSignature({ 
  documentId, 
  documentName, 
  onSignatureComplete, 
  onClose 
}: DigitalSignatureProps) {
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([])
  const [currentSignature, setCurrentSignature] = useState<string>('')
  const [signerInfo, setSignerInfo] = useState({
    name: '',
    email: '',
    title: '',
    organization: ''
  })
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('draw')
  const [isDrawing, setIsDrawing] = useState(false)
  const [showCertificateInfo, setShowCertificateInfo] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleStartDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const handleStopDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (!canvas) return

    setCurrentSignature(canvas.toDataURL())
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setCurrentSignature('')
  }

  const addSignatureField = () => {
    const newField: SignatureField = {
      id: `field-${Date.now()}`,
      x: 100,
      y: 100,
      width: 200,
      height: 60,
      page: 1,
      required: true,
      signerEmail: signerInfo.email,
      signerName: signerInfo.name
    }
    setSignatureFields([...signatureFields, newField])
  }

  const signDocument = async () => {
    if (!currentSignature || !signerInfo.name || !signerInfo.email) {
      alert('Please complete your signature and signer information')
      return
    }

    try {
      // In a real implementation, this would call the backend API
      const response = await fetch('/api/documents/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          signature: currentSignature,
          signerInfo,
          signatureFields,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        const signedDocument = await response.blob()
        onSignatureComplete(signedDocument)
      } else {
        throw new Error('Failed to sign document')
      }
    } catch (error) {
      console.error('Signature error:', error)
      alert('Failed to sign document. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Digital Signature</h2>
              <p className="text-sm text-gray-600">{documentName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCertificateInfo(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              <span>Certificate Info</span>
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Signature Panel */}
          <div className="w-96 border-r border-gray-200 p-6 overflow-y-auto">
            {/* Signer Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Signer Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={signerInfo.name}
                    onChange={(e) => setSignerInfo({...signerInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={signerInfo.email}
                    onChange={(e) => setSignerInfo({...signerInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={signerInfo.title}
                    onChange={(e) => setSignerInfo({...signerInfo, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={signerInfo.organization}
                    onChange={(e) => setSignerInfo({...signerInfo, organization: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your organization"
                  />
                </div>
              </div>
            </div>

            {/* Signature Creation */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Signature</h3>
              
              {/* Signature Mode Tabs */}
              <div className="flex space-x-1 mb-4">
                {[
                  { mode: 'draw' as const, label: 'Draw', icon: PenTool },
                  { mode: 'type' as const, label: 'Type', icon: FileText },
                  { mode: 'upload' as const, label: 'Upload', icon: Upload }
                ].map(({ mode, label, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setSignatureMode(mode)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      signatureMode === mode
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Draw Signature */}
              {signatureMode === 'draw' && (
                <div>
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={120}
                    className="border border-gray-300 rounded-lg cursor-crosshair"
                    onMouseDown={handleStartDrawing}
                    onMouseMove={handleDrawing}
                    onMouseUp={handleStopDrawing}
                    onMouseLeave={handleStopDrawing}
                  />
                  <button
                    onClick={clearSignature}
                    className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear Signature
                  </button>
                </div>
              )}

              {/* Type Signature */}
              {signatureMode === 'type' && (
                <div>
                  <input
                    type="text"
                    placeholder="Type your signature"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-2xl font-script"
                    style={{ fontFamily: 'cursive' }}
                  />
                </div>
              )}

              {/* Upload Signature */}
              {signatureMode === 'upload' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Upload signature image</p>
                  <input type="file" accept="image/*" className="hidden" />
                </div>
              )}
            </div>

            {/* Security Features */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Features</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-700">256-bit encryption</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-700">Tamper-evident seal</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-700">Audit trail</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-700">Legal compliance</span>
                </div>
              </div>
            </div>

            {/* Sign Button */}
            <button
              onClick={signDocument}
              disabled={!currentSignature || !signerInfo.name || !signerInfo.email}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Shield className="h-5 w-5" />
              <span>Sign Document</span>
            </button>
          </div>

          {/* Document Preview */}
          <div className="flex-1 p-6">
            <div className="bg-gray-100 rounded-lg h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Document Preview</h3>
                <p className="text-gray-600">Document preview will appear here</p>
                <button
                  onClick={addSignatureField}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Signature Field
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
