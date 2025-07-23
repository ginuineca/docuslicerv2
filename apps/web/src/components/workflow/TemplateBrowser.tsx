import React, { useState } from 'react'
import { X, Search, Filter, Clock, Tag, Play, Eye, Download, Lock, Crown, Zap } from 'lucide-react'
import { WorkflowTemplate, workflowTemplates } from '../../data/workflowTemplates'
import { SubscriptionTier, canAccessTemplate, getUpgradeMessage, getTierBadgeProps } from '../../utils/templateTiers'

interface TemplateBrowserProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: WorkflowTemplate) => void
  onPreviewTemplate: (template: WorkflowTemplate) => void
  userTier?: SubscriptionTier
  onUpgrade?: (requiredTier: SubscriptionTier) => void
}

export function TemplateBrowser({
  isOpen,
  onClose,
  onSelectTemplate,
  onPreviewTemplate,
  userTier = 'free',
  onUpgrade
}: TemplateBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedTier, setSelectedTier] = useState<string>('all')

  const categories = [
    { id: 'all', name: 'All Templates', count: workflowTemplates.length },
    { id: 'mixed-format', name: 'Mixed Format', count: workflowTemplates.filter(t => t.category === 'mixed-format').length },
    { id: 'document-processing', name: 'Document Processing', count: workflowTemplates.filter(t => t.category === 'document-processing').length },
    { id: 'page-management', name: 'Page Management', count: workflowTemplates.filter(t => t.category === 'page-management').length },
    { id: 'conversion', name: 'Format Conversion', count: workflowTemplates.filter(t => t.category === 'conversion').length },
    { id: 'image-processing', name: 'Image Processing', count: workflowTemplates.filter(t => t.category === 'image-processing').length },
    { id: 'batch-operations', name: 'Batch Operations', count: workflowTemplates.filter(t => t.category === 'batch-operations').length },
    { id: 'business', name: 'Business', count: workflowTemplates.filter(t => t.category === 'business').length },
    { id: 'education', name: 'Education', count: workflowTemplates.filter(t => t.category === 'education').length },
    { id: 'advanced', name: 'Advanced', count: workflowTemplates.filter(t => t.category === 'advanced').length }
  ]

  const difficulties = [
    { id: 'all', name: 'All Levels' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' }
  ]

  const tiers = [
    { id: 'all', name: 'All Tiers', icon: null },
    { id: 'free', name: 'Free', icon: Tag },
    { id: 'pro', name: 'Professional', icon: Crown },
    { id: 'enterprise', name: 'Enterprise', icon: Zap }
  ]

  const filteredTemplates = workflowTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty
    const matchesTier = selectedTier === 'all' || template.tier === selectedTier

    return matchesSearch && matchesCategory && matchesDifficulty && matchesTier
  })

  const getDifficultyColor = (difficulty: WorkflowTemplate['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700'
      case 'advanced': return 'bg-red-100 text-red-700'
    }
  }

  const getCategoryIcon = (category: WorkflowTemplate['category']) => {
    switch (category) {
      case 'mixed-format': return '🔀'
      case 'document-processing': return '📄'
      case 'page-management': return '📋'
      case 'conversion': return '🔄'
      case 'image-processing': return '🖼️'
      case 'batch-operations': return '⚡'
      case 'business': return '💼'
      case 'education': return '🎓'
      case 'advanced': return '🔧'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workflow Templates</h2>
            <p className="text-gray-600">Choose from pre-built workflows to get started quickly</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Difficulty</h3>
              <div className="space-y-1">
                {difficulties.map(difficulty => (
                  <button
                    key={difficulty.id}
                    onClick={() => setSelectedDifficulty(difficulty.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedDifficulty === difficulty.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {difficulty.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Subscription Tier */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Subscription Tier</h3>
              <div className="space-y-1">
                {tiers.map(tier => {
                  const Icon = tier.icon
                  return (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedTier === tier.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {Icon && <Icon className="h-4 w-4 mr-2" />}
                      {tier.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span>Filtered by: {selectedCategory !== 'all' ? categories.find(c => c.id === selectedCategory)?.name : 'All'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => {
                const canAccess = canAccessTemplate(template.id, userTier)
                const upgradeMessage = getUpgradeMessage(template.id, userTier)
                const tierBadge = getTierBadgeProps(template.tier)

                return (
                  <div
                    key={template.id}
                    className={`bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow relative ${
                      canAccess ? 'border-gray-200' : 'border-gray-300 opacity-75'
                    }`}
                  >
                    {/* Tier Badge */}
                    <div className="absolute top-4 right-4">
                      <span
                        className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: tierBadge.bgColor,
                          color: tierBadge.color
                        }}
                      >
                        {template.tier === 'pro' && <Crown className="h-3 w-3 mr-1" />}
                        {template.tier === 'enterprise' && <Zap className="h-3 w-3 mr-1" />}
                        {tierBadge.text}
                      </span>
                    </div>

                    {/* Lock Overlay for Premium Templates */}
                    {!canAccess && (
                      <div className="absolute inset-0 bg-gray-50 bg-opacity-90 rounded-lg flex items-center justify-center">
                        <div className="text-center p-4">
                          <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-gray-700 mb-2">Premium Template</p>
                          <p className="text-xs text-gray-600 mb-3">{upgradeMessage}</p>
                          {onUpgrade && (
                            <button
                              onClick={() => onUpgrade(template.tier)}
                              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                            >
                              Upgrade Now
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900">{template.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(template.difficulty)}`}>
                              {template.difficulty}
                            </span>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {template.estimatedTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                  {/* Use Case */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-800">
                      <strong>Use Case:</strong> {template.useCase}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>{template.nodes.length} nodes</span>
                    <span>{template.edges.length} connections</span>
                  </div>

                  {/* Business Value (Pro/Enterprise only) */}
                  {template.businessValue && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-xs text-green-800">
                        <strong>Business Value:</strong> {template.businessValue}
                      </p>
                    </div>
                  )}

                  {/* Industry Focus */}
                  {template.industryFocus && template.industryFocus.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-1">Industry Focus:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.industryFocus.map(industry => (
                          <span
                            key={industry}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onPreviewTemplate(template)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={!canAccess}
                    >
                      <Eye className="h-4 w-4" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => canAccess ? onSelectTemplate(template) : onUpgrade?.(template.tier)}
                      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        canAccess
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canAccess ? (
                        <>
                          <Download className="h-4 w-4" />
                          <span>Use Template</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Upgrade Required</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
