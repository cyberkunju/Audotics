import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateCodeVerifier, generateCodeChallenge } from '@/lib/spotify-auth/utils'
import {
  SPOTIFY_AUTH_URL,
  SPOTIFY_CLIENT_ID,
  REDIRECT_URI,
  CODE_VERIFIER_COOKIE,
  AUTH_STATE_COOKIE,
  SPOTIFY_SCOPES
} from '@/lib/spotify-auth/constants'
import { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export async function GET() {
  try {
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = Math.random().toString(36).substring(7)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: SPOTIFY_SCOPES,
      redirect_uri: REDIRECT_URI,
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    })

    // Store code verifier and state in cookies
    const response = NextResponse.json({
      url: `${SPOTIFY_AUTH_URL}?${params.toString()}`
    })

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 10 * 60, // 10 minutes
    }

    response.cookies.set(CODE_VERIFIER_COOKIE, codeVerifier, cookieOptions)
    response.cookies.set(AUTH_STATE_COOKIE, state, cookieOptions)

    return response
  } catch (error) {
    console.error('Failed to generate auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
} 