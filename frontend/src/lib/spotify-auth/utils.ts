// Spotify authentication utilities
import Cookies from 'js-cookie';

// Constants
const LOCK_KEY = 'spotify_refresh_lock';
const LOCK_EXPIRY_KEY = 'spotify_refresh_lock_expiry';
const LOCK_TIMEOUT = 10000; // 10 seconds

// Cookie options with proper security settings
const DEFAULT_COOKIE_OPTS = {
  path: '/',
  domain: 'localhost',
  sameSite: 'Lax' as 'Lax' | 'Strict' | 'None',
  secure: false // Set to false for local development
};

// PKCE code verifier and challenge generation
export function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, Array.from(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Authentication lock mechanism to prevent concurrent token refreshes
export function acquireRefreshLock(): boolean {
  if (typeof window === 'undefined') return false; // SSR check
  
  try {
    // Check for an existing lock
    const currentLock = localStorage.getItem(LOCK_KEY);
    const lockExpiry = localStorage.getItem(LOCK_EXPIRY_KEY);
    
    // If there's a lock, check if it's expired
    if (currentLock && lockExpiry) {
      const expiryTime = parseInt(lockExpiry, 10);
      if (Date.now() < expiryTime) {
        console.log('[Spotify Auth] Token refresh already in progress, skipping');
        return false;
      }
      console.log('[Spotify Auth] Found expired lock, clearing it');
    }
    
    // Set lock for LOCK_TIMEOUT milliseconds
    localStorage.setItem(LOCK_KEY, 'true');
    localStorage.setItem(LOCK_EXPIRY_KEY, (Date.now() + LOCK_TIMEOUT).toString());
    console.log('[Spotify Auth] Acquired token refresh lock');
    return true;
  } catch (error) {
    console.error('[Spotify Auth] Error acquiring refresh lock:', error);
    return true; // Proceed if localStorage is unavailable
  }
}

export function releaseRefreshLock(): void {
  if (typeof window === 'undefined') return; // SSR check
  
  try {
    localStorage.removeItem(LOCK_KEY);
    localStorage.removeItem(LOCK_EXPIRY_KEY);
    console.log('[Spotify Auth] Released token refresh lock');
  } catch (error) {
    console.error('[Spotify Auth] Error releasing refresh lock:', error);
  }
}

// Cookie management
export function getAuthCookie(name: string): string | undefined {
  if (typeof window === 'undefined') return undefined; // SSR check
  return Cookies.get(name);
}

export function setAuthCookie(name: string, value: string, maxAgeDays = 30): void {
  if (typeof window === 'undefined') return; // SSR check
  
  try {
    Cookies.set(name, value, { 
      ...DEFAULT_COOKIE_OPTS, 
      expires: maxAgeDays 
    });
    console.log(`[Spotify Auth] Cookie set: ${name}`);
  } catch (error) {
    console.error(`[Spotify Auth] Error setting cookie ${name}:`, error);
  }
}

export function removeAuthCookie(name: string): void {
  if (typeof window === 'undefined') return; // SSR check
  
  try {
    Cookies.remove(name, DEFAULT_COOKIE_OPTS);
    console.log(`[Spotify Auth] Cookie removed: ${name}`);
  } catch (error) {
    console.error(`[Spotify Auth] Error removing cookie ${name}:`, error);
  }
}

export function clearAllAuthCookies(): void {
  if (typeof window === 'undefined') return; // SSR check
  
  const authCookies = [
    'spotify_access_token', 
    'spotify_refresh_token', 
    'is_authenticated', 
    'auth_success'
  ];
  
  authCookies.forEach(name => removeAuthCookie(name));
  console.log('[Spotify Auth] All auth cookies cleared');
}

// Error handling
export function handleAuthError(error: unknown): string {
  console.error('[Spotify Auth] Error:', error);
  return error instanceof Error ? error.message : String(error);
} 