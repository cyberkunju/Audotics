'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSpotifyAuth } from '@/lib/spotify-auth/context';

export default function CallbackPage() {
  const router = useRouter();
  const { auth, login } = useSpotifyAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange code for tokens
        await login();

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('Error in callback:', error);
        router.push('/auth/login');
      }
    };

    handleCallback();
  }, [router, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Logging you in...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we complete the authentication process.
        </p>
      </div>
    </div>
  );
} 