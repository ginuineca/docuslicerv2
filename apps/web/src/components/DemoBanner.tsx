import { Info, X } from 'lucide-react'
import { useState } from 'react'

export function DemoBanner() {
  // Demo banner is disabled when using real Supabase credentials
  return null

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-blue-900">Demo Mode:</span>
              <span className="text-blue-700 ml-1">
                You're viewing DocuSlicer with mock authentication. Sign in with any email/password to explore the features.
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-1 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-100 transition-colors"
            aria-label="Dismiss demo banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
