import { ReactNode, ButtonHTMLAttributes } from 'react'
import { LucideIcon } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
}

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md'
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'btn'
  const variantClasses = variants[variant]
  const sizeClasses = sizes[size]
  const widthClasses = fullWidth ? 'w-full' : ''
  
  const isDisabled = disabled || loading

  return (
    <button
      className={`
        ${baseClasses} ${variantClasses} ${sizeClasses} ${widthClasses}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          Loading...
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-2">
          {Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
        </div>
      )}
    </button>
  )
}

// Specialized button components
interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: LucideIcon
  'aria-label': string
}

export function IconButton({ 
  icon: Icon, 
  size = 'md', 
  variant = 'ghost',
  className = '',
  ...props 
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  }

  return (
    <button
      className={`
        btn ${variants[variant]} ${sizeClasses[size]} rounded-lg
        ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      <Icon className={`h-${size === 'sm' ? '4' : size === 'md' ? '5' : '6'} w-${size === 'sm' ? '4' : size === 'md' ? '5' : '6'}`} />
    </button>
  )
}

interface FloatingActionButtonProps extends Omit<ButtonProps, 'children' | 'variant'> {
  icon: LucideIcon
  'aria-label': string
}

export function FloatingActionButton({ 
  icon: Icon, 
  className = '',
  ...props 
}: FloatingActionButtonProps) {
  return (
    <button
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 bg-primary-600 text-white rounded-full shadow-large hover:shadow-glow
        flex items-center justify-center
        hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        transition-all duration-200 hover:scale-105
        ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      {...props}
    >
      <Icon className="h-6 w-6" />
    </button>
  )
}

// Button group component
interface ButtonGroupProps {
  children: ReactNode
  className?: string
}

export function ButtonGroup({ children, className = '' }: ButtonGroupProps) {
  return (
    <div className={`inline-flex rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  )
}
