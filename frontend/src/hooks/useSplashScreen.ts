'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'hasVisitedAudotics'

export function useSplashScreen() {
  const [showSplash, setShowSplash] = useState(false) // Start with false to prevent flash
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setMounted(true)
    
    // Check if user has visited before
    try {
      const hasVisited = localStorage.getItem(STORAGE_KEY)
      
      if (!hasVisited) {
        // Only show splash for first-time visitors
        setShowSplash(true)
        localStorage.setItem(STORAGE_KEY, 'true')
      }
    } catch (error) {
      // Handle localStorage errors (private browsing, etc.)
      console.error('localStorage error:', error)
    }
  }, [])

  const hideSplash = () => {
    setShowSplash(false)
  }

  // Don't show splash before client-side hydration to prevent flickering
  return { 
    showSplash: mounted ? showSplash : false, 
    hideSplash 
  }
}
