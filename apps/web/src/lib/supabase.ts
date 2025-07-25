import { createClient } from '@supabase/supabase-js'

// Debug environment variables
console.log('🔍 Environment variables check:')
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fallback to hardcoded values if environment variables are not loaded
// This is temporary for debugging - remove in production
const finalUrl = supabaseUrl || 'https://phqznzfdrecztrklnetj.supabase.co'
const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBocXpuemZkcmVjenRya2xuZXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTI4NDksImV4cCI6MjA2ODQyODg0OX0.JhmRRSfR1bD98QXy3V8uiYQmjGVhQuGuu_QmzCssW4o'

if (finalUrl.includes('placeholder')) {
  console.error('❌ Still using placeholder Supabase URL!')
  throw new Error('Placeholder Supabase URL detected. Environment variables not loaded correctly.')
}

console.log('🔧 Initializing Supabase client with URL:', finalUrl)

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
