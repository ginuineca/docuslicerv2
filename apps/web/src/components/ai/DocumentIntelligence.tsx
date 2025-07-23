import React, { useState, useEffect } from 'react'
import { 
  Brain, 
  FileText, 
  Zap, 
  TrendingUp, 
  Shield, 
  Eye, 
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Users,
  Globe,
  Sparkles
} from 'lucide-react'
import { AIDocumentIntelligence } from '../../services/aiDocumentIntelligence'

interface DocumentIntelligenceProps {
  documentId: string
  documentText: string
  onWorkflowSuggestion: (workflow: any) => void
}

export function DocumentIntelligence({ 
  documentId, 
  documentText, 
  onWorkflowSuggestion 
}: DocumentIntelligenceProps) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'extraction' | 'workflows' | 'compliance' | 'insights'>('overview')
  const [aiService] = useState(() => new AIDocumentIntelligence())

  useEffect(() => {
    if (documentText) {
      analyzeDocument()
    }
  }, [documentText])

  const analyzeDocument = async () => {
    setLoading(true)
    try {
      // Run all AI analyses in parallel
      const [classification, extractedData, compliance, insights] = await Promise.all([
        aiService.classifyDocument(documentText),
        aiService.extractData(documentText, 'unknown'),
        aiService.analyzeCompliance(documentText),
        aiService.generateInsights(documentText)
      ])

      // Generate workflow suggestions based on classification and extracted data
      const workflowSuggestions = await aiService.suggestWorkflows(classification, extractedData)

      setAnalysis({
        classification,
        extractedData,
        compliance,
        insights,
        workflowSuggestions
      })
    } catch (error) {
      console.error('Document analysis failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing document with AI...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">AI Document Intelligence</h3>
        <p className="text-gray-600">Upload a document to get AI-powered insights and suggestions</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Document Intelligence</h2>
              <p className="text-sm text-gray-600">
                {analysis.classification.type.charAt(0).toUpperCase() + analysis.classification.type.slice(1)} Document
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(analysis.classification.confidence)}`}>
                  {Math.round(analysis.classification.confidence * 100)}% confidence
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">AI-Powered</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'extraction', label: 'Data Extraction', icon: Target },
            { id: 'workflows', label: 'Workflow Suggestions', icon: Zap },
            { id: 'compliance', label: 'Compliance', icon: Shield },
            { id: 'insights', label: 'Insights', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
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

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Document Classification */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Document Type</h3>
                    <p className="text-blue-700 capitalize">{analysis.classification.type}</p>
                    {analysis.classification.subtype && (
                      <p className="text-sm text-blue-600">{analysis.classification.subtype}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Confidence Score</h3>
                    <p className="text-green-700">{Math.round(analysis.classification.confidence * 100)}%</p>
                    <p className="text-sm text-green-600">Classification accuracy</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Globe className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-semibold text-purple-900">Language</h3>
                    <p className="text-purple-700">{analysis.classification.language.toUpperCase()}</p>
                    <p className="text-sm text-purple-600">{analysis.classification.pageCount} pages</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Features */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Has Images', value: analysis.classification.hasImages },
                  { label: 'Has Tables', value: analysis.classification.hasTables },
                  { label: 'Has Forms', value: analysis.classification.hasForms },
                  { label: 'Is Scanned', value: analysis.classification.isScanned }
                ].map(feature => (
                  <div key={feature.label} className="flex items-center space-x-2">
                    {feature.value ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="text-sm text-gray-700">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Summary</h3>
              <p className="text-gray-700">{analysis.extractedData.summary}</p>
            </div>
          </div>
        )}

        {/* Data Extraction Tab */}
        {activeTab === 'extraction' && (
          <div className="space-y-6">
            {/* Entities */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Entities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.extractedData.entities.map((entity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{entity.value}</span>
                      <p className="text-sm text-gray-600 capitalize">{entity.type}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(entity.confidence)}`}>
                      {Math.round(entity.confidence * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key-Value Pairs */}
            {analysis.extractedData.keyValuePairs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Information</h3>
                <div className="space-y-2">
                  {analysis.extractedData.keyValuePairs.map((pair: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <span className="font-medium text-gray-700">{pair.key}:</span>
                        <span className="ml-2 text-gray-900">{pair.value}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(pair.confidence)}`}>
                        {Math.round(pair.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tables */}
            {analysis.extractedData.tables.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Tables</h3>
                {analysis.extractedData.tables.map((table: any, index: number) => (
                  <div key={index} className="mb-4 overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          {table.headers.map((header: string, i: number) => (
                            <th key={i} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row: string[], i: number) => (
                          <tr key={i} className="border-b">
                            {row.map((cell: string, j: number) => (
                              <td key={j} className="px-4 py-2 text-sm text-gray-900">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-500 mt-2">
                      Confidence: {Math.round(table.confidence * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Workflow Suggestions Tab */}
        {activeTab === 'workflows' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">AI-Suggested Workflows</h3>
              <span className="text-sm text-gray-600">{analysis.workflowSuggestions.length} suggestions</span>
            </div>
            
            {analysis.workflowSuggestions.map((workflow: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{workflow.name}</h4>
                    <p className="text-gray-600 text-sm mt-1">{workflow.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(workflow.confidence)}`}>
                      {Math.round(workflow.confidence * 100)}%
                    </span>
                    <span className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {workflow.estimatedTime}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                    <strong>Business Value:</strong> {workflow.businessValue}
                  </p>
                </div>
                
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Workflow Steps:</h5>
                  <div className="space-y-1">
                    {workflow.steps.map((step: any, stepIndex: number) => (
                      <div key={stepIndex} className="flex items-center space-x-2 text-sm">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                          {stepIndex + 1}
                        </span>
                        <span className="text-gray-700">{step.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => onWorkflowSuggestion(workflow)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Zap className="h-4 w-4" />
                  <span>Apply This Workflow</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Compliance Score */}
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-900">Compliance Score</h3>
                  <p className="text-green-700">Overall regulatory compliance assessment</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">{analysis.compliance.complianceScore}%</div>
                  <p className="text-sm text-green-600">
                    {analysis.compliance.complianceScore >= 90 ? 'Excellent' :
                     analysis.compliance.complianceScore >= 75 ? 'Good' :
                     analysis.compliance.complianceScore >= 60 ? 'Fair' : 'Needs Improvement'}
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            {analysis.compliance.risks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                <div className="space-y-3">
                  {analysis.compliance.risks.map((risk: any, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        risk.severity === 'high' ? 'text-red-500' :
                        risk.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{risk.type}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(risk.severity)}`}>
                            {risk.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{risk.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {analysis.compliance.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Recommendations</h3>
                <div className="space-y-2">
                  {analysis.compliance.recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                      <p className="text-blue-800 text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900">Readability</h4>
                <p className="text-2xl font-bold text-blue-600">{analysis.insights.readabilityScore}%</p>
                <p className="text-sm text-blue-700">Ease of reading</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900">Sentiment</h4>
                <p className="text-lg font-bold text-green-600 capitalize">{analysis.insights.sentiment}</p>
                <p className="text-sm text-green-700">Overall tone</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-900">Complexity</h4>
                <p className="text-lg font-bold text-purple-600 capitalize">{analysis.insights.complexity}</p>
                <p className="text-sm text-purple-700">Document complexity</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900">Topics</h4>
                <p className="text-2xl font-bold text-orange-600">{analysis.insights.topics.length}</p>
                <p className="text-sm text-orange-700">Key topics found</p>
              </div>
            </div>

            {/* Topics */}
            {analysis.insights.topics.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.insights.topics.map((topic: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {analysis.insights.actionItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h3>
                <div className="space-y-2">
                  {analysis.insights.actionItems.map((item: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <p className="text-yellow-800 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Metrics */}
            {analysis.insights.keyMetrics.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.insights.keyMetrics.map((metric: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="font-medium text-gray-700">{metric.name}</span>
                      <span className="text-gray-900 font-semibold">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
