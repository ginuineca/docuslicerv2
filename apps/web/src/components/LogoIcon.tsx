import React from 'react'

interface LogoIconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function LogoIcon({ className = '', size = 'md' }: LogoIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  return (
    <svg 
      className={`${sizeClasses[size]} text-blue-600 ${className}`}
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Document shape with rounded corners */}
      <rect 
        x="20" 
        y="15" 
        width="60" 
        height="70" 
        rx="8" 
        ry="8" 
        fill="currentColor"
      />
      
      {/* Document lines */}
      <rect x="30" y="30" width="25" height="2" rx="1" fill="white" />
      <rect x="30" y="38" width="30" height="2" rx="1" fill="white" />
      <rect x="30" y="46" width="20" height="2" rx="1" fill="white" />
      
      {/* Folded corner */}
      <path 
        d="M65 15 L80 30 L65 30 Z" 
        fill="white" 
        fillOpacity="0.3"
      />
      
      {/* Slice line - diagonal cut through document */}
      <path 
        d="M25 25 L75 75" 
        stroke="white" 
        strokeWidth="4" 
        strokeLinecap="round"
      />
      
      {/* Second slice line for emphasis */}
      <path 
        d="M30 20 L80 70" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeOpacity="0.7"
      />
    </svg>
  )
}
