import React from 'react'
import { X, Check, Crown, Zap, Star } from 'lucide-react'
import { SubscriptionTier, subscriptionTiers } from '../../utils/templateTiers'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  requiredTier: SubscriptionTier
  currentTier: SubscriptionTier
  onUpgrade: (tier: SubscriptionTier) => void
}

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  requiredTier, 
  currentTier, 
  onUpgrade 
}: UpgradeModalProps) {
  if (!isOpen) return null

  const requiredTierInfo = subscriptionTiers[requiredTier]
  const currentTierInfo = subscriptionTiers[currentTier]

  const pricingPlans = [
    {
      tier: 'pro' as SubscriptionTier,
      name: 'Professional',
      price: '$19',
      period: 'month',
      description: 'Perfect for small businesses and professionals',
      icon: Crown,
      color: 'blue',
      popular: true,
      features: [
        'All Free features',
        'Advanced business workflows',
        'Unlimited templates',
        'Custom branding',
        'Priority email support',
        'Advanced OCR capabilities',
        'Batch processing',
        'Export to multiple formats'
      ]
    },
    {
      tier: 'enterprise' as SubscriptionTier,
      name: 'Enterprise',
      price: '$49',
      period: 'month',
      description: 'For large organizations with advanced needs',
      icon: Zap,
      color: 'purple',
      popular: false,
      features: [
        'All Professional features',
        'Legal & compliance workflows',
        'Healthcare templates',
        'Financial services workflows',
        'White-label options',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        'Advanced security features',
        'Audit trails'
      ]
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
            <p className="text-gray-600 mt-1">
              Unlock premium templates and advanced features
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Required Tier Notice */}
        <div className="p-6 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {requiredTier === 'pro' ? (
                <Crown className="h-6 w-6 text-blue-600" />
              ) : (
                <Zap className="h-6 w-6 text-purple-600" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {requiredTierInfo.name} Plan Required
              </h3>
              <p className="text-sm text-gray-600">
                This template requires a {requiredTierInfo.name} subscription to access advanced features.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pricingPlans.map(plan => {
              const Icon = plan.icon
              const isRecommended = plan.tier === requiredTier
              const canUpgrade = plan.tier !== currentTier
              
              return (
                <div
                  key={plan.tier}
                  className={`relative rounded-lg border-2 p-6 ${
                    isRecommended
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute -top-3 right-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-600 text-white">
                        Recommended
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <Icon className={`h-8 w-8 mx-auto mb-3 ${
                      plan.color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                    }`} />
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">/{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => canUpgrade ? onUpgrade(plan.tier) : undefined}
                    disabled={!canUpgrade}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      canUpgrade
                        ? isRecommended
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {canUpgrade 
                      ? `Upgrade to ${plan.name}`
                      : plan.tier === currentTier 
                        ? 'Current Plan'
                        : 'Downgrade'
                    }
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>✨ 30-day money-back guarantee</p>
              <p>🔒 Cancel anytime, no questions asked</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Need help choosing?</p>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
