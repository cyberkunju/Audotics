'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard after a short delay
    const timer = setTimeout(() => {
      router.replace('/dashboard')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-black to-slate-900">
      <div className="w-full max-w-md">
        <Card className="border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Authentication Successful</CardTitle>
            <CardDescription className="text-slate-400">
              You have successfully authenticated with Spotify
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-slate-400">
              Redirecting you to the dashboard...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 