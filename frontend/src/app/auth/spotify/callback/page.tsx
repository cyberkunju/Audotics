'use client'

import React, { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSpotifyAuth } from '@/lib/spotify-auth/context'
import LoadingScreen from '@/components/LoadingScreen'

export default function SpotifyCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { auth } = useSpotifyAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (!searchParams) {
          router.push('/login')
          return
        }

        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
          console.error('Spotify auth error:', error)
          router.push('/login?error=' + error)
          return
        }

        if (!code) {
          router.push('/login')
          return
        }

        // This page should only be used if the API route callback didn't work
        // Display a message to the user and check authentication
        console.log('Callback page loaded - attempting to check auth status')
        
        // Wait for a moment then check if the user is authenticated
        setTimeout(() => {
          if (auth.isAuthenticated) {
            router.push('/dashboard')
          } else {
            // If the user isn't authenticated yet, try to authenticate them using the code
            fetch('/api/auth/spotify/callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                code,
                state: searchParams.get('state')
              }),
              credentials: 'include'
            })
              .then(response => {
                if (!response.ok) {
                  throw new Error('Auth callback failed')
                }
                return response.json()
              })
              .then(() => {
                router.push('/dashboard')
              })
              .catch(error => {
                console.error('Callback error:', error)
                router.push('/login?error=callback_failed')
              })
          }
        }, 2000)
      } catch (error) {
        console.error('Callback error:', error)
        router.push('/login?error=callback_failed')
      }
    }

    handleCallback()
  }, [searchParams, router, auth.isAuthenticated])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <LoadingScreen />
      <div className="absolute bottom-10 text-center text-white/70">
        <p>Completing authentication...</p>
        <p className="text-sm mt-2">You will be redirected shortly</p>
      </div>
    </div>
  )
} 