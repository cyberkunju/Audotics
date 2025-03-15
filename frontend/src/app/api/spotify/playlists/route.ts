import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ACCESS_TOKEN_COOKIE } from '@/lib/spotify-auth/constants'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      )
    }

    // Get user's playlists
    const response = await fetch(
      'https://api.spotify.com/v1/me/playlists?limit=50',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch playlists')
    }

    const playlists = await response.json()
    return NextResponse.json(playlists)
  } catch (error) {
    console.error('Error in playlists route:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    )
  }
} 