import React, { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Play, BookOpen, Lightbulb } from 'lucide-react'

export interface TutorialStep {
  id: string
  title: string
  description: string
  target?: string // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: 'click' | 'drag' | 'hover' | 'type'
  content?: React.ReactNode
  image?: string
  video?: string
}

export interface Tutorial {
  id: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  steps: TutorialStep[]
  category: 'basics' | 'workflows' | 'advanced'
}

interface TutorialOverlayProps {
  tutorial: Tutorial
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function TutorialOverlay({ tutorial, isOpen, onClose, onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setIsPlaying(false)
    }
  }, [isOpen, tutorial.id])

  const nextStep = () => {
    if (currentStep < tutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const startTutorial = () => {
    setIsPlaying(true)
    setCurrentStep(0)
  }

  if (!isOpen) return null

  const step = tutorial.steps[currentStep]
  const progress = ((currentStep + 1) / tutorial.steps.length) * 100

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{tutorial.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  tutorial.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                  tutorial.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {tutorial.difficulty}
                </span>
                <span>{tutorial.duration}</span>
                <span>{tutorial.steps.length} steps</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep + 1} of {tutorial.steps.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {!isPlaying ? (
            // Tutorial Overview
            <div className="text-center">
              <div className="mb-6">
                <Lightbulb className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Learn?</h3>
                <p className="text-gray-600">{tutorial.description}</p>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 mb-2">What you'll learn:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  {tutorial.steps.slice(0, 3).map((step, index) => (
                    <li key={index}>• {step.title}</li>
                  ))}
                  {tutorial.steps.length > 3 && (
                    <li>• And {tutorial.steps.length - 3} more steps...</li>
                  )}
                </ul>
              </div>

              <button
                onClick={startTutorial}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Tutorial
              </button>
            </div>
          ) : (
            // Tutorial Step
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>

              {step.content && (
                <div className="mb-4">
                  {step.content}
                </div>
              )}

              {step.image && (
                <div className="mb-4">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {step.action && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <Lightbulb className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800">
                      Action Required: {step.action === 'click' ? 'Click' : 
                                      step.action === 'drag' ? 'Drag' :
                                      step.action === 'hover' ? 'Hover over' :
                                      'Type in'} the highlighted element
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isPlaying && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>

            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Skip Tutorial
              </button>
              <button
                onClick={nextStep}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {currentStep === tutorial.steps.length - 1 ? 'Complete' : 'Next'}
                {currentStep < tutorial.steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
