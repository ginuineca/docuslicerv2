import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { 
  Upload, 
  FileText, 
  Brain, 
  Zap,
  Tag,
  BarChart3,
  FileSearch,
  MessageSquare,
  Clock,
  TrendingUp,
  Users,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader,
  Copy,
  Download
} from 'lucide-react'

interface DocumentClassification {
  category: string
  confidence: number
  subcategories: Array<{
    name: string
    confidence: number
  }>
  tags: string[]
  language: string
}

interface DocumentSummary {
  summary: string
  keyPoints: string[]
  entities: Array<{
    text: string
    type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'other'
    confidence: number
  }>
  sentiment: {
    score: number
    label: 'positive' | 'negative' | 'neutral'
  }
  wordCount: number
  readingTime: number
}

interface ContentAnalysis {
  topics: Array<{
    name: string
    relevance: number
    keywords: string[]
  }>
  complexity: {
    score: number
    level: 'elementary' | 'middle' | 'high' | 'college' | 'graduate'
    readabilityIndex: number
  }
  structure: {
    sections: number
    paragraphs: number
    sentences: number
    averageSentenceLength: number
  }
}

interface IntelligentExtraction {
  structuredData: Record<string, any>
  tables: Array<{
    headers: string[]
    rows: string[][]
    confidence: number
  }>
  forms: Array<{
    fieldName: string
    value: string
    confidence: number
    type: 'text' | 'number' | 'date' | 'email' | 'phone'
  }>
}

interface AIDocumentAnalyzerProps {
  onAnalysisComplete?: (results: any) => void
  className?: string
}

export function AIDocumentAnalyzer({ onAnalysisComplete, className = '' }: AIDocumentAnalyzerProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeAnalysis, setActiveAnalysis] = useState<string[]>([])
  const [results, setResults] = useState<{
    classification?: DocumentClassification
    summary?: DocumentSummary
    analysis?: ContentAnalysis
    extraction?: IntelligentExtraction
  }>({})
  const [error, setError] = useState<string | null>(null)
  const [capabilities, setCapabilities] = useState<any>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadedFile(file)
    setError(null)
    setResults({})
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  })

  const runAnalysis = async (analysisTypes: string[]) => {
    if (!uploadedFile) return

    setIsAnalyzing(true)
    setActiveAnalysis(analysisTypes)
    setError(null)

    try {
      const newResults: any = {}

      // Simulate AI analysis - in real app, this would call the actual API
      for (const analysisType of analysisTypes) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate processing time

        switch (analysisType) {
          case 'classification':
            newResults.classification = {
              category: 'invoice',
              confidence: 0.94,
              subcategories: [
                { name: 'business_invoice', confidence: 0.89 },
                { name: 'service_bill', confidence: 0.76 }
              ],
              tags: ['invoice', 'payment', 'business', 'billing', 'service'],
              language: 'en'
            }
            break

          case 'summary':
            newResults.summary = {
              summary: 'This document appears to be a business invoice for professional services rendered. It contains payment details, service descriptions, and billing information.',
              keyPoints: [
                'Invoice for professional consulting services',
                'Payment due within 30 days',
                'Multiple service items listed with individual costs',
                'Tax calculations included in total amount'
              ],
              entities: [
                { text: 'John Smith', type: 'person', confidence: 0.92 },
                { text: 'ABC Corporation', type: 'organization', confidence: 0.88 },
                { text: 'New York', type: 'location', confidence: 0.85 },
                { text: 'March 15, 2024', type: 'date', confidence: 0.95 },
                { text: '$2,500.00', type: 'money', confidence: 0.97 }
              ],
              sentiment: { score: 0.1, label: 'neutral' },
              wordCount: 342,
              readingTime: 2
            }
            break

          case 'analysis':
            newResults.analysis = {
              topics: [
                { name: 'billing', relevance: 0.85, keywords: ['invoice', 'payment', 'bill'] },
                { name: 'services', relevance: 0.72, keywords: ['consulting', 'professional', 'service'] },
                { name: 'business', relevance: 0.68, keywords: ['company', 'corporation', 'business'] }
              ],
              complexity: {
                score: 65,
                level: 'middle',
                readabilityIndex: 65.2
              },
              structure: {
                sections: 4,
                paragraphs: 8,
                sentences: 23,
                averageSentenceLength: 15
              }
            }
            break

          case 'extraction':
            newResults.extraction = {
              structuredData: {
                invoiceNumber: 'INV-2024-001',
                amount: '$2,500.00',
                dueDate: '2024-04-15',
                vendor: 'ABC Corporation',
                client: 'John Smith'
              },
              tables: [
                {
                  headers: ['Service', 'Hours', 'Rate', 'Amount'],
                  rows: [
                    ['Consulting', '20', '$100', '$2,000'],
                    ['Documentation', '5', '$100', '$500']
                  ],
                  confidence: 0.91
                }
              ],
              forms: [
                { fieldName: 'invoice_number', value: 'INV-2024-001', confidence: 0.95, type: 'text' },
                { fieldName: 'total_amount', value: '2500.00', confidence: 0.98, type: 'number' },
                { fieldName: 'due_date', value: '2024-04-15', confidence: 0.92, type: 'date' }
              ]
            }
            break
        }

        setResults(prev => ({ ...prev, ...newResults }))
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(newResults)
      }

    } catch (err) {
      setError('Failed to analyze document')
    } finally {
      setIsAnalyzing(false)
      setActiveAnalysis([])
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${uploadedFile?.name || 'document'}_ai_analysis.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive': return 'text-green-600 bg-green-100'
      case 'negative': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'elementary': return 'text-green-600 bg-green-100'
      case 'middle': return 'text-blue-600 bg-blue-100'
      case 'high': return 'text-yellow-600 bg-yellow-100'
      case 'college': return 'text-orange-600 bg-orange-100'
      case 'graduate': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-medium text-gray-900">AI Document Analyzer</h2>
          </div>
          {Object.keys(results).length > 0 && (
            <button
              onClick={downloadResults}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download Results</span>
            </button>
          )}
        </div>

        {/* File Upload */}
        {!uploadedFile && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop the document here' : 'Upload Document for AI Analysis'}
            </p>
            <p className="text-gray-600">
              Drag and drop a PDF or text file, or click to browse
            </p>
          </div>
        )}

        {/* File Info */}
        {uploadedFile && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-purple-500" />
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

        {/* Analysis Options */}
        {uploadedFile && !isAnalyzing && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Choose Analysis Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => runAnalysis(['classification'])}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <Tag className="h-6 w-6 text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Classify</span>
                <span className="text-xs text-gray-600 text-center">Category & tags</span>
              </button>

              <button
                onClick={() => runAnalysis(['summary'])}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                <MessageSquare className="h-6 w-6 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Summarize</span>
                <span className="text-xs text-gray-600 text-center">Key points</span>
              </button>

              <button
                onClick={() => runAnalysis(['analysis'])}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
              >
                <BarChart3 className="h-6 w-6 text-purple-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Analyze</span>
                <span className="text-xs text-gray-600 text-center">Structure & topics</span>
              </button>

              <button
                onClick={() => runAnalysis(['extraction'])}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors"
              >
                <FileSearch className="h-6 w-6 text-orange-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Extract</span>
                <span className="text-xs text-gray-600 text-center">Structured data</span>
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => runAnalysis(['classification', 'summary', 'analysis', 'extraction'])}
                className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 mx-auto"
              >
                <Zap className="h-5 w-5" />
                <span>Run Complete Analysis</span>
              </button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {isAnalyzing && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Loader className="h-5 w-5 text-purple-600 animate-spin" />
              <div>
                <h4 className="font-medium text-purple-900">AI Analysis in Progress</h4>
                <p className="text-sm text-purple-700">
                  Running {activeAnalysis.join(', ')} analysis...
                </p>
              </div>
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

        {/* Results */}
        {Object.keys(results).length > 0 && (
          <div className="space-y-6">
            {/* Classification Results */}
            {results.classification && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-blue-600" />
                    Document Classification
                  </h4>
                  <span className="text-sm text-gray-500">
                    {Math.round(results.classification.confidence * 100)}% confidence
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {results.classification.category}
                    </span>
                  </div>
                  
                  {results.classification.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {results.classification.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Summary Results */}
            {results.summary && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 flex items-center mb-3">
                  <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                  Document Summary
                </h4>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700">{results.summary.summary}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-900">{results.summary.wordCount}</div>
                      <div className="text-gray-600">Words</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-900">{results.summary.readingTime} min</div>
                      <div className="text-gray-600">Reading Time</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(results.summary.sentiment.label)}`}>
                        {results.summary.sentiment.label}
                      </span>
                      <div className="text-gray-600 mt-1">Sentiment</div>
                    </div>
                  </div>

                  {results.summary.keyPoints.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-900 mb-2">Key Points:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {results.summary.keyPoints.map((point, index) => (
                          <li key={index} className="text-sm">{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {results.analysis && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 flex items-center mb-3">
                  <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
                  Content Analysis
                </h4>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-900">{results.analysis.structure.sections}</div>
                      <div className="text-gray-600">Sections</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-900">{results.analysis.structure.paragraphs}</div>
                      <div className="text-gray-600">Paragraphs</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="font-medium text-gray-900">{results.analysis.structure.sentences}</div>
                      <div className="text-gray-600">Sentences</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(results.analysis.complexity.level)}`}>
                        {results.analysis.complexity.level}
                      </span>
                      <div className="text-gray-600 mt-1">Reading Level</div>
                    </div>
                  </div>

                  {results.analysis.topics.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-900 mb-2">Main Topics:</p>
                      <div className="space-y-2">
                        {results.analysis.topics.map((topic, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 capitalize">{topic.name}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{ width: `${topic.relevance * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {Math.round(topic.relevance * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Extraction Results */}
            {results.extraction && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 flex items-center mb-3">
                  <FileSearch className="h-4 w-4 mr-2 text-orange-600" />
                  Intelligent Data Extraction
                </h4>
                
                <div className="space-y-4">
                  {Object.keys(results.extraction.structuredData).length > 0 && (
                    <div>
                      <p className="font-medium text-gray-900 mb-2">Extracted Data:</p>
                      <div className="bg-gray-50 p-3 rounded">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(results.extraction.structuredData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {results.extraction.forms.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-900 mb-2">Form Fields:</p>
                      <div className="space-y-2">
                        {results.extraction.forms.map((field, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{field.fieldName}:</span>
                              <span className="text-sm text-gray-700 ml-2">{field.value}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">{field.type}</span>
                              <span className="text-xs text-gray-500">
                                {Math.round(field.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
