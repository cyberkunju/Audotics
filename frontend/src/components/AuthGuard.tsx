'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import authService from '../services/auth.service'

interface AuthGuardProps {
  children: ReactNode
}

// List of public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/features'];
const AUTH_ROUTES = ['/auth/callback', '/auth/login'];

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)
  
  // Check if the current route is a public route or auth route
  const isPublicRoute = pathname ? PUBLIC_ROUTES.includes(pathname) : false;
  const isAuthRoute = pathname ? (AUTH_ROUTES.includes(pathname) || pathname.startsWith('/auth/')) : false;
  
  useEffect(() => {
    const checkAuth = async () => {
      // Don't check auth for public or auth routes
      if (isPublicRoute || isAuthRoute) {
        setIsReady(true);
        return;
      }

      // Check if authenticated
      if (!authService.isAuthenticated()) {
        // Try to refresh the token
        const refreshed = await authService.refreshToken();
        if (!refreshed) {
          router.push('/auth/login');
          return;
        }
      }
      
      setIsReady(true);
    };

    checkAuth();
  }, [router, pathname, isPublicRoute, isAuthRoute]);

  // Show nothing while checking authentication
  if (!isReady) {
    return null;
  }

  // Always render public routes and auth routes
  if (isPublicRoute || isAuthRoute) {
    return <>{children}</>;
  }

  // For protected routes, only render if authenticated
  if (authService.isAuthenticated()) {
    return <>{children}</>;
  }

  // Otherwise render nothing (will redirect to login)
  return null;
} 