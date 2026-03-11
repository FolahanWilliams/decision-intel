'use client'

import { createClient } from '@/utils/supabase/client'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/api/auth/callback`
      }
    })
  }

  return (
    <div className="flex bg-background min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-card border border-border shadow-lg rounded-xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to your Decision Intel account to continue
          </p>
        </div>
        <div className="pt-4">
          <button 
            className="w-full h-12 text-base font-medium flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors" 
            onClick={handleGoogleLogin}
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  )
}

