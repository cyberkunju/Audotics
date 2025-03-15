'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import RootProvider from '@/components/RootProvider'
import ScrollToTop from '@/components/ScrollToTop'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SpotifyAuthProvider } from '@/lib/spotify-auth/context'

// Dynamic import the cursor to avoid SSR issues
const CursorArrow = dynamic(() => import('@/components/CursorArrow'), {
  ssr: false,
})

// Dynamic import of SplashScreen with no SSR to avoid hydration issues
const SplashScreen = dynamic(() => import('@/components/SplashScreen'), {
  ssr: false,
})

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [showSplash, setShowSplash] = useState(false)
  const initialized = useRef(false)

  // Handle client-side initialization
  useEffect(() => {
    setMounted(true)
    
    if (!initialized.current) {
      initialized.current = true
      try {
        const hasVisited = localStorage.getItem('hasVisited')
        if (!hasVisited) {
          localStorage.setItem('hasVisited', 'true')
          setShowSplash(true)
        }
      } catch (error) {
        console.error('Error with localStorage:', error)
      }
    }
  }, [])

  return (
    <ErrorBoundary>
      <SpotifyAuthProvider>
        <RootProvider>
          {children}
        </RootProvider>
        
        {mounted && (
          <>
            <ScrollToTop />
            {/* Render cursor only on client-side */}
            <CursorArrow />
            {showSplash && (
              <SplashScreen onComplete={() => setShowSplash(false)} />
            )}
          </>
        )}
      </SpotifyAuthProvider>
    </ErrorBoundary>
  )
}

