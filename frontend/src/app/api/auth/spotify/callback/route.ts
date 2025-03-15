import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SPOTIFY_TOKEN_URL,
  SPOTIFY_CLIENT_ID,
  REDIRECT_URI,
  CODE_VERIFIER_COOKIE,
  AUTH_STATE_COOKIE,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  IS_AUTHENTICATED_COOKIE
} from '@/lib/spotify-auth/constants';

// Handle both GET (from Spotify redirect) and POST (from our frontend)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${request.nextUrl.origin}/login?error=${error}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${request.nextUrl.origin}/login?error=missing_params`);
    }

    // Get code verifier from cookies
    const codeVerifier = request.cookies.get(CODE_VERIFIER_COOKIE)?.value;

    if (!codeVerifier) {
      return NextResponse.redirect(`${request.nextUrl.origin}/login?error=missing_verifier`);
    }

    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return NextResponse.redirect(`${request.nextUrl.origin}/login?error=token_failed`);
    }

    const tokens = await tokenResponse.json();
    const response = NextResponse.redirect(`${request.nextUrl.origin}/dashboard`);

    // Set auth cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
      ...cookieOptions,
      maxAge: tokens.expires_in,
    });

    if (tokens.refresh_token) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    response.cookies.set(IS_AUTHENTICATED_COOKIE, 'true', cookieOptions);

    // Clean up code verifier
    response.cookies.delete(CODE_VERIFIER_COOKIE);
    response.cookies.delete(AUTH_STATE_COOKIE);

    return response;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(`${request.nextUrl.origin}/login?error=callback_failed`);
  }
}

// Keep the POST endpoint for future use if needed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Get code verifier from cookies
    const codeVerifier = request.cookies.get(CODE_VERIFIER_COOKIE)?.value;
    
    if (!codeVerifier) {
      return NextResponse.json({ error: 'No code verifier found' }, { status: 400 });
    }

    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 400 });
    }

    const tokens = await tokenResponse.json();
    const response = NextResponse.json({ success: true });

    // Set auth cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
      ...cookieOptions,
      maxAge: tokens.expires_in,
    });

    if (tokens.refresh_token) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    response.cookies.set(IS_AUTHENTICATED_COOKIE, 'true', cookieOptions);

    // Clean up code verifier
    response.cookies.delete(CODE_VERIFIER_COOKIE);
    response.cookies.delete(AUTH_STATE_COOKIE);

    return response;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 