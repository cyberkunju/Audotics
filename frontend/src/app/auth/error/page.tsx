'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthErrorPage() {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState('An authentication error occurred')
  const [errorCode, setErrorCode] = useState('unknown')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      
      if (code) {
        setErrorCode(code)
        
        const errorMessages: Record<string, string> = {
          'state_mismatch': 'Authentication state mismatch. This could be due to a session timeout or a security issue.',
          'invalid_request': 'Invalid authentication request. Some required parameters were missing or invalid.',
          'token_exchange_failed': 'Failed to authenticate with Spotify. The authorization code could not be exchanged for tokens.',
          'server_error': 'An unexpected server error occurred during authentication.',
        }
        
        setErrorMessage(errorMessages[code] || 'An unknown authentication error occurred')
      }
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-black to-slate-900">
      <div className="w-full max-w-md">
        <Card className="border-slate-800 bg-slate-950/50 backdrop-blur-sm shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Authentication Error</CardTitle>
            <CardDescription className="text-slate-400">
              Error code: {errorCode}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 text-sm rounded bg-red-950/50 border border-red-800 text-red-400">
              {errorMessage}
            </div>
            
            <p className="text-slate-400 text-sm">
              Please try again or contact support if the problem persists.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/auth/login">
              <Button variant="outline" className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 