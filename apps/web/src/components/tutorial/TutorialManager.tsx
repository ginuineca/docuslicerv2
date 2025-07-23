import React, { useState } from 'react'
import { BookOpen, Play, Clock, Star, ChevronRight, X, Trophy, Target, Zap, Award } from 'lucide-react'
import { TutorialOverlay, Tutorial } from './TutorialOverlay'
import { TutorialGamification, UserProgress } from './TutorialGamification'
import { InteractiveTour } from './InteractiveTour'
import { workflowTutorials } from './tutorials/workflowTutorials'

interface TutorialManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function TutorialManager({ isOpen, onClose }: TutorialManagerProps) {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([])
  const [showGamification, setShowGamification] = useState(false)
  const [userProgress, setUserProgress] = useState<UserProgress>({
    level: 1,
    totalPoints: 0,
    currentLevelPoints: 0,
    nextLevelPoints: 1000,
    achievements: [],
    streakDays: 0,
    tutorialsCompleted: 0,
    workflowsCreated: 0,
    filesProcessed: 0
  })

  const handleTutorialComplete = (tutorialId: string) => {
    setCompletedTutorials(prev => [...prev, tutorialId])
    setSelectedTutorial(null)

    // Update user progress
    const tutorial = workflowTutorials.find(t => t.id === tutorialId)
    if (tutorial) {
      const points = tutorial.difficulty === 'beginner' ? 100 :
                   tutorial.difficulty === 'intermediate' ? 200 : 300

      setUserProgress(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + points,
        currentLevelPoints: prev.currentLevelPoints + points,
        tutorialsCompleted: prev.tutorialsCompleted + 1
      }))
    }
  }

  const categories = {
    basics: 'Getting Started',
    workflows: 'Workflow Creation',
    advanced: 'Advanced Features'
  }

  const getDifficultyColor = (difficulty: Tutorial['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700'
      case 'advanced': return 'bg-red-100 text-red-700'
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Workflow Tutorials</h2>
                <p className="text-gray-600">Learn how to create powerful PDF workflows</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowGamification(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Trophy className="h-4 w-4" />
                <span>Progress</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {Object.entries(categories).map(([categoryKey, categoryName]) => {
              const categoryTutorials = workflowTutorials.filter(t => t.category === categoryKey)
              
              if (categoryTutorials.length === 0) return null

              return (
                <div key={categoryKey} className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{categoryName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryTutorials.map((tutorial) => {
                      const isCompleted = completedTutorials.includes(tutorial.id)
                      
                      return (
                        <div
                          key={tutorial.id}
                          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedTutorial(tutorial)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-lg font-medium text-gray-900">{tutorial.title}</h4>
                            {isCompleted && (
                              <div className="flex items-center text-green-600">
                                <Star className="h-4 w-4 fill-current" />
                              </div>
                            )}
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {tutorial.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tutorial.difficulty)}`}>
                                {tutorial.difficulty}
                              </span>
                              <div className="flex items-center text-gray-500 text-sm">
                                <Clock className="h-4 w-4 mr-1" />
                                {tutorial.duration}
                              </div>
                            </div>
                            
                            <button className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                              <Play className="h-4 w-4 mr-1" />
                              Start
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </button>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                              {tutorial.steps.length} steps • {isCompleted ? 'Completed' : 'Not started'}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Quick Start Section */}
            <div className="bg-blue-50 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">New to DocuSlicer?</h3>
              <p className="text-blue-800 mb-4">
                Start with our beginner-friendly tutorial to learn the basics of creating workflows.
              </p>
              <button
                onClick={() => setSelectedTutorial(workflowTutorials.find(t => t.id === 'basic-workflow') || null)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Play className="h-4 w-4 mr-2" />
                Start with Basics
              </button>
            </div>

            {/* Progress Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {completedTutorials.length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {workflowTutorials.length - completedTutorials.length}
                  </div>
                  <div className="text-sm text-gray-600">Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((completedTutorials.length / workflowTutorials.length) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Overlay */}
      {selectedTutorial && (
        <TutorialOverlay
          tutorial={selectedTutorial}
          isOpen={!!selectedTutorial}
          onClose={() => setSelectedTutorial(null)}
          onComplete={() => handleTutorialComplete(selectedTutorial.id)}
        />
      )}

      {/* Gamification Panel */}
      {showGamification && (
        <TutorialGamification
          isOpen={showGamification}
          onClose={() => setShowGamification(false)}
          userProgress={userProgress}
          onAchievementUnlock={(achievement) => {
            console.log('Achievement unlocked:', achievement)
          }}
        />
      )}
    </>
  )
}
