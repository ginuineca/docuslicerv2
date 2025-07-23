import React, { useState } from 'react'
import { 
  Heart, 
  FileText, 
  Shield, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Activity,
  Stethoscope,
  Pill,
  UserCheck,
  Lock,
  Eye,
  Download,
  Share,
  Star,
  Zap,
  Calendar,
  TrendingUp
} from 'lucide-react'

interface MedicalRecord {
  id: string
  patientId: string
  patientName: string
  type: 'admission' | 'discharge' | 'lab-result' | 'imaging' | 'prescription' | 'consultation'
  status: 'pending' | 'reviewed' | 'approved' | 'archived'
  priority: 'routine' | 'urgent' | 'critical'
  date: Date
  provider: string
  department: string
  hipaaCompliant: boolean
}

export function HealthcareSolution() {
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'workflows' | 'compliance'>('overview')
  const [records] = useState<MedicalRecord[]>([
    {
      id: '1',
      patientId: 'P-2024-001',
      patientName: 'John Smith',
      type: 'lab-result',
      status: 'reviewed',
      priority: 'routine',
      date: new Date('2024-01-20'),
      provider: 'Dr. Sarah Johnson',
      department: 'Cardiology',
      hipaaCompliant: true
    },
    {
      id: '2',
      patientId: 'P-2024-002',
      patientName: 'Maria Garcia',
      type: 'imaging',
      status: 'pending',
      priority: 'urgent',
      date: new Date('2024-01-21'),
      provider: 'Dr. Michael Chen',
      department: 'Radiology',
      hipaaCompliant: true
    }
  ])

  const healthcareWorkflows = [
    {
      id: 'patient-intake',
      name: 'Patient Intake Processing',
      description: 'Automated processing of patient intake forms with PHI protection',
      features: ['PHI detection', 'Insurance verification', 'Medical history extraction', 'Consent management'],
      estimatedTime: '5 minutes',
      accuracy: '98%',
      hipaaCompliant: true
    },
    {
      id: 'medical-records',
      name: 'Medical Records Management',
      description: 'Secure processing and organization of medical records',
      features: ['Record digitization', 'PHI redaction', 'Clinical data extraction', 'Audit logging'],
      estimatedTime: '8 minutes',
      accuracy: '96%',
      hipaaCompliant: true
    },
    {
      id: 'insurance-claims',
      name: 'Insurance Claims Processing',
      description: 'Automated insurance claim form processing and validation',
      features: ['Claim validation', 'Code verification', 'Prior auth checking', 'Denial management'],
      estimatedTime: '12 minutes',
      accuracy: '94%',
      hipaaCompliant: true
    }
  ]

  const complianceMetrics = [
    {
      name: 'HIPAA Compliance',
      description: 'Full compliance with Health Insurance Portability and Accountability Act',
      score: 99.8,
      status: 'excellent',
      lastAudit: '2024-01-15'
    },
    {
      name: 'PHI Protection',
      description: 'Protected Health Information safeguarding and access controls',
      score: 99.5,
      status: 'excellent',
      lastAudit: '2024-01-18'
    },
    {
      name: 'Audit Trail',
      description: 'Complete audit logging for all PHI access and modifications',
      score: 100,
      status: 'perfect',
      lastAudit: '2024-01-20'
    },
    {
      name: 'Data Encryption',
      description: 'End-to-end encryption for all medical data in transit and at rest',
      score: 99.9,
      status: 'excellent',
      lastAudit: '2024-01-19'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'reviewed': return 'text-blue-600 bg-blue-100'
      case 'approved': return 'text-green-600 bg-green-100'
      case 'archived': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'routine': return 'text-green-600 bg-green-100'
      case 'urgent': return 'text-orange-600 bg-orange-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getComplianceColor = (score: number) => {
    if (score >= 99) return 'text-green-600 bg-green-100'
    if (score >= 95) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'lab-result': return <Activity className="h-4 w-4 text-blue-600" />
      case 'imaging': return <Eye className="h-4 w-4 text-purple-600" />
      case 'prescription': return <Pill className="h-4 w-4 text-green-600" />
      case 'consultation': return <Stethoscope className="h-4 w-4 text-orange-600" />
      default: return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <Heart className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Healthcare Solution</h1>
            <p className="text-gray-600">HIPAA-compliant medical document processing</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            HIPAA Compliant
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            PHI Protected
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'records', label: 'Medical Records', icon: FileText },
            { id: 'workflows', label: 'Healthcare Workflows', icon: Zap },
            { id: 'compliance', label: 'HIPAA Compliance', icon: Shield }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Patients</p>
                  <p className="text-2xl font-bold text-gray-900">2,847</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm">+156 this month</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Records Processed</p>
                  <p className="text-2xl font-bold text-gray-900">18,492</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center text-blue-600">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">Avg 2.8 min processing</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">HIPAA Score</p>
                  <p className="text-2xl font-bold text-gray-900">99.8%</p>
                </div>
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <div className="mt-4 flex items-center text-red-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Fully compliant</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">PHI Incidents</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <Lock className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Zero breaches</span>
              </div>
            </div>
          </div>

          {/* Healthcare Specializations */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Healthcare Specializations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Stethoscope className="h-12 w-12 text-red-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900">Clinical Records</h4>
                <p className="text-sm text-gray-600 mt-2">Patient records, clinical notes, and medical histories with PHI protection</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Activity className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900">Lab Results</h4>
                <p className="text-sm text-gray-600 mt-2">Automated lab result processing and integration with EHR systems</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <UserCheck className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900">Insurance Claims</h4>
                <p className="text-sm text-gray-600 mt-2">Claims processing, prior authorization, and billing documentation</p>
              </div>
            </div>
          </div>

          {/* HIPAA Compliance Status */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">HIPAA Compliance Status</h3>
                <p className="text-red-700">All healthcare workflows are fully HIPAA compliant</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800">PHI Protection</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800">Access Controls</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800">Audit Logging</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800">Data Encryption</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Medical Records</h3>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Upload Record
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Record Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{record.patientName}</div>
                            <div className="text-sm text-gray-500">{record.patientId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getRecordTypeIcon(record.type)}
                          <span className="text-sm text-gray-900 capitalize">{record.type.replace('-', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(record.priority)}`}>
                          {record.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.date.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{record.provider}</div>
                        <div className="text-sm text-gray-500">{record.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Download className="h-4 w-4" />
                          </button>
                          {record.hipaaCompliant && (
                            <Shield className="h-4 w-4 text-red-600" title="HIPAA Compliant" />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Healthcare Workflows</h3>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Create Custom Workflow
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthcareWorkflows.map(workflow => (
              <div key={workflow.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{workflow.name}</h4>
                  <div className="flex items-center space-x-2">
                    {workflow.hipaaCompliant && (
                      <Shield className="h-4 w-4 text-red-600" title="HIPAA Compliant" />
                    )}
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">{workflow.accuracy}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{workflow.description}</p>
                
                <div className="space-y-2 mb-4">
                  {workflow.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{workflow.estimatedTime}</span>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                    Use Workflow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-900">HIPAA Compliant</h3>
                <p className="text-green-700">All healthcare workflows meet HIPAA requirements</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complianceMetrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{metric.name}</h4>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getComplianceColor(metric.score)}`}>
                    {metric.score}%
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{metric.description}</p>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Compliance Score</span>
                  <span className="font-semibold text-gray-900">{metric.score}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${metric.score}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Last Audit:</span>
                  <span>{metric.lastAudit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-4">HIPAA Safeguards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-red-800 mb-2">Administrative Safeguards</h4>
                <ul className="space-y-1 text-sm text-red-700">
                  <li>• Security Officer designation</li>
                  <li>• Workforce training</li>
                  <li>• Access management</li>
                  <li>• Contingency planning</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-800 mb-2">Physical Safeguards</h4>
                <ul className="space-y-1 text-sm text-red-700">
                  <li>• Facility access controls</li>
                  <li>• Workstation security</li>
                  <li>• Device controls</li>
                  <li>• Media disposal</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-800 mb-2">Technical Safeguards</h4>
                <ul className="space-y-1 text-sm text-red-700">
                  <li>• Access control systems</li>
                  <li>• Audit controls</li>
                  <li>• Data integrity</li>
                  <li>• Transmission security</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
