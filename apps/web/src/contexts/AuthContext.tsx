import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we're in development mode with placeholder Supabase config
    const isDevelopment = import.meta.env.DEV &&
      (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co')

    if (isDevelopment) {
      // Create a mock user for development
      console.log('🔧 Running in development mode with mock authentication')
      const mockUser = {
        id: 'dev-user-123',
        email: 'dev@docuslicer.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      } as User

      setUser(mockUser)
      setSession({
        access_token: 'dev-token',
        refresh_token: 'dev-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser
      } as Session)
      setLoading(false)
      console.log('✅ Mock user created:', mockUser.email)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => {
      // If Supabase fails, set loading to false anyway
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV &&
      (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co')

    if (isDevelopment) {
      // Mock successful sign in for development
      const mockUser = {
        id: 'dev-user-123',
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated'
      } as User

      setUser(mockUser)
      setSession({
        access_token: 'dev-token',
        refresh_token: 'dev-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser
      } as Session)

      return { error: null }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (err) {
      return { error: err as AuthError }
    }
  }

  const signUp = async (email: string, password: string) => {
    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV &&
      (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co')

    if (isDevelopment) {
      // Mock successful sign up for development
      return { error: null }
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { error }
    } catch (err) {
      return { error: err as AuthError }
    }
  }

  const signOut = async () => {
    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV &&
      (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co')

    if (isDevelopment) {
      // Mock successful sign out for development
      setUser(null)
      setSession(null)
      return { error: null }
    }

    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (err) {
      return { error: err as AuthError }
    }
  }

  const resetPassword = async (email: string) => {
    // Check if we're in development mode
    const isDevelopment = import.meta.env.DEV &&
      (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co')

    if (isDevelopment) {
      // Mock successful password reset for development
      return { error: null }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (err) {
      return { error: err as AuthError }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
