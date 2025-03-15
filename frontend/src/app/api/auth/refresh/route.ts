import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from '@/constants/auth';

export async function POST() {
  try {
    // Get refresh token from cookies
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) {
      return NextResponse.json(
        { message: 'No refresh token found' },
        { status: 401 }
      );
    }

    // Exchange refresh token for new access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token refresh failed:', await tokenResponse.text());
      return NextResponse.json(
        { message: 'Failed to refresh token' },
        { status: 401 }
      );
    }

    const tokens = await tokenResponse.json();

    // Create response
    const response = NextResponse.json({
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
    });

    // Update access token cookie
    response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in,
    });

    // Update refresh token if provided
    if (tokens.refresh_token) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 