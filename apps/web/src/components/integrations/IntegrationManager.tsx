import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Settings, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Cloud,
  Mail,
  Database,
  Users,
  Building,
  Zap,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import { IntegrationHub } from '../../services/integrationHub'

interface Integration {
  id: string
  name: string
  type: 'crm' | 'erp' | 'storage' | 'email' | 'productivity' | 'finance'
  provider: string
  isActive: boolean
  lastSync?: Date
  status: 'connected' | 'disconnected' | 'error'
}

const integrationProviders = {
  crm: [
    { id: 'salesforce', name: 'Salesforce', icon: '☁️', description: 'World\'s #1 CRM platform' },
    { id: 'hubspot', name: 'HubSpot', icon: '🧡', description: 'Inbound marketing and sales' },
    { id: 'pipedrive', name: 'Pipedrive', icon: '🔵', description: 'Sales-focused CRM' }
  ],
  storage: [
    { id: 'google-drive', name: 'Google Drive', icon: '📁', description: 'Google cloud storage' },
    { id: 'dropbox', name: 'Dropbox', icon: '📦', description: 'File hosting service' },
    { id: 'onedrive', name: 'OneDrive', icon: '☁️', description: 'Microsoft cloud storage' }
  ],
  email: [
    { id: 'gmail', name: 'Gmail', icon: '📧', description: 'Google email service' },
    { id: 'outlook', name: 'Outlook', icon: '📨', description: 'Microsoft email service' }
  ],
  erp: [
    { id: 'sap', name: 'SAP', icon: '🏢', description: 'Enterprise resource planning' },
    { id: 'oracle', name: 'Oracle', icon: '🔴', description: 'Database and ERP solutions' },
    { id: 'netsuite', name: 'NetSuite', icon: '🌐', description: 'Cloud ERP platform' }
  ]
}

export function IntegrationManager() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedType, setSelectedType] = useState<string>('crm')
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [integrationHub] = useState(() => new IntegrationHub())
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = () => {
    const configs = integrationHub.getIntegrations()
    const integrationList: Integration[] = configs.map(config => ({
      id: config.id,
      name: config.name,
      type: config.type,
      provider: config.provider,
      isActive: config.isActive,
      lastSync: config.lastSync,
      status: config.isActive ? 'connected' : 'disconnected'
    }))
    setIntegrations(integrationList)
  }

  const handleAddIntegration = (providerData: any) => {
    const newIntegration = {
      id: `${providerData.id}-${Date.now()}`,
      name: providerData.name,
      type: selectedType as any,
      provider: providerData.id,
      apiKey: '',
      apiSecret: '',
      baseUrl: '',
      settings: {},
      isActive: false,
      lastSync: undefined
    }

    integrationHub.addIntegration(newIntegration)
    loadIntegrations()
    setShowAddModal(false)
  }

  const testConnection = async (integrationId: string) => {
    setTestingConnection(integrationId)
    try {
      const result = await integrationHub.testConnection(integrationId)
      
      // Update integration status
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: result.success ? 'connected' : 'error' }
          : integration
      ))

      if (result.success) {
        alert('Connection successful!')
      } else {
        alert(`Connection failed: ${result.message}`)
      }
    } catch (error) {
      alert(`Connection test failed: ${error}`)
    } finally {
      setTestingConnection(null)
    }
  }

  const removeIntegration = (integrationId: string) => {
    if (confirm('Are you sure you want to remove this integration?')) {
      integrationHub.removeIntegration(integrationId)
      loadIntegrations()
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crm': return Users
      case 'storage': return Cloud
      case 'email': return Mail
      case 'erp': return Building
      case 'productivity': return Zap
      case 'finance': return Database
      default: return Settings
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100'
      case 'disconnected': return 'text-gray-600 bg-gray-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return CheckCircle
      case 'disconnected': return XCircle
      case 'error': return AlertTriangle
      default: return XCircle
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Integrations</h1>
          <p className="text-gray-600">Connect DocuSlicer with your business systems</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Integration</span>
        </button>
      </div>

      {/* Integration Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Object.entries(integrationProviders).map(([type, providers]) => {
          const Icon = getTypeIcon(type)
          const count = integrations.filter(i => i.type === type).length
          
          return (
            <div key={type} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 capitalize">{type}</h3>
                  <p className="text-sm text-gray-600">{count} connected</p>
                </div>
              </div>
              <div className="space-y-2">
                {providers.slice(0, 3).map(provider => (
                  <div key={provider.id} className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{provider.icon}</span>
                    <span>{provider.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Active Integrations */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Integrations</h2>
        </div>
        <div className="p-6">
          {integrations.length === 0 ? (
            <div className="text-center py-12">
              <Cloud className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations yet</h3>
              <p className="text-gray-600 mb-4">Connect your business systems to automate document workflows</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Your First Integration
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map(integration => {
                const StatusIcon = getStatusIcon(integration.status)
                const TypeIcon = getTypeIcon(integration.type)
                
                return (
                  <div key={integration.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <TypeIcon className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{integration.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{integration.type} • {integration.provider}</p>
                        {integration.lastSync && (
                          <p className="text-xs text-gray-500">
                            Last sync: {integration.lastSync.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {integration.status}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => testConnection(integration.id)}
                          disabled={testingConnection === integration.id}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Test connection"
                        >
                          {testingConnection === integration.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </button>
                        
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Configure"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => removeIntegration(integration.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add Integration</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Category Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Integration Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.keys(integrationProviders).map(type => {
                    const Icon = getTypeIcon(type)
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`p-4 border rounded-lg text-center transition-colors ${
                          selectedType === type
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-8 w-8 mx-auto mb-2" />
                        <span className="font-medium capitalize">{type}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Provider</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integrationProviders[selectedType as keyof typeof integrationProviders]?.map(provider => (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{provider.name}</h4>
                          <p className="text-sm text-gray-600">{provider.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddIntegration(provider)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Connect</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
