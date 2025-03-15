import { NextResponse } from 'next/server'
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  IS_AUTHENTICATED_COOKIE,
  AUTH_STATE_COOKIE,
  CODE_VERIFIER_COOKIE
} from '@/lib/spotify-auth/constants'

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Clear all auth-related cookies
  response.cookies.delete(ACCESS_TOKEN_COOKIE)
  response.cookies.delete(REFRESH_TOKEN_COOKIE)
  response.cookies.delete(IS_AUTHENTICATED_COOKIE)
  response.cookies.delete(AUTH_STATE_COOKIE)
  response.cookies.delete(CODE_VERIFIER_COOKIE)

  return response
} 