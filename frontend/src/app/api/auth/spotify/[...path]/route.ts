import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateCodeVerifier, generateCodeChallenge } from '@/utils/pkce';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://localhost:3002/auth/spotify/callback';
const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '28924c7b063d487ba28f51419e06b8cc';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'e111f78fc0704699b544591efd7a867e';

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  try {
    // Always await params in Next.js 15+
    const params = await context.params;
    
    // Get path segments safely
    const pathSegment = Array.isArray(params.path) && params.path.length > 0 
      ? params.path[0] 
      : '';
    
    console.log('Processing GET request for path:', pathSegment);

    if (pathSegment === 'login') {
      const state = crypto.randomUUID();
      const codeVerifier = generateCodeVerifier(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
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
      
      // Always await cookies() in Next.js 15+
      const cookieStore = await cookies();
      
      // Set cookies via response.cookies API
      response.cookies.set('spotify_auth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600,
        path: '/'
      });

      response.cookies.set('spotify_code_verifier', codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600,
        path: '/'
      });

      return response;
    }

    if (pathSegment === 'callback') {
      const { searchParams } = new URL(request.url);
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      // Always await cookies() in Next.js 15+
      const cookieStore = await cookies();
      const savedState = cookieStore.get('spotify_auth_state')?.value;
      const codeVerifier = cookieStore.get('spotify_code_verifier')?.value;

      console.log('Callback cookies:', {
        savedState,
        codeVerifier,
        requestState: state
      });

      if (!state || state !== savedState) {
        console.error('State mismatch:', { state, savedState });
        return NextResponse.redirect(new URL('/auth/login?error=state_mismatch', FRONTEND_URL));
      }

      if (!code || !codeVerifier) {
        console.error('Missing code or verifier:', { code: !!code, codeVerifier: !!codeVerifier });
        return NextResponse.redirect(new URL('/auth/login?error=invalid_request', FRONTEND_URL));
      }

      try {
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
          })
        });

        if (!tokenResponse.ok) {
          const responseText = await tokenResponse.text();
          console.error('Token exchange failed:', responseText);
          return NextResponse.redirect(new URL('/auth/login?error=token_exchange_failed', FRONTEND_URL));
        }

        const data = await tokenResponse.json();
        console.log('Token exchange successful, redirecting to dashboard');
        
        // Create the redirect response
        const response = NextResponse.redirect(new URL('/dashboard', FRONTEND_URL));
        
        // Set client-side auth success cookie
        response.cookies.set('auth_success', 'true', {
          path: '/',
          maxAge: 60,
          httpOnly: false
        });

        // Set a client-side flag to avoid redirect loops
        response.cookies.set('is_authenticated', 'true', {
          httpOnly: false,
          maxAge: data.expires_in,
          path: '/'
        });

        // Clean up auth cookies
        response.cookies.delete('spotify_auth_state');
        response.cookies.delete('spotify_code_verifier');

        // Set the access token
        response.cookies.set('spotify_access_token', data.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: data.expires_in,
          path: '/'
        });

        // Set the refresh token if present
        if (data.refresh_token) {
          response.cookies.set('spotify_refresh_token', data.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 86400 * 30, // 30 days
            path: '/'
          });
        }

        return response;
      } catch (error) {
        console.error('Token exchange error:', error);
        return NextResponse.redirect(new URL('/auth/login?error=token_exchange_error', FRONTEND_URL));
      }
    }

    return NextResponse.json({ error: 'Invalid path' }, { status: 404 });
  } catch (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=server_error', FRONTEND_URL));
  }
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  try {
    // Always await params in Next.js 15+
    const params = await context.params;
    
    // Get path segments safely
    const pathSegment = Array.isArray(params.path) && params.path.length > 0 
      ? params.path[0] 
      : '';
    
    console.log('Processing POST request for path:', pathSegment);
    
    if (pathSegment === 'refresh') {
      // Always await cookies() in Next.js 15+
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get('spotify_refresh_token')?.value;
      
      if (!refreshToken) {
        console.log('No refresh token found');
        
        const response = NextResponse.json(
          { error: 'Authentication required', requireAuth: true }, 
          { status: 401 }
        );
        
        response.cookies.delete('spotify_access_token');
        response.cookies.delete('spotify_refresh_token');
        response.cookies.delete('is_authenticated');
        response.cookies.delete('auth_success');
        
        return response;
      }
      
      try {
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          })
        });
        
        if (!tokenResponse.ok) {
          const responseText = await tokenResponse.text();
          console.error('Token refresh failed:', responseText);
          
          const response = NextResponse.json(
            { 
              error: 'Token refresh failed', 
              details: responseText,
              requireAuth: true 
            }, 
            { status: 401 }
          );
          
          // Clear all auth cookies if refresh failed
          response.cookies.delete('spotify_access_token');
          response.cookies.delete('spotify_refresh_token');
          response.cookies.delete('is_authenticated');
          response.cookies.delete('auth_success');
          
          return response;
        }
        
        const data = await tokenResponse.json();
        const response = NextResponse.json({ success: true });
        
        response.cookies.set('spotify_access_token', data.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: data.expires_in,
          path: '/'
        });
        
        // Update client-side auth flag
        response.cookies.set('is_authenticated', 'true', {
          httpOnly: false,
          maxAge: data.expires_in,
          path: '/'
        });
        
        if (data.refresh_token) {
          response.cookies.set('spotify_refresh_token', data.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 86400 * 30, // 30 days
            path: '/'
          });
        }
        
        return response;
      } catch (error) {
        console.error('Token refresh error:', error);
        
        const response = NextResponse.json(
          { 
            error: 'Token refresh error', 
            requireAuth: true 
          }, 
          { status: 401 }
        );
        
        // Clear auth cookies on error
        response.cookies.delete('spotify_access_token');
        response.cookies.delete('spotify_refresh_token');
        response.cookies.delete('is_authenticated');
        response.cookies.delete('auth_success');
        
        return response;
      }
    }
    
    return NextResponse.json({ error: 'Invalid path' }, { status: 404 });
  } catch (error) {
    console.error('Spotify auth error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 