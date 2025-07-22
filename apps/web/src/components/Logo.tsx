import React from 'react'
import { Link } from 'react-router-dom'

interface LogoProps {
  className?: string
  showText?: boolean
  linkTo?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ 
  className = '', 
  showText = true, 
  linkTo = '/',
  size = 'md' 
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-20 w-20'
  }
  
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  const LogoSvg = () => (
    <svg
      className={`${sizeClasses[size]} text-blue-600`}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main document shape */}
      <path
        d="M25 20 L25 95 Q25 100 30 100 L90 100 Q95 100 95 95 L95 35 L80 20 Z"
        fill="currentColor"
      />

      {/* Folded corner */}
      <path
        d="M80 20 L95 35 L80 35 Z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      <path
        d="M80 20 L95 35 L80 35 Z"
        fill="white"
        fillOpacity="0.2"
      />

      {/* Document content lines */}
      <rect x="35" y="35" width="35" height="2.5" rx="1.25" fill="white" fillOpacity="0.9" />
      <rect x="35" y="45" width="45" height="2.5" rx="1.25" fill="white" fillOpacity="0.9" />
      <rect x="35" y="55" width="30" height="2.5" rx="1.25" fill="white" fillOpacity="0.9" />

      {/* Main slice line - diagonal cut */}
      <path
        d="M30 30 L85 85"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeOpacity="0.95"
      />

      {/* Secondary slice line for depth */}
      <path
        d="M35 25 L90 80"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />

      {/* Subtle gradient effect overlay */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path
        d="M25 20 L25 95 Q25 100 30 100 L90 100 Q95 100 95 95 L95 35 L80 20 Z"
        fill="url(#logoGradient)"
      />
    </svg>
  )

  const content = (
    <div className={`flex items-center ${className}`}>
      {/* Option 1: Use the new uploaded SVG file */}
      <img
        src="/logo.svg"
        alt="DocuSlicer Logo"
        className={`${sizeClasses[size]} object-contain min-w-0`}
        style={{ minHeight: size === 'sm' ? '40px' : size === 'md' ? '64px' : '80px' }}
      />

      {/* Option 2: Fallback to component SVG if file not found */}
      {/* <LogoSvg /> */}

      {showText && (
        <span className={`ml-2 ${textSizeClasses[size]} font-bold text-gray-900`}>
          DocuSlicer
        </span>
      )}
    </div>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="flex items-center hover:opacity-80 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}
