import React, { useState } from 'react'
import { 
  Shield, 
  Lock, 
  Key, 
  FileText, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
  Settings,
  TrendingUp,
  Activity,
  Database,
  Globe
} from 'lucide-react'

interface SecurityMetrics {
  totalDocuments: number
  encryptedDocuments: number
  signedDocuments: number
  complianceViolations: number
  activeUsers: number
  auditEvents: number
  riskScore: number
  complianceScore: number
}

interface SecurityDashboardProps {
  onOpenAuditTrail: () => void
  onOpenEncryption: () => void
  onOpenSignature: () => void
}

export function SecurityDashboard({ 
  onOpenAuditTrail, 
  onOpenEncryption, 
  onOpenSignature 
}: SecurityDashboardProps) {
  const [metrics] = useState<SecurityMetrics>({
    totalDocuments: 1247,
    encryptedDocuments: 892,
    signedDocuments: 456,
    complianceViolations: 3,
    activeUsers: 89,
    auditEvents: 2341,
    riskScore: 85,
    complianceScore: 92
  })

  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('7d')

  const securityFeatures = [
    {
      id: 'encryption',
      name: 'Document Encryption',
      description: 'AES-256 encryption with advanced access controls',
      icon: Lock,
      status: 'active',
      usage: '71%',
      color: 'blue',
      onClick: onOpenEncryption
    },
    {
      id: 'signatures',
      name: 'Digital Signatures',
      description: 'Legally binding digital signatures with certificates',
      icon: FileText,
      status: 'active',
      usage: '37%',
      color: 'green',
      onClick: onOpenSignature
    },
    {
      id: 'audit',
      name: 'Audit Trail',
      description: 'Complete audit logging and compliance reporting',
      icon: Eye,
      status: 'active',
      usage: '100%',
      color: 'purple',
      onClick: onOpenAuditTrail
    },
    {
      id: 'compliance',
      name: 'Compliance Templates',
      description: 'GDPR, HIPAA, SOX compliant workflows',
      icon: Shield,
      status: 'active',
      usage: '45%',
      color: 'orange'
    }
  ]

  const complianceStatus = [
    { regulation: 'GDPR', status: 'compliant', score: 94, lastAudit: '2024-01-15' },
    { regulation: 'HIPAA', status: 'compliant', score: 91, lastAudit: '2024-01-10' },
    { regulation: 'SOX', status: 'warning', score: 87, lastAudit: '2024-01-08' },
    { regulation: 'ISO 27001', status: 'compliant', score: 96, lastAudit: '2024-01-12' }
  ]

  const recentAlerts = [
    {
      id: 1,
      type: 'warning',
      message: 'Unusual access pattern detected for user john.doe@company.com',
      timestamp: new Date('2024-01-20T10:30:00'),
      severity: 'medium'
    },
    {
      id: 2,
      type: 'info',
      message: 'Compliance audit completed successfully',
      timestamp: new Date('2024-01-20T09:15:00'),
      severity: 'low'
    },
    {
      id: 3,
      type: 'error',
      message: 'Failed encryption attempt on document "Financial Report Q4"',
      timestamp: new Date('2024-01-20T08:45:00'),
      severity: 'high'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-blue-500'
      default: return 'border-l-gray-500'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-600">Monitor security metrics and compliance status</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Risk Score</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.riskScore}/100</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+5% from last week</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.complianceScore}%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-blue-600">
              <Activity className="h-4 w-4 mr-1" />
              <span>Excellent</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Encrypted Documents</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.encryptedDocuments}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Lock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-gray-600">
              <span>{Math.round((metrics.encryptedDocuments / metrics.totalDocuments) * 100)}% of total</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-orange-600">
              <Globe className="h-4 w-4 mr-1" />
              <span>12 locations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Security Features</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map(feature => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={feature.onClick}
                >
                  <div className={`p-3 rounded-lg bg-${feature.color}-100`}>
                    <Icon className={`h-6 w-6 text-${feature.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{feature.name}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-${feature.color}-500 h-2 rounded-full`}
                          style={{ width: feature.usage }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{feature.usage}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Compliance Status & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Status */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Compliance Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {complianceStatus.map(item => (
                <div key={item.regulation} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.regulation}</h3>
                    <p className="text-sm text-gray-600">Last audit: {item.lastAudit}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">{item.score}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentAlerts.map(alert => (
                <div key={alert.id} className={`border-l-4 pl-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {alert.timestamp.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.type)}`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
