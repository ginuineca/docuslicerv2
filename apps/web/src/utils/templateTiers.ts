export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export interface TemplateTier {
  tier: SubscriptionTier
  name: string
  description: string
  color: string
  badge: string
  features: string[]
  templateLimit?: number
  advancedFeatures: boolean
  customBranding: boolean
  prioritySupport: boolean
}

export const subscriptionTiers: Record<SubscriptionTier, TemplateTier> = {
  free: {
    tier: 'free',
    name: 'Free',
    description: 'Basic templates for personal use',
    color: '#6b7280',
    badge: 'FREE',
    features: [
      'Basic document processing',
      'Simple page management',
      'Standard conversions',
      'Up to 5 templates per month'
    ],
    templateLimit: 5,
    advancedFeatures: false,
    customBranding: false,
    prioritySupport: false
  },
  pro: {
    tier: 'pro',
    name: 'Professional',
    description: 'Advanced templates for business use',
    color: '#3b82f6',
    badge: 'PRO',
    features: [
      'All Free features',
      'Business workflows',
      'Advanced processing',
      'Batch operations',
      'Custom branding',
      'Unlimited templates'
    ],
    advancedFeatures: true,
    customBranding: true,
    prioritySupport: false
  },
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'Premium templates for large organizations',
    color: '#7c3aed',
    badge: 'ENTERPRISE',
    features: [
      'All Pro features',
      'Legal & compliance workflows',
      'Healthcare templates',
      'Financial services',
      'Custom integrations',
      'Priority support',
      'White-label options'
    ],
    advancedFeatures: true,
    customBranding: true,
    prioritySupport: true
  }
}

export const getRequiredTier = (templateId: string): SubscriptionTier => {
  // Define which templates require which tiers
  const tierMapping: Record<string, SubscriptionTier> = {
    // Free templates (basic operations)
    'simple-split': 'free',
    'single-page-extract': 'free',
    'remove-last-page': 'free',
    'merge-documents': 'free',
    'office-to-pdf': 'free',
    'image-to-pdf': 'free',
    'textbook-chapter': 'free',
    
    // Pro templates (business workflows)
    'odd-even-split': 'pro',
    'chapter-splitter': 'pro',
    'page-extraction': 'pro',
    'presentation-handouts': 'pro',
    'form-processor': 'pro',
    'invoice-processor': 'pro',
    'contract-processor': 'pro',
    'financial-report': 'pro',
    'exam-processor': 'pro',
    'assignment-compiler': 'pro',
    'pdf-to-office': 'pro',
    'ocr-processor': 'pro',
    'mixed-document-processor': 'pro',
    
    // Enterprise templates (advanced/specialized)
    'batch-processing': 'enterprise',
    'conditional-processing': 'enterprise',
    'legal-redaction': 'enterprise',
    'report-compiler': 'enterprise',
    'archive-organizer': 'enterprise',
    'universal-converter': 'enterprise',
    'smart-archive-processor': 'enterprise',
    'content-migration': 'enterprise'
  }
  
  return tierMapping[templateId] || 'free'
}

export const canAccessTemplate = (templateId: string, userTier: SubscriptionTier): boolean => {
  const requiredTier = getRequiredTier(templateId)
  
  const tierHierarchy: Record<SubscriptionTier, number> = {
    'free': 0,
    'pro': 1,
    'enterprise': 2
  }
  
  return tierHierarchy[userTier] >= tierHierarchy[requiredTier]
}

export const getTemplatesByTier = (tier: SubscriptionTier): string[] => {
  const allTemplates = [
    'simple-split', 'single-page-extract', 'remove-last-page', 'merge-documents',
    'office-to-pdf', 'image-to-pdf', 'textbook-chapter', 'odd-even-split',
    'chapter-splitter', 'page-extraction', 'presentation-handouts', 'form-processor',
    'invoice-processor', 'contract-processor', 'financial-report', 'exam-processor',
    'assignment-compiler', 'pdf-to-office', 'ocr-processor', 'mixed-document-processor',
    'batch-processing', 'conditional-processing', 'legal-redaction', 'report-compiler',
    'archive-organizer', 'universal-converter', 'smart-archive-processor', 'content-migration'
  ]
  
  return allTemplates.filter(templateId => canAccessTemplate(templateId, tier))
}

export const getUpgradeMessage = (templateId: string, userTier: SubscriptionTier): string | null => {
  const requiredTier = getRequiredTier(templateId)
  
  if (canAccessTemplate(templateId, userTier)) {
    return null
  }
  
  const tierInfo = subscriptionTiers[requiredTier]
  
  switch (requiredTier) {
    case 'pro':
      return `This template requires a Professional subscription. Upgrade to access advanced business workflows and unlimited templates.`
    case 'enterprise':
      return `This template requires an Enterprise subscription. Upgrade to access premium workflows for legal, healthcare, and financial services.`
    default:
      return `This template requires a ${tierInfo.name} subscription.`
  }
}

export const getTierBadgeProps = (tier: SubscriptionTier) => {
  const tierInfo = subscriptionTiers[tier]
  return {
    text: tierInfo.badge,
    color: tierInfo.color,
    bgColor: `${tierInfo.color}20`
  }
}
