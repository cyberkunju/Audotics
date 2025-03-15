// Spotify authentication constants

// Environment variables with fallbacks
export const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID || '';
export const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
export const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/spotify/callback';

// For proxy to backend (if you're using it)
export const BACKEND_AUTH_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002';

// Authentication endpoints
export const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
export const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
export const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// Cookie names
export const ACCESS_TOKEN_COOKIE = 'spotify_access_token';
export const REFRESH_TOKEN_COOKIE = 'spotify_refresh_token';
export const AUTH_STATE_COOKIE = 'spotify_auth_state';
export const CODE_VERIFIER_COOKIE = 'spotify_code_verifier';
export const IS_AUTHENTICATED_COOKIE = 'is_authenticated';
export const AUTH_SUCCESS_COOKIE = 'auth_success';

// Token refresh settings
export const TOKEN_REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes
export const INITIAL_REFRESH_DELAY = 60 * 1000; // 60 seconds for fresh login
export const REGULAR_REFRESH_DELAY = 30 * 1000; // 30 seconds for existing session
export const MAX_REFRESH_ATTEMPTS = 3;

// Cookie settings
export const COOKIE_OPTIONS = {
  // In production these would be true
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

// Auth scopes
export const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'playlist-modify-public',
  'user-library-read',
  'user-library-modify'
].join(' '); 