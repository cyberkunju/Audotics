'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSpotifyAuth } from './context';
import { getAuthCookie } from './utils';
import { IS_AUTHENTICATED_COOKIE } from './constants';

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { auth, refreshToken } = useSpotifyAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    // Check authentication status
    const checkAuth = async () => {
      // First, quick check with client-side cookie
      const clientAuth = getAuthCookie(IS_AUTHENTICATED_COOKIE) === 'true';
      
      if (clientAuth || auth.isAuthenticated) {
        if (isMounted) {
          setIsAuthorized(true);
          setIsChecking(false);
        }
        return;
      }
      
      // If not authenticated according to context, try a token refresh
      try {
        console.log('[AuthGuard] Checking authentication status');
        const result = await refreshToken();
        
        if (isMounted) {
          if (result.success) {
            console.log('[AuthGuard] Successfully refreshed token');
            setIsAuthorized(true);
          } else if (result.requireAuth) {
            console.log('[AuthGuard] Authentication required, redirecting to login');
            router.replace('/auth/login');
          }
        }
      } catch (error) {
        console.error('[AuthGuard] Error checking authentication:', error);
        if (isMounted) {
          router.replace('/auth/login');
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [auth.isAuthenticated, refreshToken, router]);

  // While checking authentication status
  if (isChecking) {
    return fallback || <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // If not authorized, the redirect should have happened in the effect
  // But just in case, we'll render the fallback
  if (!isAuthorized) {
    return fallback || <div className="flex h-screen items-center justify-center">Unauthorized</div>;
  }

  // If authorized, render the children
  return <>{children}</>;
}

export default AuthGuard; 