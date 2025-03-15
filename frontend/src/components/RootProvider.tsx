'use client'

import { useEffect, useState } from 'react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ErrorBoundary } from './ErrorBoundary'
import { ToastProvider } from './ToastContainer'
import { SpotifyAuthProvider } from '@/lib/spotify-auth/context'

export default function RootProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
          <SpotifyAuthProvider>
            {mounted ? (
              <div className="relative">
                <div className="relative z-10">
                  {children}
                </div>
              </div>
            ) : (
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
          </SpotifyAuthProvider>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
