import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Make sure these match .env.local values
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/spotify/callback';
const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '28924c7b063d487ba28f51419e06b8cc';

// Server-side safe PKCE implementation
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values)
    .map(x => possible[x % possible.length])
    .join('');
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function GET(request: NextRequest) {
  try {
    console.log('Processing login request');
    
    const state = generateRandomString(16);
    const codeVerifier = generateRandomString(64);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    console.log('Using redirect URI:', REDIRECT_URI);
    
    const spotifyAuthUrl = new URL('https://accounts.spotify.com/authorize');
    const searchParams = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      state: state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      scope: 'user-read-email user-read-private user-read-currently-playing user-read-recently-played user-top-read playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public user-library-read user-library-modify'
    });

    const response = NextResponse.redirect(`${spotifyAuthUrl.toString()}?${searchParams.toString()}`);
    
    // We're in development, so set secure: false explicitly
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Set cookies via response.cookies API with proper attributes
    response.cookies.set('spotify_auth_state', state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 3600,
      path: '/'
    });

    response.cookies.set('spotify_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 3600,
      path: '/'
    });

    // Clear any previous session cookies to avoid conflicts
    response.cookies.delete('spotify_access_token');
    response.cookies.delete('spotify_refresh_token');
    
    return response;
  } catch (error) {
    console.error('Spotify login error:', error instanceof Error ? error.message : String(error));
    return NextResponse.redirect(new URL('/auth/login?error=server_error', FRONTEND_URL));
  }
} 