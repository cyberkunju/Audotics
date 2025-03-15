// Spotify API client
import { SpotifyTokenResponse, SpotifyUserProfile, RefreshResponse } from './types';
import { 
  ACCESS_TOKEN_COOKIE, 
  REFRESH_TOKEN_COOKIE,
  SPOTIFY_API_URL,
  SPOTIFY_TOKEN_URL,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  REDIRECT_URI
} from './constants';
import { acquireRefreshLock, releaseRefreshLock, handleAuthError } from './utils';

// API endpoints
const USER_PROFILE_ENDPOINT = `${SPOTIFY_API_URL}/me`;

// Common fetch options
const commonFetchOptions = {
  credentials: 'include' as RequestCredentials,
  cache: 'no-cache' as RequestCache,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Get current user profile from Spotify
 */
export async function getUserProfile(): Promise<SpotifyUserProfile> {
  try {
    const response = await fetch(USER_PROFILE_ENDPOINT, {
      method: 'GET',
      ...commonFetchOptions,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get user profile: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Error fetching user profile: ${handleAuthError(error)}`);
  }
}

/**
 * Check if user is authenticated
 */
export async function checkAuthentication(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/check', {
      method: 'GET',
      ...commonFetchOptions,
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.authenticated === true;
  } catch (error) {
    console.error('[Spotify Auth] Error checking authentication:', error);
    return false;
  }
}

/**
 * Refresh the access token
 * Uses a global lock to prevent concurrent refreshes
 */
export async function refreshAccessToken(): Promise<RefreshResponse> {
  // Check if another component is already refreshing the token
  if (!acquireRefreshLock()) {
    return { 
      success: false, 
      error: 'Token refresh already in progress',
      message: 'Another component is already refreshing the token'
    };
  }

  try {
    console.log('[Spotify Auth] Refreshing access token');
    
    const response = await fetch('/api/auth/spotify/refresh', {
      method: 'POST',
      ...commonFetchOptions,
    });

    // Always parse the response, even if it's an error
    const data = await response.json();

    if (!response.ok) {
      console.error('[Spotify Auth] Token refresh failed:', data);
      return {
        success: false,
        error: data.error || 'Token refresh failed',
        message: data.message || `Status ${response.status}`,
        requireAuth: data.requireAuth
      };
    }

    return {
      success: true,
      access_token: data.access_token,
      expires_in: data.expires_in
    };
  } catch (error) {
    return {
      success: false,
      error: 'Token refresh error',
      message: handleAuthError(error)
    };
  } finally {
    // Always release the lock
    releaseRefreshLock();
  }
}

/**
 * Exchange the authorization code for tokens
 * This is called server-side from the callback endpoint
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<SpotifyTokenResponse> {
  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
      cache: 'no-cache'
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Spotify Auth] Token exchange failed:', data);
      throw new Error(data.error_description || 'Failed to exchange code for tokens');
    }

    return data;
  } catch (error) {
    throw new Error(`Error exchanging code for tokens: ${handleAuthError(error)}`);
  }
}

/**
 * Refresh the token using a refresh token
 * This is called server-side from the refresh endpoint
 */
export async function refreshTokenServerSide(refreshToken: string): Promise<SpotifyTokenResponse> {
  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      cache: 'no-cache'
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Spotify Auth] Server-side token refresh failed:', data);
      throw new Error(data.error_description || `Failed to refresh token: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    throw new Error(`Error refreshing token: ${handleAuthError(error)}`);
  }
} 