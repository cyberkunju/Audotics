import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ACCESS_TOKEN_COOKIE, BACKEND_AUTH_URL } from '@/lib/spotify-auth/constants'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value

    if (!accessToken) {
      console.error('No access token found in cookies')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Attempting to fetch user profile')

    // Try to use the backend first if it's available
    try {
      // Attempt to use the backend proxy
      console.log(`Using backend proxy: ${BACKEND_AUTH_URL}/auth/spotify/user`)
      const backendResponse = await fetch(`${BACKEND_AUTH_URL}/auth/spotify/user`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Cookie': `spotify_access_token=${accessToken}`
        },
        next: { revalidate: 0 },
        cache: 'no-store'
      })
      
      if (backendResponse.ok) {
        const data = await backendResponse.json()
        console.log('Successfully retrieved user profile from backend')
        return NextResponse.json(data)
      } else {
        const errorText = await backendResponse.text().catch(() => 'Unknown error')
        console.error(`Backend request failed with status ${backendResponse.status}: ${errorText}`)
      }
    } catch (backendError) {
      console.error('Backend proxy error:', backendError)
      console.log('Backend proxy not available, falling back to direct Spotify API call')
    }

    // Direct Spotify API call (fallback)
    console.log('Falling back to direct Spotify API call')
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error(`Spotify API error ${response.status}: ${errorText}`)
      return NextResponse.json(
        { error: `Failed to fetch user profile: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Successfully retrieved user profile directly from Spotify')
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in me route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 