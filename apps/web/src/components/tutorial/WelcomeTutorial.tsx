import React, { useState, useEffect } from 'react'
import { BookOpen, X, Play, ChevronRight } from 'lucide-react'

interface WelcomeTutorialProps {
  onStartTutorial: () => void
  onDismiss: () => void
}

export function WelcomeTutorial({ onStartTutorial, onDismiss }: WelcomeTutorialProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has seen the welcome tutorial
    const hasSeenWelcome = localStorage.getItem('docuslicer-welcome-tutorial-seen')
    if (!hasSeenWelcome) {
      // Show after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleStartTutorial = () => {
    localStorage.setItem('docuslicer-welcome-tutorial-seen', 'true')
    setIsVisible(false)
    onStartTutorial()
  }

  const handleDismiss = () => {
    localStorage.setItem('docuslicer-welcome-tutorial-seen', 'true')
    setIsVisible(false)
    onDismiss()
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6" />
              <h2 className="text-lg font-semibold">Welcome to DocuSlicer!</h2>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to automate your PDF workflows?
            </h3>
            <p className="text-gray-600">
              Learn how to create powerful PDF processing workflows with our interactive tutorial.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">You'll learn how to:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Create and connect workflow nodes</li>
              <li>• Upload and process PDF files</li>
              <li>• Configure processing steps</li>
              <li>• Save and reuse workflows</li>
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleStartTutorial}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Tutorial
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
