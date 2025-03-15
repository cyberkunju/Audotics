'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { AuthState, SpotifyUserProfile, RefreshResponse } from './types';
import { 
  refreshAccessToken, 
  getUserProfile, 
  checkAuthentication 
} from './api';
import { 
  TOKEN_REFRESH_INTERVAL, 
  INITIAL_REFRESH_DELAY, 
  REGULAR_REFRESH_DELAY,
  MAX_REFRESH_ATTEMPTS,
  IS_AUTHENTICATED_COOKIE,
  AUTH_SUCCESS_COOKIE,
  REFRESH_TOKEN_COOKIE,
  CODE_VERIFIER_COOKIE
} from './constants';
import { 
  clearAllAuthCookies,
  setAuthCookie,
  getAuthCookie,
  acquireRefreshLock,
  releaseRefreshLock,
  generateCodeVerifier,
  generateCodeChallenge,
  handleAuthError
} from './utils';

// Browser detection helper - safe for SSR
const isBrowser = typeof window !== 'undefined';

// Define the auth state type
interface SpotifyAuth {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: SpotifyUserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Create context with initial state
const SpotifyAuthContext = createContext<{
  auth: SpotifyAuth;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<any>;
}>({
  auth: { accessToken: null, refreshToken: null, expiresAt: null, user: null, isAuthenticated: false, isLoading: true, error: null },
  login: async () => {},
  logout: async () => {},
  refreshToken: async () => ({ success: false }),
});

// Create hook for accessing context
export const useSpotifyAuth = () => useContext(SpotifyAuthContext);

// Helper function to check authentication state securely
const checkAuthState = (): boolean => {
  if (!isBrowser) return false;
  const refreshToken = getAuthCookie(REFRESH_TOKEN_COOKIE);
  const isAuthenticated = getAuthCookie(IS_AUTHENTICATED_COOKIE) === 'true';
  return !!(refreshToken && isAuthenticated);
};

interface ErrorWithResponse {
  response?: {
    status?: number;
  };
}

// Provider component
export function SpotifyAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [auth, setAuth] = useState<SpotifyAuth>({
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });
  const [mounted, setMounted] = useState(false);
  const [refreshTimerId, setRefreshTimerId] = useState<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState(0);

  // Check if current page is auth-related
  const isAuthPage = 
    pathname === '/login' || 
    pathname === '/auth/spotify/callback' || 
    pathname?.startsWith('/auth/') ||
    pathname === '/auth/error';

  useEffect(() => {
    const initAuth = async () => {
      try {
        setMounted(true)
        await checkAuthentication()
        setupRefreshCycle()
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      }
    }

    initAuth()
    
    return () => {
      if (refreshTimerId) {
        clearInterval(refreshTimerId)
      }
      setMounted(false)
    }
  }, [])

  const setupRefreshCycle = () => {
    if (refreshTimerId) {
      clearInterval(refreshTimerId)
    }

    // Only set up refresh cycle if authenticated
    if (auth.isAuthenticated) {
      const timer = setInterval(async () => {
        if (acquireRefreshLock()) {
          try {
            await refreshToken()
          } finally {
            releaseRefreshLock()
          }
        }
      }, 50 * 60 * 1000) // 50 minutes
      
      setRefreshTimerId(timer)
    }
  }

  const checkAuthentication = async () => {
    try {
      setAuth(prev => ({ ...prev, isLoading: true }))

      const response = await fetch('/api/auth/spotify/me', {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Try to refresh the token
          const refreshResponse = await fetch('/api/auth/spotify/refresh', {
            method: 'POST',
            credentials: 'include'
          })

          if (!refreshResponse.ok) {
            setAuth(prev => ({
              ...prev,
              isAuthenticated: false,
              isLoading: false,
              error: 'Token refresh failed'
            }))
            return
          }

          // Try fetching user profile again with new token
          const retryResponse = await fetch('/api/auth/spotify/me', {
            credentials: 'include'
          })

          if (!retryResponse.ok) {
            setAuth(prev => ({
              ...prev,
              isAuthenticated: false,
              isLoading: false,
              error: 'Authentication failed'
            }))
            return
          }

          const profile = await retryResponse.json()
          setAuth(prev => ({
            ...prev,
            user: profile,
            isAuthenticated: true,
            isLoading: false,
            error: null
          }))
          setupRefreshCycle()
          return
        }

        setAuth(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication failed'
        }))
        return
      }

      const profile = await response.json()
      setAuth(prev => ({
        ...prev,
        user: profile,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }))
      setupRefreshCycle()
    } catch (error) {
      console.error('Authentication check failed:', error)
      setAuth(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }))

      // Only redirect to login if not already on an auth page
      if (!isAuthPage) {
        router.push('/login')
      }
    }
  }

  // Function to manually trigger a token refresh
  const refreshToken = async () => {
    if (!auth.isAuthenticated || isRefreshing) {
      return { success: false, error: 'Not authenticated or already refreshing' };
    }

    if (acquireRefreshLock()) {
      try {
        const response = await fetch('/api/auth/spotify/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Refresh failed: ${response.status}`);
        }
        
        await checkAuthentication();
        return { success: true };
      } catch (error) {
        console.error('Token refresh error:', error);
        return { success: false, error: handleAuthError(error) };
      } finally {
        releaseRefreshLock();
      }
    } else {
      return { success: false, error: 'Refresh lock could not be acquired' };
    }
  };

  const login = async () => {
    try {
      setAuth(prev => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch('/api/auth/spotify', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      const data = await response.json()

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || 'Failed to initiate login')
      }

      // Use router for navigation within the app
      if (data.url.startsWith('/')) {
        router.push(data.url)
      } else {
        // Use window.location for external URLs (Spotify auth)
        window.location.assign(data.url)
      }
    } catch (error) {
      console.error('Login failed:', error)
      setAuth(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }))
    }
  }

  const logout = async () => {
    try {
      // Clear auth cookies
      await fetch('/api/auth/spotify/logout', {
        method: 'POST',
        credentials: 'include'
      })

      setAuth({
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })

      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Context value
  const contextValue = {
    auth,
    login,
    logout,
    refreshToken,
  };

  return (
    <SpotifyAuthContext.Provider value={contextValue}>
      {children}
    </SpotifyAuthContext.Provider>
  );
} 