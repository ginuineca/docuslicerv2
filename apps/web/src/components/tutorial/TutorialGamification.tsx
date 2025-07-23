import React, { useState, useEffect } from 'react'
import { Trophy, Star, Target, Zap, Award, Medal, Crown, Gift } from 'lucide-react'

export interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  category: 'tutorial' | 'workflow' | 'mastery' | 'special'
  points: number
  unlocked: boolean
  unlockedAt?: Date
  progress?: number
  maxProgress?: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface UserProgress {
  level: number
  totalPoints: number
  currentLevelPoints: number
  nextLevelPoints: number
  achievements: Achievement[]
  streakDays: number
  tutorialsCompleted: number
  workflowsCreated: number
  filesProcessed: number
}

interface TutorialGamificationProps {
  isOpen: boolean
  onClose: () => void
  userProgress: UserProgress
  onAchievementUnlock: (achievement: Achievement) => void
}

const achievementsList: Achievement[] = [
  {
    id: 'first-tutorial',
    title: 'Getting Started',
    description: 'Complete your first tutorial',
    icon: Star,
    category: 'tutorial',
    points: 100,
    unlocked: false,
    rarity: 'common'
  },
  {
    id: 'tutorial-master',
    title: 'Tutorial Master',
    description: 'Complete all available tutorials',
    icon: Crown,
    category: 'tutorial',
    points: 500,
    unlocked: false,
    rarity: 'epic'
  },
  {
    id: 'first-workflow',
    title: 'Workflow Creator',
    description: 'Create and save your first workflow',
    icon: Target,
    category: 'workflow',
    points: 150,
    unlocked: false,
    rarity: 'common'
  },
  {
    id: 'workflow-expert',
    title: 'Workflow Expert',
    description: 'Create 10 different workflows',
    icon: Trophy,
    category: 'workflow',
    points: 300,
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    rarity: 'rare'
  },
  {
    id: 'speed-runner',
    title: 'Speed Runner',
    description: 'Complete a tutorial in under 2 minutes',
    icon: Zap,
    category: 'special',
    points: 200,
    unlocked: false,
    rarity: 'rare'
  },
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Complete all tutorial steps without skipping',
    icon: Medal,
    category: 'mastery',
    points: 250,
    unlocked: false,
    rarity: 'rare'
  },
  {
    id: 'file-processor',
    title: 'File Processor',
    description: 'Process 100 PDF files through workflows',
    icon: Gift,
    category: 'workflow',
    points: 400,
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    rarity: 'epic'
  }
]

export function TutorialGamification({ 
  isOpen, 
  onClose, 
  userProgress, 
  onAchievementUnlock 
}: TutorialGamificationProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)

  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'tutorial', name: 'Tutorials', icon: Star },
    { id: 'workflow', name: 'Workflows', icon: Target },
    { id: 'mastery', name: 'Mastery', icon: Crown },
    { id: 'special', name: 'Special', icon: Zap }
  ]

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100'
      case 'rare': return 'text-blue-600 bg-blue-100'
      case 'epic': return 'text-purple-600 bg-purple-100'
      case 'legendary': return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getRarityBorder = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-200'
      case 'rare': return 'border-blue-200'
      case 'epic': return 'border-purple-200'
      case 'legendary': return 'border-yellow-200'
    }
  }

  const filteredAchievements = achievementsList.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) return false
    if (showUnlockedOnly && !achievement.unlocked) return false
    return true
  })

  const levelProgress = (userProgress.currentLevelPoints / userProgress.nextLevelPoints) * 100

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Progress</h2>
              <p className="text-purple-100">Level {userProgress.level} • {userProgress.totalPoints} points</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>

          {/* Level Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Level {userProgress.level}</span>
              <span>Level {userProgress.level + 1}</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <div className="text-center text-sm mt-1 text-purple-100">
              {userProgress.currentLevelPoints} / {userProgress.nextLevelPoints} XP
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{userProgress.tutorialsCompleted}</div>
            <div className="text-sm text-gray-600">Tutorials</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{userProgress.workflowsCreated}</div>
            <div className="text-sm text-gray-600">Workflows</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{userProgress.filesProcessed}</div>
            <div className="text-sm text-gray-600">Files Processed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{userProgress.streakDays}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {categories.map(category => {
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{category.name}</span>
                  </button>
                )
              })}
            </div>
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showUnlockedOnly}
                onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Unlocked only</span>
            </label>
          </div>
        </div>

        {/* Achievements */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.map(achievement => {
              const Icon = achievement.icon
              const isUnlocked = achievement.unlocked
              
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isUnlocked 
                      ? `${getRarityBorder(achievement.rarity)} bg-white shadow-md` 
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isUnlocked ? getRarityColor(achievement.rarity) : 'bg-gray-200 text-gray-400'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                          {achievement.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRarityColor(achievement.rarity)}`}>
                            {achievement.rarity}
                          </span>
                          <span className="text-sm font-medium text-gray-600">
                            {achievement.points} XP
                          </span>
                        </div>
                      </div>
                      <p className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                        {achievement.description}
                      </p>
                      
                      {achievement.progress !== undefined && achievement.maxProgress && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{achievement.progress} / {achievement.maxProgress}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {isUnlocked && achievement.unlockedAt && (
                        <div className="mt-2 text-xs text-green-600">
                          Unlocked {achievement.unlockedAt.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
