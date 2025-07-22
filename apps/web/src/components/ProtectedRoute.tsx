import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  console.log('🔒 ProtectedRoute - Loading:', loading, 'User:', user?.email || 'No user')

  if (loading) {
    console.log('⏳ ProtectedRoute - Still loading...')
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('❌ ProtectedRoute - No user, redirecting to signin')
    // Redirect to sign in page with return url
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  console.log('✅ ProtectedRoute - User authenticated, rendering children')
  return <>{children}</>
}
