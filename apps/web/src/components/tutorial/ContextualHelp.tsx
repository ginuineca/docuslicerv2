import React, { useState, useEffect, useRef } from 'react'
import { HelpCircle, X, Lightbulb, Video, FileText, ExternalLink } from 'lucide-react'

interface HelpContent {
  id: string
  title: string
  description: string
  tips?: string[]
  shortcuts?: { key: string; description: string }[]
  relatedTutorials?: string[]
  videoUrl?: string
  docsUrl?: string
}

interface ContextualHelpProps {
  target: string
  content: HelpContent
  trigger?: 'hover' | 'click' | 'focus'
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function ContextualHelp({ 
  target, 
  content, 
  trigger = 'hover', 
  position = 'top',
  delay = 500 
}: ContextualHelpProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef<NodeJS.Timeout>()
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const targetElement = document.querySelector(target) as HTMLElement
    if (!targetElement) return

    const showHelp = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      
      timeoutRef.current = setTimeout(() => {
        const rect = targetElement.getBoundingClientRect()
        const scrollTop = window.pageYOffset
        const scrollLeft = window.pageXOffset

        let x = 0, y = 0

        switch (position) {
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
        }

        setTooltipPosition({ x, y })
        setIsVisible(true)
      }, delay)
    }

    const hideHelp = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setIsVisible(false)
    }

    if (trigger === 'hover') {
      targetElement.addEventListener('mouseenter', showHelp)
      targetElement.addEventListener('mouseleave', hideHelp)
    } else if (trigger === 'click') {
      targetElement.addEventListener('click', showHelp)
    } else if (trigger === 'focus') {
      targetElement.addEventListener('focus', showHelp)
      targetElement.addEventListener('blur', hideHelp)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      targetElement.removeEventListener('mouseenter', showHelp)
      targetElement.removeEventListener('mouseleave', hideHelp)
      targetElement.removeEventListener('click', showHelp)
      targetElement.removeEventListener('focus', showHelp)
      targetElement.removeEventListener('blur', hideHelp)
    }
  }, [target, trigger, position, delay])

  if (!isVisible) return null

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 pointer-events-auto"
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        transform: position === 'top' ? 'translate(-50%, -100%)' :
                  position === 'bottom' ? 'translate(-50%, 0)' :
                  position === 'left' ? 'translate(-100%, -50%)' :
                  'translate(0, -50%)'
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-xs">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-900 text-sm">{content.title}</h4>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          <p className="text-sm text-gray-600 mb-3">{content.description}</p>

          {/* Tips */}
          {content.tips && content.tips.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center space-x-1 mb-2">
                <Lightbulb className="h-3 w-3 text-yellow-500" />
                <span className="text-xs font-medium text-gray-700">Tips</span>
              </div>
              <ul className="space-y-1">
                {content.tips.map((tip, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-start">
                    <span className="text-yellow-500 mr-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Shortcuts */}
          {content.shortcuts && content.shortcuts.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-700 mb-2">Shortcuts</div>
              <div className="space-y-1">
                {content.shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{shortcut.description}</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
            {content.videoUrl && (
              <button className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800">
                <Video className="h-3 w-3" />
                <span>Watch Video</span>
              </button>
            )}
            {content.docsUrl && (
              <button className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800">
                <FileText className="h-3 w-3" />
                <span>Docs</span>
              </button>
            )}
            {content.relatedTutorials && content.relatedTutorials.length > 0 && (
              <button className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-800">
                <ExternalLink className="h-3 w-3" />
                <span>Tutorial</span>
              </button>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className={`absolute w-2 h-2 bg-white border transform rotate-45 ${
          position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-t-0 border-l-0' :
          position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 border-b-0 border-r-0' :
          position === 'left' ? 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-t-0 border-r-0' :
          'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-b-0 border-l-0'
        }`} />
      </div>
    </div>
  )
}

// Help content database
export const helpContent: Record<string, HelpContent> = {
  'add-input': {
    id: 'add-input',
    title: 'Input Node',
    description: 'Input nodes are the starting point of your workflow. They receive the PDF files you upload.',
    tips: [
      'Input nodes can only have output connections',
      'You can have multiple input nodes for different file types',
      'Drag files directly onto input nodes to upload'
    ],
    shortcuts: [
      { key: 'Ctrl+I', description: 'Add input node' }
    ],
    relatedTutorials: ['basic-workflow']
  },
  'add-split': {
    id: 'add-split',
    title: 'Split PDF Node',
    description: 'Split PDF nodes divide a PDF document into multiple separate files based on your criteria.',
    tips: [
      'Configure page ranges in the properties panel',
      'Split by page count or file size',
      'Preview split results before processing'
    ],
    shortcuts: [
      { key: 'Ctrl+S', description: 'Add split node' }
    ],
    relatedTutorials: ['node-configuration']
  },
  'add-merge': {
    id: 'add-merge',
    title: 'Merge PDFs Node',
    description: 'Merge nodes combine multiple PDF files into a single document.',
    tips: [
      'Drag to reorder files in merge sequence',
      'Preserve bookmarks and metadata',
      'Set custom page numbering'
    ],
    shortcuts: [
      { key: 'Ctrl+M', description: 'Add merge node' }
    ]
  },
  'file-upload': {
    id: 'file-upload',
    title: 'File Upload',
    description: 'Upload PDF files to process through your workflow. Supports drag-and-drop and multiple file selection.',
    tips: [
      'Drag files directly from your file explorer',
      'Only PDF files are supported',
      'Upload multiple files at once for batch processing'
    ],
    shortcuts: [
      { key: 'Ctrl+U', description: 'Open file dialog' }
    ]
  },
  'run-workflow': {
    id: 'run-workflow',
    title: 'Run Workflow',
    description: 'Execute your workflow to process the uploaded files through all connected nodes.',
    tips: [
      'Ensure all nodes are properly connected',
      'Upload files before running',
      'Monitor progress in real-time'
    ],
    shortcuts: [
      { key: 'Ctrl+R', description: 'Run workflow' }
    ]
  },
  'save-workflow': {
    id: 'save-workflow',
    title: 'Save Workflow',
    description: 'Save your workflow configuration to reuse with different files later.',
    tips: [
      'Give workflows descriptive names',
      'Save frequently used patterns as templates',
      'Export workflows to share with others'
    ],
    shortcuts: [
      { key: 'Ctrl+S', description: 'Save workflow' }
    ]
  }
}

// Context provider for help system
export function HelpProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      {Object.entries(helpContent).map(([key, content]) => (
        <ContextualHelp
          key={key}
          target={`[data-tutorial="${key}"]`}
          content={content}
          trigger="hover"
          delay={800}
        />
      ))}
    </div>
  )
}
