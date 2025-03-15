import { CookieOptions } from 'express';

export const ACCESS_TOKEN_COOKIE = 'spotify_access_token';
export const REFRESH_TOKEN_COOKIE = 'spotify_refresh_token';
export const AUTH_STATE_COOKIE = 'spotify_auth_state';
export const CODE_VERIFIER_COOKIE = 'spotify_code_verifier';
export const IS_AUTHENTICATED_COOKIE = 'is_authenticated';
export const AUTH_SUCCESS_COOKIE = 'auth_success';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/',
}; 