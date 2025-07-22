import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  Copy, 
  Play,
  FileText,
  CheckSquare,
  Type,
  Settings,
  Users,
  Clock,
  Tag
} from 'lucide-react'

interface TemplateStep {
  id: string
  type: 'split' | 'merge' | 'extract' | 'form-fill' | 'ocr' | 'condition'
  name: string
  config: Record<string, any>
  order: number
}

interface ProcessingTemplate {
  id: string
  name: string
  description: string
  category: 'document-processing' | 'form-automation' | 'text-extraction' | 'custom'
  tags: string[]
  steps: TemplateStep[]
  createdAt: string
  updatedAt: string
  createdBy?: string
  isPublic: boolean
  usageCount: number
  rating?: number
  version: string
}

interface TemplateBrowserProps {
  onSelectTemplate?: (template: ProcessingTemplate) => void
  onUseTemplate?: (template: ProcessingTemplate) => void
  className?: string
}

const categoryIcons = {
  'document-processing': FileText,
  'form-automation': CheckSquare,
  'text-extraction': Type,
  'custom': Settings
}

const categoryColors = {
  'document-processing': 'bg-blue-100 text-blue-700',
  'form-automation': 'bg-green-100 text-green-700',
  'text-extraction': 'bg-purple-100 text-purple-700',
  'custom': 'bg-gray-100 text-gray-700'
}

export function TemplateBrowser({ onSelectTemplate, onUseTemplate, className = '' }: TemplateBrowserProps) {
  const [templates, setTemplates] = useState<ProcessingTemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<ProcessingTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<ProcessingTemplate | null>(null)

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockTemplates: ProcessingTemplate[] = [
        {
          id: '1',
          name: 'Invoice Processing',
          description: 'Extract text from invoice PDFs and organize data for accounting systems',
          category: 'document-processing',
          tags: ['invoice', 'ocr', 'business', 'accounting'],
          steps: [
            { id: 'step1', type: 'ocr', name: 'Extract Text', config: { density: 300 }, order: 1 },
            { id: 'step2', type: 'extract', name: 'Extract First Page', config: { pages: [1] }, order: 2 }
          ],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          isPublic: true,
          usageCount: 245,
          rating: 4.8,
          version: '1.0.0'
        },
        {
          id: '2',
          name: 'Contract Splitting',
          description: 'Split multi-page contracts into individual documents for easier management',
          category: 'document-processing',
          tags: ['contract', 'split', 'legal', 'organization'],
          steps: [
            { id: 'step1', type: 'split', name: 'Split by Pages', config: { method: 'pages', interval: 2 }, order: 1 }
          ],
          createdAt: '2024-01-12T14:30:00Z',
          updatedAt: '2024-01-12T14:30:00Z',
          isPublic: true,
          usageCount: 189,
          rating: 4.6,
          version: '1.0.0'
        },
        {
          id: '3',
          name: 'Form Data Extraction',
          description: 'Extract data from filled PDF forms and export to CSV or JSON format',
          category: 'form-automation',
          tags: ['forms', 'data-extraction', 'automation', 'csv'],
          steps: [
            { id: 'step1', type: 'form-fill', name: 'Extract Form Data', config: { extractOnly: true }, order: 1 }
          ],
          createdAt: '2024-01-10T09:15:00Z',
          updatedAt: '2024-01-10T09:15:00Z',
          isPublic: true,
          usageCount: 156,
          rating: 4.7,
          version: '1.0.0'
        },
        {
          id: '4',
          name: 'Document Archive',
          description: 'OCR and merge multiple documents into a searchable archive',
          category: 'text-extraction',
          tags: ['archive', 'ocr', 'merge', 'searchable'],
          steps: [
            { id: 'step1', type: 'ocr', name: 'Extract Text from All', config: { density: 200 }, order: 1 },
            { id: 'step2', type: 'merge', name: 'Combine Documents', config: { outputName: 'archive' }, order: 2 }
          ],
          createdAt: '2024-01-08T16:45:00Z',
          updatedAt: '2024-01-08T16:45:00Z',
          isPublic: true,
          usageCount: 98,
          rating: 4.5,
          version: '1.0.0'
        },
        {
          id: '5',
          name: 'Receipt Scanner',
          description: 'Extract text and amounts from receipt images for expense tracking',
          category: 'text-extraction',
          tags: ['receipt', 'ocr', 'expense', 'business'],
          steps: [
            { id: 'step1', type: 'ocr', name: 'Extract Receipt Text', config: { density: 300, regions: true }, order: 1 }
          ],
          createdAt: '2024-01-05T11:20:00Z',
          updatedAt: '2024-01-05T11:20:00Z',
          isPublic: true,
          usageCount: 67,
          rating: 4.3,
          version: '1.0.0'
        }
      ]
      
      setTemplates(mockTemplates)
      setFilteredTemplates(mockTemplates)
      setIsLoading(false)
    }

    loadTemplates()
  }, [])

  // Filter and sort templates
  useEffect(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.usageCount - a.usageCount
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    setFilteredTemplates(filtered)
  }, [templates, searchQuery, selectedCategory, sortBy])

  const handleUseTemplate = (template: ProcessingTemplate) => {
    if (onUseTemplate) {
      onUseTemplate(template)
    }
  }

  const handleCloneTemplate = (template: ProcessingTemplate) => {
    console.log('Cloning template:', template.name)
    // In real app, this would call the clone API
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'split': return '✂️'
      case 'merge': return '🔗'
      case 'extract': return '📄'
      case 'form-fill': return '📝'
      case 'ocr': return '👁️'
      case 'condition': return '🔀'
      default: return '⚙️'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Template Library</h2>
          <div className="flex items-center space-x-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Most Recent</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="document-processing">Document Processing</option>
            <option value="form-automation">Form Automation</option>
            <option value="text-extraction">Text Extraction</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'No templates available'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => {
              const CategoryIcon = categoryIcons[template.category]
              const categoryColorClass = categoryColors[template.category]

              return (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${categoryColorClass}`}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm">{template.name}</h3>
                        <p className="text-xs text-gray-500">v{template.version}</p>
                      </div>
                    </div>
                    {template.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600">{template.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>

                  {/* Steps Preview */}
                  <div className="mb-3">
                    <div className="flex items-center space-x-1 mb-1">
                      <span className="text-xs font-medium text-gray-500">Steps:</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {template.steps.slice(0, 4).map((step, index) => (
                        <span key={step.id} className="text-xs" title={step.name}>
                          {getStepTypeIcon(step.type)}
                        </span>
                      ))}
                      {template.steps.length > 4 && (
                        <span className="text-xs text-gray-400">+{template.steps.length - 4}</span>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs text-gray-400">+{template.tags.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{template.usageCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(template.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCloneTemplate(template)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Clone Template"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUseTemplate(template)
                        }}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Use Template"
                      >
                        <Play className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{selectedTemplate.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Template Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="ml-2 text-gray-600">{selectedTemplate.category}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Usage Count:</span>
                  <span className="ml-2 text-gray-600">{selectedTemplate.usageCount}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Version:</span>
                  <span className="ml-2 text-gray-600">{selectedTemplate.version}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Updated:</span>
                  <span className="ml-2 text-gray-600">{formatDate(selectedTemplate.updatedAt)}</span>
                </div>
              </div>

              {/* Steps */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Processing Steps</h4>
                <div className="space-y-2">
                  {selectedTemplate.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-lg">{getStepTypeIcon(step.type)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{step.name}</div>
                        <div className="text-xs text-gray-600 capitalize">{step.type} operation</div>
                      </div>
                      <span className="text-xs text-gray-400">Step {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                    >
                      <Tag className="h-2 w-2 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => handleCloneTemplate(selectedTemplate)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                <Copy className="h-4 w-4" />
                <span>Clone</span>
              </button>
              <button
                onClick={() => {
                  handleUseTemplate(selectedTemplate)
                  setSelectedTemplate(null)
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Play className="h-4 w-4" />
                <span>Use Template</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
