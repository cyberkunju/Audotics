export const ACCESS_TOKEN_COOKIE = 'spotify_access_token';
export const REFRESH_TOKEN_COOKIE = 'spotify_refresh_token';
export const AUTH_STATE_COOKIE = 'spotify_auth_state';
export const CODE_VERIFIER_COOKIE = 'spotify_code_verifier';
export const IS_AUTHENTICATED_COOKIE = 'is_authenticated';

export const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}; 