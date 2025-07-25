import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  interactive?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: string
    type: 'increase' | 'decrease' | 'neutral'
  }
  icon?: LucideIcon
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

interface ActionCardProps {
  title: string
  description: string
  icon: LucideIcon
  onClick?: () => void
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  disabled?: boolean
}

interface FeatureCardProps {
  title: string
  description: string
  icon: LucideIcon
  badge?: string
  onClick?: () => void
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
    accent: 'bg-blue-600'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
    accent: 'bg-green-600'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
    accent: 'bg-purple-600'
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    border: 'border-orange-200',
    accent: 'bg-orange-600'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
    accent: 'bg-red-600'
  }
}

export function Card({ 
  children, 
  className = '', 
  hover = false, 
  interactive = false,
  padding = 'md'
}: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div className={`
      card ${paddingClasses[padding]}
      ${hover ? 'card-hover' : ''}
      ${interactive ? 'card-interactive' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue' 
}: StatsCardProps) {
  const colors = colorClasses[color]
  
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                change.type === 'increase' ? 'text-green-600' : 
                change.type === 'decrease' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {change.type === 'increase' ? '↗' : change.type === 'decrease' ? '↘' : '→'} {change.value}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colors.bg}`}>
            <Icon className={`h-6 w-6 ${colors.icon}`} />
          </div>
        )}
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${colors.accent}`} />
    </Card>
  )
}

export function ActionCard({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  color = 'blue',
  disabled = false 
}: ActionCardProps) {
  const colors = colorClasses[color]
  
  return (
    <Card 
      interactive={!disabled} 
      className={`group ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-start space-x-4">
        <div className={`
          flex-shrink-0 p-3 rounded-xl transition-colors duration-200
          ${colors.bg} group-hover:${colors.accent} group-hover:text-white
        `}>
          <Icon className={`h-6 w-6 ${colors.icon} group-hover:text-white transition-colors duration-200`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-800">
            {title}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Card>
  )
}

export function FeatureCard({ 
  title, 
  description, 
  icon: Icon, 
  badge, 
  onClick 
}: FeatureCardProps) {
  return (
    <Card 
      interactive={!!onClick} 
      className="group relative"
      onClick={onClick}
    >
      {badge && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {badge}
          </span>
        </div>
      )}
      
      <div className="flex flex-col items-center text-center">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 mb-4 group-hover:from-primary-100 group-hover:to-primary-200 transition-all duration-200">
          <Icon className="h-8 w-8 text-primary-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </Card>
  )
}
