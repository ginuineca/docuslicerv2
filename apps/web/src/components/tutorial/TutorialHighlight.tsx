import React, { useEffect, useState } from 'react'

interface TutorialHighlightProps {
  target?: string
  isActive: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function TutorialHighlight({ target, isActive, position = 'bottom' }: TutorialHighlightProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!target || !isActive) {
      setTargetElement(null)
      return
    }

    const element = document.querySelector(target) as HTMLElement
    if (element) {
      setTargetElement(element)
      
      // Calculate position for highlight
      const rect = element.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
      
      setHighlightStyle({
        position: 'absolute',
        top: rect.top + scrollTop - 4,
        left: rect.left + scrollLeft - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        border: '3px solid #3b82f6',
        borderRadius: '8px',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointerEvents: 'none',
        zIndex: 1000,
        animation: 'tutorialPulse 2s infinite'
      })

      // Add CSS animation if not already added
      if (!document.getElementById('tutorial-styles')) {
        const style = document.createElement('style')
        style.id = 'tutorial-styles'
        style.textContent = `
          @keyframes tutorialPulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          }
          
          .tutorial-spotlight {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            pointer-events: none;
            z-index: 999;
          }
        `
        document.head.appendChild(style)
      }

      // Scroll element into view
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
    }
  }, [target, isActive])

  if (!isActive || !targetElement) {
    return null
  }

  return (
    <>
      {/* Spotlight overlay */}
      <div className="tutorial-spotlight" />
      
      {/* Highlight border */}
      <div style={highlightStyle} />
    </>
  )
}

// Hook to manage tutorial highlighting
export function useTutorialHighlight() {
  const [activeTarget, setActiveTarget] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(false)

  const highlightElement = (target: string) => {
    setActiveTarget(target)
    setIsActive(true)
  }

  const clearHighlight = () => {
    setActiveTarget(null)
    setIsActive(false)
  }

  return {
    activeTarget,
    isActive,
    highlightElement,
    clearHighlight,
    TutorialHighlight: (props: Omit<TutorialHighlightProps, 'target' | 'isActive'>) => (
      <TutorialHighlight
        {...props}
        target={activeTarget || undefined}
        isActive={isActive}
      />
    )
  }
}
