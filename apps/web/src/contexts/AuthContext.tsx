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
    console.log('🔧 Initializing Supabase authentication...')

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('❌ Error getting initial session:', error)
      } else {
        console.log('✅ Initial session loaded:', session ? 'authenticated' : 'not authenticated')
      }
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }).catch((error) => {
      console.error('❌ Failed to get initial session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session ? 'authenticated' : 'not authenticated')
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting to sign in user:', email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Sign in error:', error)
      } else {
        console.log('✅ Sign in successful:', data.user?.email)
      }

      return { error }
    } catch (err) {
      console.error('❌ Sign in exception:', err)
      return { error: err as AuthError }
    }
  }

  const signUp = async (email: string, password: string) => {
    console.log('📝 Attempting to sign up user:', email)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.error('❌ Sign up error:', error)
      } else {
        console.log('✅ Sign up successful:', data.user?.email)
      }

      return { error }
    } catch (err) {
      console.error('❌ Sign up exception:', err)
      return { error: err as AuthError }
    }
  }

  const signOut = async () => {
    console.log('🚪 Attempting to sign out user')

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('❌ Sign out error:', error)
      } else {
        console.log('✅ Sign out successful')
      }

      return { error }
    } catch (err) {
      console.error('❌ Sign out exception:', err)
      return { error: err as AuthError }
    }
  }

  const resetPassword = async (email: string) => {
    console.log('🔄 Attempting to reset password for:', email)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        console.error('❌ Password reset error:', error)
      } else {
        console.log('✅ Password reset email sent')
      }

      return { error }
    } catch (err) {
      console.error('❌ Password reset exception:', err)
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
