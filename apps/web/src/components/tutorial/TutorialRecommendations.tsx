import React, { useState, useEffect } from 'react'
import { Lightbulb, TrendingUp, Clock, Star, ChevronRight, X } from 'lucide-react'
import { Tutorial } from './TutorialOverlay'
import { workflowTutorials } from './tutorials/workflowTutorials'

interface UserActivity {
  tutorialsCompleted: string[]
  workflowsCreated: number
  lastActiveDate: Date
  strugglingAreas: string[]
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced'
  timeSpentLearning: number
}

interface TutorialRecommendation {
  tutorial: Tutorial
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedValue: number
}

interface TutorialRecommendationsProps {
  userActivity: UserActivity
  onSelectTutorial: (tutorial: Tutorial) => void
  onDismiss: () => void
}

export function TutorialRecommendations({ 
  userActivity, 
  onSelectTutorial, 
  onDismiss 
}: TutorialRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<TutorialRecommendation[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const generateRecommendations = () => {
      const recs: TutorialRecommendation[] = []

      // Get uncompleted tutorials
      const uncompletedTutorials = workflowTutorials.filter(
        tutorial => !userActivity.tutorialsCompleted.includes(tutorial.id)
      )

      // Recommendation logic
      uncompletedTutorials.forEach(tutorial => {
        let priority: 'high' | 'medium' | 'low' = 'low'
        let reason = ''
        let estimatedValue = 0

        // Beginner recommendations
        if (userActivity.tutorialsCompleted.length === 0) {
          if (tutorial.difficulty === 'beginner') {
            priority = 'high'
            reason = 'Perfect for getting started with workflows'
            estimatedValue = 90
          }
        }

        // Progressive difficulty
        else if (userActivity.tutorialsCompleted.length < 3) {
          if (tutorial.difficulty === 'beginner' || tutorial.difficulty === 'intermediate') {
            priority = 'high'
            reason = 'Build on your existing knowledge'
            estimatedValue = 85
          }
        }

        // Advanced users
        else if (userActivity.tutorialsCompleted.length >= 3) {
          if (tutorial.difficulty === 'advanced') {
            priority = 'high'
            reason = 'Challenge yourself with advanced techniques'
            estimatedValue = 95
          }
        }

        // Struggling areas
        if (userActivity.strugglingAreas.includes(tutorial.category)) {
          priority = 'high'
          reason = 'Helps with areas you\'ve found challenging'
          estimatedValue += 20
        }

        // Time-based recommendations
        const daysSinceActive = Math.floor(
          (Date.now() - userActivity.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        if (daysSinceActive > 7) {
          if (tutorial.difficulty === 'beginner') {
            priority = 'medium'
            reason = 'Great refresher after time away'
            estimatedValue += 15
          }
        }

        // Workflow creation correlation
        if (userActivity.workflowsCreated === 0 && tutorial.category === 'workflows') {
          priority = 'high'
          reason = 'Learn to create your first workflow'
          estimatedValue += 25
        }

        if (estimatedValue > 0) {
          recs.push({
            tutorial,
            reason,
            priority,
            estimatedValue
          })
        }
      })

      // Sort by estimated value and limit to top 3
      const sortedRecs = recs
        .sort((a, b) => b.estimatedValue - a.estimatedValue)
        .slice(0, 3)

      setRecommendations(sortedRecs)
      
      // Show recommendations if there are any
      if (sortedRecs.length > 0) {
        setIsVisible(true)
      }
    }

    generateRecommendations()
  }, [userActivity])

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
    }
  }

  const getDifficultyColor = (difficulty: Tutorial['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700'
      case 'advanced': return 'bg-red-100 text-red-700'
    }
  }

  if (!isVisible || recommendations.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <h3 className="font-semibold">Recommended for You</h3>
            </div>
            <button
              onClick={() => {
                setIsVisible(false)
                onDismiss()
              }}
              className="text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            Personalized tutorials based on your progress
          </p>
        </div>

        {/* Recommendations */}
        <div className="p-4 space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={rec.tutorial.id}
              className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectTutorial(rec.tutorial)}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm">
                  {rec.tutorial.title}
                </h4>
                <div className="flex items-center space-x-1">
                  <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(rec.priority)}`}>
                    {rec.priority}
                  </span>
                  {index === 0 && (
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-2">{rec.reason}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(rec.tutorial.difficulty)}`}>
                    {rec.tutorial.difficulty}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {rec.tutorial.duration}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < Math.floor(rec.estimatedValue / 20)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <ChevronRight className="h-3 w-3 text-gray-400" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => {
              setIsVisible(false)
              onDismiss()
            }}
            className="text-xs text-gray-600 hover:text-gray-800"
          >
            View all tutorials →
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing tutorial recommendations
export function useTutorialRecommendations() {
  const [userActivity, setUserActivity] = useState<UserActivity>({
    tutorialsCompleted: [],
    workflowsCreated: 0,
    lastActiveDate: new Date(),
    strugglingAreas: [],
    preferredDifficulty: 'beginner',
    timeSpentLearning: 0
  })

  const updateActivity = (updates: Partial<UserActivity>) => {
    setUserActivity(prev => ({ ...prev, ...updates }))
  }

  const trackTutorialCompletion = (tutorialId: string) => {
    setUserActivity(prev => ({
      ...prev,
      tutorialsCompleted: [...prev.tutorialsCompleted, tutorialId],
      lastActiveDate: new Date()
    }))
  }

  const trackWorkflowCreation = () => {
    setUserActivity(prev => ({
      ...prev,
      workflowsCreated: prev.workflowsCreated + 1,
      lastActiveDate: new Date()
    }))
  }

  const addStrugglingArea = (area: string) => {
    setUserActivity(prev => ({
      ...prev,
      strugglingAreas: [...new Set([...prev.strugglingAreas, area])]
    }))
  }

  return {
    userActivity,
    updateActivity,
    trackTutorialCompletion,
    trackWorkflowCreation,
    addStrugglingArea
  }
}
