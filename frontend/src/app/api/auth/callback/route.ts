import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  AUTH_STATE_COOKIE,
  CODE_VERIFIER_COOKIE,
} from '@/constants/auth';

export async function POST(request: Request) {
  try {
    const { code, state } = await request.json();
    
    // Verify state
    const cookieStore = await cookies();
    const storedState = cookieStore.get(AUTH_STATE_COOKIE)?.value;
    if (!storedState || state !== storedState) {
      return NextResponse.json(
        { message: 'State mismatch' },
        { status: 400 }
      );
    }

    // Get code verifier
    const codeVerifier = cookieStore.get(CODE_VERIFIER_COOKIE)?.value;
    if (!codeVerifier) {
      return NextResponse.json(
        { message: 'Code verifier not found' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return NextResponse.json(
        { message: 'Failed to exchange code for tokens' },
        { status: 400 }
      );
    }

    const tokens = await tokenResponse.json();

    // Get user profile
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user profile:', await userResponse.text());
      return NextResponse.json(
        { message: 'Failed to fetch user profile' },
        { status: 400 }
      );
    }

    const user = await userResponse.json();

    // Create response
    const response = NextResponse.json({
      user: {
        id: user.id,
        display_name: user.display_name,
        email: user.email,
        images: user.images,
      },
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    // Set cookies in the response
    response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
    });

    if (tokens.refresh_token) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    // Clear PKCE cookies
    response.cookies.delete(AUTH_STATE_COOKIE);
    response.cookies.delete(CODE_VERIFIER_COOKIE);

    return response;
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 