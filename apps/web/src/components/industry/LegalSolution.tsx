import React, { useState } from 'react'
import { 
  Scale, 
  FileText, 
  Shield, 
  Search, 
  Clock, 
  Users,
  AlertTriangle,
  CheckCircle,
  Gavel,
  BookOpen,
  Lock,
  Eye,
  Download,
  Share,
  Star,
  Zap
} from 'lucide-react'

interface LegalDocument {
  id: string
  name: string
  type: 'contract' | 'brief' | 'motion' | 'discovery' | 'pleading' | 'agreement'
  status: 'draft' | 'review' | 'approved' | 'executed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  assignedTo: string
  tags: string[]
  confidentiality: 'public' | 'confidential' | 'attorney-client' | 'work-product'
}

export function LegalSolution() {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'workflows' | 'compliance'>('overview')
  const [documents] = useState<LegalDocument[]>([
    {
      id: '1',
      name: 'Software License Agreement - TechCorp',
      type: 'agreement',
      status: 'review',
      priority: 'high',
      dueDate: new Date('2024-02-15'),
      assignedTo: 'Sarah Johnson',
      tags: ['software', 'licensing', 'intellectual-property'],
      confidentiality: 'confidential'
    },
    {
      id: '2',
      name: 'Motion for Summary Judgment - Case #2024-001',
      type: 'motion',
      status: 'draft',
      priority: 'urgent',
      dueDate: new Date('2024-02-10'),
      assignedTo: 'Michael Chen',
      tags: ['litigation', 'summary-judgment', 'civil'],
      confidentiality: 'work-product'
    }
  ])

  const legalWorkflows = [
    {
      id: 'contract-review',
      name: 'Contract Review & Analysis',
      description: 'Automated contract analysis with clause extraction and risk assessment',
      features: ['Clause identification', 'Risk scoring', 'Compliance checking', 'Redlining suggestions'],
      estimatedTime: '15 minutes',
      accuracy: '94%'
    },
    {
      id: 'discovery-processing',
      name: 'Discovery Document Processing',
      description: 'Bulk processing of discovery documents with privilege review',
      features: ['Privilege detection', 'PII redaction', 'Metadata extraction', 'Bates numbering'],
      estimatedTime: '8 minutes per document',
      accuracy: '97%'
    },
    {
      id: 'brief-generation',
      name: 'Legal Brief Generation',
      description: 'AI-assisted brief writing with citation checking and formatting',
      features: ['Citation validation', 'Legal formatting', 'Argument structuring', 'Precedent research'],
      estimatedTime: '45 minutes',
      accuracy: '91%'
    }
  ]

  const complianceFeatures = [
    {
      name: 'Attorney-Client Privilege',
      description: 'Automatic detection and protection of privileged communications',
      status: 'active',
      coverage: '99.2%'
    },
    {
      name: 'Work Product Doctrine',
      description: 'Identification and safeguarding of attorney work product',
      status: 'active',
      coverage: '96.8%'
    },
    {
      name: 'Ethical Compliance',
      description: 'Adherence to state bar ethical rules and regulations',
      status: 'active',
      coverage: '100%'
    },
    {
      name: 'Court Rules Compliance',
      description: 'Automatic formatting per local and federal court rules',
      status: 'active',
      coverage: '94.5%'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100'
      case 'review': return 'text-yellow-600 bg-yellow-100'
      case 'approved': return 'text-green-600 bg-green-100'
      case 'executed': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'urgent': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getConfidentialityIcon = (level: string) => {
    switch (level) {
      case 'attorney-client': return <Shield className="h-4 w-4 text-red-600" />
      case 'work-product': return <Lock className="h-4 w-4 text-orange-600" />
      case 'confidential': return <Eye className="h-4 w-4 text-yellow-600" />
      default: return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Scale className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Legal Practice Solution</h1>
            <p className="text-gray-600">Specialized document processing for legal professionals</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            Bar Compliant
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            Privilege Protected
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'documents', label: 'Documents', icon: FileText },
            { id: 'workflows', label: 'Legal Workflows', icon: Zap },
            { id: 'compliance', label: 'Compliance', icon: Shield }
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Cases</p>
                  <p className="text-2xl font-bold text-gray-900">47</p>
                </div>
                <Gavel className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">12 resolved this month</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Documents Processed</p>
                  <p className="text-2xl font-bold text-gray-900">1,247</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center text-blue-600">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">Avg 3.2 min processing</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                  <p className="text-2xl font-bold text-gray-900">98.7%</p>
                </div>
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-4 flex items-center text-purple-600">
                <Star className="h-4 w-4 mr-1" />
                <span className="text-sm">Excellent rating</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Time Saved</p>
                  <p className="text-2xl font-bold text-gray-900">340h</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-4 flex items-center text-orange-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="text-sm">This month</span>
              </div>
            </div>
          </div>

          {/* Legal Specializations */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Specializations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900">Contract Law</h4>
                <p className="text-sm text-gray-600 mt-2">Automated contract analysis, clause extraction, and risk assessment</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Gavel className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900">Litigation Support</h4>
                <p className="text-sm text-gray-600 mt-2">Discovery processing, privilege review, and document production</p>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <Shield className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900">Compliance</h4>
                <p className="text-sm text-gray-600 mt-2">Regulatory compliance, ethical rules, and professional standards</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Legal Documents</h3>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Upload Document
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getConfidentialityIcon(doc.confidentiality)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              {doc.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 capitalize">{doc.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(doc.priority)}`}>
                          {doc.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.dueDate?.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doc.assignedTo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            <Download className="h-4 w-4" />
                          </button>
                          <button className="text-purple-600 hover:text-purple-900">
                            <Share className="h-4 w-4" />
                          </button>
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
            <h3 className="text-lg font-semibold text-gray-900">Legal Workflows</h3>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Custom Workflow
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {legalWorkflows.map(workflow => (
              <div key={workflow.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{workflow.name}</h4>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">{workflow.accuracy}</span>
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
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
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
                <h3 className="text-lg font-semibold text-green-900">Fully Compliant</h3>
                <p className="text-green-700">Your legal document processing meets all professional standards</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complianceFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    feature.status === 'active' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                  }`}>
                    {feature.status}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Coverage</span>
                  <span className="font-semibold text-gray-900">{feature.coverage}</span>
                </div>
                
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: feature.coverage }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Professional Standards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">ABA Model Rules</p>
                  <p className="text-sm text-blue-700">Compliant</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Lock className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Client Confidentiality</p>
                  <p className="text-sm text-blue-700">Protected</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Document Retention</p>
                  <p className="text-sm text-blue-700">Automated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
