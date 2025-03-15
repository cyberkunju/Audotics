import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE } from '@/lib/spotify-auth/constants';

export async function GET(request: NextRequest) {
  try {
    // Get cookies (always await in Next.js 15+)
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    
    // Check if the access token exists
    const isAuthenticated = !!accessToken;
    
    // Return the authentication status
    return NextResponse.json({ authenticated: isAuthenticated });
  } catch (error) {
    console.error('[Spotify Auth] Error checking authentication:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
} 