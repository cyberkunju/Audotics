import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  SPOTIFY_TOKEN_URL,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  IS_AUTHENTICATED_COOKIE
} from '@/lib/spotify-auth/constants'
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

    if (!refreshToken) {
      console.error('Refresh token not found in cookies')
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      )
    }

    console.log('Attempting token refresh with Spotify')
    
    // Exchange refresh token for new access token
    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SPOTIFY_CLIENT_ID
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text().catch(() => 'Unknown error')
      console.error(`Token refresh failed with status ${tokenResponse.status}: ${errorText}`)
      
      // If refresh fails, clear auth cookies
      const response = NextResponse.json(
        { error: `Token refresh failed with status ${tokenResponse.status}` },
        { status: tokenResponse.status }
      )

      response.cookies.delete(ACCESS_TOKEN_COOKIE)
      response.cookies.delete(REFRESH_TOKEN_COOKIE)
      response.cookies.delete(IS_AUTHENTICATED_COOKIE)

      return response
    }

    const tokens = await tokenResponse.json()
    console.log('Token refresh successful')

    // Create response
    const response = NextResponse.json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in
    })

    // Set cookie options
    const cookieOptions: Partial<ResponseCookie> = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    }

    // Set new access token
    response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
      ...cookieOptions,
      maxAge: tokens.expires_in
    })

    // Set new refresh token if provided
    if (tokens.refresh_token) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 // 30 days
      })
    }

    return response
  } catch (error) {
    console.error('Error in refresh route:', error)
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    )
  }
} 