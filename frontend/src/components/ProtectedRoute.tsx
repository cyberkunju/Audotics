import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSpotifyAuth } from '@/lib/spotify-auth/context';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { auth } = useSpotifyAuth();
  const router = useRouter();
  
  // Check if the user is authenticated - user existence is our authentication marker
  const isAuthenticated = !!auth?.user;
  const loading = auth?.isLoading || false;

  useEffect(() => {
    // Only redirect if we've finished loading and no user is found
    if (!loading && !isAuthenticated) {
      console.log('[ProtectedRoute] No authenticated user found, redirecting to login');
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
} 