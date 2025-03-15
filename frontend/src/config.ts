export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001';

export const SPOTIFY_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  redirectUri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://localhost:3002/auth/spotify/callback',
  scopes: [
    'user-read-email',
    'user-read-private',
    'user-top-read',
    'playlist-modify-public',
    'playlist-modify-private'
  ]
};

export const AUTH_CONFIG = {
  tokenRefreshThreshold: 5 * 60, // 5 minutes before expiry
  maxRefreshAttempts: 3,
  refreshRetryDelay: 1000, // 1 second
  cookieOptions: {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const
  }
}; 