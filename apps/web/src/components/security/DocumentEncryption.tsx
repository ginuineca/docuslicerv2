import React, { useState } from 'react'
import { 
  Lock, 
  Unlock, 
  Key, 
  Shield, 
  Eye, 
  EyeOff, 
  Download, 
  Upload,
  AlertTriangle,
  CheckCircle,
  Settings,
  Clock,
  User,
  Calendar
} from 'lucide-react'

interface EncryptionSettings {
  encryptionLevel: '128' | '256' | '512'
  passwordProtection: boolean
  userPassword: string
  ownerPassword: string
  permissions: {
    printing: boolean
    copying: boolean
    editing: boolean
    commenting: boolean
    formFilling: boolean
    accessibility: boolean
    assembly: boolean
    highQualityPrinting: boolean
  }
  expirationDate?: Date
  watermark?: {
    text: string
    opacity: number
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  }
}

interface DocumentEncryptionProps {
  documentId: string
  documentName: string
  onEncryptionComplete: (encryptedDocument: Blob, settings: EncryptionSettings) => void
  onClose: () => void
}

export function DocumentEncryption({ 
  documentId, 
  documentName, 
  onEncryptionComplete, 
  onClose 
}: DocumentEncryptionProps) {
  const [settings, setSettings] = useState<EncryptionSettings>({
    encryptionLevel: '256',
    passwordProtection: true,
    userPassword: '',
    ownerPassword: '',
    permissions: {
      printing: true,
      copying: false,
      editing: false,
      commenting: true,
      formFilling: true,
      accessibility: true,
      assembly: false,
      highQualityPrinting: false
    }
  })

  const [showUserPassword, setShowUserPassword] = useState(false)
  const [showOwnerPassword, setShowOwnerPassword] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'security' | 'permissions' | 'advanced'>('security')

  const generatePassword = (type: 'user' | 'owner') => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    if (type === 'user') {
      setSettings({...settings, userPassword: password})
    } else {
      setSettings({...settings, ownerPassword: password})
    }
  }

  const handlePermissionChange = (permission: keyof EncryptionSettings['permissions']) => {
    setSettings({
      ...settings,
      permissions: {
        ...settings.permissions,
        [permission]: !settings.permissions[permission]
      }
    })
  }

  const encryptDocument = async () => {
    if (settings.passwordProtection && (!settings.userPassword || !settings.ownerPassword)) {
      alert('Please set both user and owner passwords')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/documents/encrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          settings,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        const encryptedDocument = await response.blob()
        onEncryptionComplete(encryptedDocument, settings)
      } else {
        throw new Error('Failed to encrypt document')
      }
    } catch (error) {
      console.error('Encryption error:', error)
      alert('Failed to encrypt document. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getSecurityLevel = () => {
    const level = parseInt(settings.encryptionLevel)
    if (level >= 256) return { level: 'High', color: 'text-green-600', icon: Shield }
    if (level >= 128) return { level: 'Medium', color: 'text-yellow-600', icon: Lock }
    return { level: 'Basic', color: 'text-red-600', icon: AlertTriangle }
  }

  const securityInfo = getSecurityLevel()
  const SecurityIcon = securityInfo.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Lock className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Document Encryption</h2>
              <p className="text-sm text-gray-600">{documentName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 ${securityInfo.color}`}>
              <SecurityIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{securityInfo.level} Security</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <Lock className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'security', label: 'Security Settings', icon: Shield },
              { id: 'permissions', label: 'Permissions', icon: Key },
              { id: 'advanced', label: 'Advanced', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Security Settings Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Encryption Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Encryption Level
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: '128', label: '128-bit AES', description: 'Basic security' },
                    { value: '256', label: '256-bit AES', description: 'High security (Recommended)' },
                    { value: '512', label: '512-bit AES', description: 'Maximum security' }
                  ].map(option => (
                    <label
                      key={option.value}
                      className={`relative flex flex-col p-4 border rounded-lg cursor-pointer transition-colors ${
                        settings.encryptionLevel === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="encryptionLevel"
                        value={option.value}
                        checked={settings.encryptionLevel === option.value}
                        onChange={(e) => setSettings({...settings, encryptionLevel: e.target.value as any})}
                        className="sr-only"
                      />
                      <span className="font-medium text-gray-900">{option.label}</span>
                      <span className="text-sm text-gray-600">{option.description}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Password Protection */}
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="passwordProtection"
                    checked={settings.passwordProtection}
                    onChange={(e) => setSettings({...settings, passwordProtection: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="passwordProtection" className="text-sm font-medium text-gray-700">
                    Enable Password Protection
                  </label>
                </div>

                {settings.passwordProtection && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* User Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Password (Required to open)
                      </label>
                      <div className="relative">
                        <input
                          type={showUserPassword ? 'text' : 'password'}
                          value={settings.userPassword}
                          onChange={(e) => setSettings({...settings, userPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter user password"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                          <button
                            type="button"
                            onClick={() => setShowUserPassword(!showUserPassword)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {showUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => generatePassword('user')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Owner Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Owner Password (Full permissions)
                      </label>
                      <div className="relative">
                        <input
                          type={showOwnerPassword ? 'text' : 'password'}
                          value={settings.ownerPassword}
                          onChange={(e) => setSettings({...settings, ownerPassword: e.target.value})}
                          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter owner password"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                          <button
                            type="button"
                            onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {showOwnerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => generatePassword('owner')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Document Permissions</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Control what users can do with the encrypted document
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'printing', label: 'Allow Printing', description: 'Users can print the document' },
                    { key: 'copying', label: 'Allow Copying', description: 'Users can copy text and images' },
                    { key: 'editing', label: 'Allow Editing', description: 'Users can modify the document' },
                    { key: 'commenting', label: 'Allow Commenting', description: 'Users can add comments and annotations' },
                    { key: 'formFilling', label: 'Allow Form Filling', description: 'Users can fill out forms' },
                    { key: 'accessibility', label: 'Allow Accessibility', description: 'Screen readers can access content' },
                    { key: 'assembly', label: 'Allow Assembly', description: 'Users can insert, rotate, or delete pages' },
                    { key: 'highQualityPrinting', label: 'High Quality Printing', description: 'Allow high-resolution printing' }
                  ].map(permission => (
                    <label
                      key={permission.key}
                      className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={settings.permissions[permission.key as keyof typeof settings.permissions]}
                        onChange={() => handlePermissionChange(permission.key as keyof typeof settings.permissions)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{permission.label}</div>
                        <div className="text-sm text-gray-600">{permission.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Document Expiration */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Security</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Expiration (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={settings.expirationDate ? settings.expirationDate.toISOString().slice(0, 16) : ''}
                      onChange={(e) => setSettings({
                        ...settings, 
                        expirationDate: e.target.value ? new Date(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Watermark */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Watermark Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={settings.watermark?.text || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        watermark: e.target.value ? {
                          text: e.target.value,
                          opacity: settings.watermark?.opacity || 0.3,
                          position: settings.watermark?.position || 'center'
                        } : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter watermark text"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Document will be encrypted with {settings.encryptionLevel}-bit AES encryption</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={encryptDocument}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Encrypting...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Encrypt Document</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
