import React, { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Target, Zap, Award, Play } from 'lucide-react'

interface TourStep {
  id: string
  title: string
  description: string
  target: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: 'click' | 'drag' | 'hover' | 'type' | 'wait'
  waitForAction?: boolean
  highlight?: boolean
  pulse?: boolean
  arrow?: boolean
  content?: React.ReactNode
  validation?: () => boolean
  onComplete?: () => void
}

interface InteractiveTourProps {
  steps: TourStep[]
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
  title: string
  description: string
}

export function InteractiveTour({ 
  steps, 
  isActive, 
  onComplete, 
  onSkip, 
  title, 
  description 
}: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isWaitingForAction, setIsWaitingForAction] = useState(false)
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = steps[currentStep]

  useEffect(() => {
    if (!isActive || !step) return

    const targetElement = document.querySelector(step.target) as HTMLElement
    if (!targetElement) return

    // Calculate tooltip position
    const rect = targetElement.getBoundingClientRect()
    const scrollTop = window.pageYOffset
    const scrollLeft = window.pageXOffset

    let x = 0, y = 0

    switch (step.position) {
      case 'top':
        x = rect.left + scrollLeft + rect.width / 2
        y = rect.top + scrollTop - 10
        break
      case 'bottom':
        x = rect.left + scrollLeft + rect.width / 2
        y = rect.bottom + scrollTop + 10
        break
      case 'left':
        x = rect.left + scrollLeft - 10
        y = rect.top + scrollTop + rect.height / 2
        break
      case 'right':
        x = rect.right + scrollLeft + 10
        y = rect.top + scrollTop + rect.height / 2
        break
      case 'center':
        x = window.innerWidth / 2
        y = window.innerHeight / 2
        break
    }

    setTooltipPosition({ x, y })

    // Scroll to element
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    })

    // Add highlight class
    if (step.highlight) {
      targetElement.classList.add('tour-highlight')
    }

    // Add pulse effect
    if (step.pulse) {
      targetElement.classList.add('tour-pulse')
    }

    // Set up action waiting
    if (step.waitForAction && step.action) {
      setIsWaitingForAction(true)
      setupActionListener(targetElement, step)
    }

    return () => {
      targetElement.classList.remove('tour-highlight', 'tour-pulse')
    }
  }, [currentStep, isActive, step])

  const setupActionListener = (element: HTMLElement, step: TourStep) => {
    const handleAction = () => {
      if (step.validation && !step.validation()) return

      setIsWaitingForAction(false)
      setCompletedActions(prev => new Set([...prev, step.id]))
      
      if (step.onComplete) {
        step.onComplete()
      }

      // Auto-advance after action
      setTimeout(() => {
        nextStep()
      }, 1000)
    }

    switch (step.action) {
      case 'click':
        element.addEventListener('click', handleAction, { once: true })
        break
      case 'hover':
        element.addEventListener('mouseenter', handleAction, { once: true })
        break
      case 'drag':
        element.addEventListener('dragstart', handleAction, { once: true })
        break
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      setIsWaitingForAction(false)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setIsWaitingForAction(false)
    }
  }

  if (!isActive || !step) return null

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 pointer-events-none">
        {/* Spotlight effect */}
        <div className="absolute inset-0">
          {step.target && (
            <style>
              {`
                .tour-spotlight {
                  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
                  position: relative;
                  z-index: 51;
                }
                .tour-highlight {
                  position: relative;
                  z-index: 52;
                  box-shadow: 0 0 0 4px #3b82f6, 0 0 20px rgba(59, 130, 246, 0.5);
                  border-radius: 8px;
                }
                .tour-pulse {
                  animation: tourPulse 2s infinite;
                }
                @keyframes tourPulse {
                  0% { transform: scale(1); }
                  50% { transform: scale(1.05); }
                  100% { transform: scale(1); }
                }
              `}
            </style>
          )}
        </div>
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-60 pointer-events-auto"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
          transform: step.position === 'center' ? 'translate(-50%, -50%)' : 
                    step.position === 'top' ? 'translate(-50%, -100%)' :
                    step.position === 'bottom' ? 'translate(-50%, 0)' :
                    step.position === 'left' ? 'translate(-100%, -50%)' :
                    'translate(0, -50%)'
        }}
      >
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              {completedActions.has(step.id) && (
                <Award className="h-4 w-4 text-green-500" />
              )}
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress */}
          <div className="px-4 py-2 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>{title}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{step.description}</p>

            {step.content && (
              <div className="mb-3">
                {step.content}
              </div>
            )}

            {step.action && (
              <div className={`flex items-center space-x-2 p-3 rounded-lg mb-3 ${
                isWaitingForAction ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
              }`}>
                <div className={`h-2 w-2 rounded-full ${
                  isWaitingForAction ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                }`} />
                <span className={`text-sm font-medium ${
                  isWaitingForAction ? 'text-yellow-800' : 'text-green-800'
                }`}>
                  {isWaitingForAction ? `${step.action} the highlighted element` : 'Action completed!'}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>

            <div className="flex space-x-2">
              <button
                onClick={onSkip}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                Skip Tour
              </button>
              <button
                onClick={nextStep}
                disabled={isWaitingForAction}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
                {currentStep < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Arrow pointer */}
        {step.arrow && step.position !== 'center' && (
          <div className={`absolute w-3 h-3 bg-white border transform rotate-45 ${
            step.position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-t-0 border-l-0' :
            step.position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-b-0 border-r-0' :
            step.position === 'left' ? 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-t-0 border-r-0' :
            'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-b-0 border-l-0'
          }`} />
        )}
      </div>
    </>
  )
}
