import axios from 'axios';
import Cookies from 'js-cookie';
import { generateCodeVerifier, generateCodeChallenge } from '@/utils/pkce';
import { SpotifyService } from './spotify.service';
import { AuthState } from '@/types/spotify';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  AUTH_STATE_COOKIE,
  CODE_VERIFIER_COOKIE,
  IS_AUTHENTICATED_COOKIE,
} from '@/constants/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001';

interface AuthResponse {
  success: boolean;
  userId: string;
  accessToken: string;
  refreshToken?: string;
  user: any;
  expires_in: number;
}

export class AuthService {
  private static instance: AuthService;
  private readonly AUTH_STATE_KEY = 'auth_state';
  private refreshPromise: Promise<boolean> | null = null;
  private readonly REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private refreshInterval: NodeJS.Timeout | null = null;
  private spotifyService: SpotifyService;

  private constructor() {
    this.spotifyService = SpotifyService.getInstance();
    // Check authentication state on initialization
    this.checkAuthState();
    this.setupRefreshInterval();
  }

  private setupRefreshInterval() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Only set up refresh interval if authenticated
    if (this.isAuthenticated()) {
      this.refreshInterval = setInterval(() => {
        this.refreshToken();
      }, this.REFRESH_INTERVAL);
    }
  }

  private async checkAuthState() {
    try {
      const isAuthenticated = Cookies.get(IS_AUTHENTICATED_COOKIE) === 'true';
      const authState = this.getAuthState();
      
      // Clear any inconsistent state
      if (!isAuthenticated && authState?.isAuthenticated) {
        this.clearAuthState();
        return;
      }
      
      if (isAuthenticated && (!authState?.userId || !authState?.accessToken)) {
        const success = await this.refreshToken();
        if (!success) {
          this.clearAuthState();
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      this.clearAuthState();
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async loginWithSpotify() {
    try {
      // Log the configured API URL
      console.log('Auth Service - Login with Spotify');
      console.log('API_URL:', API_URL);
      console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
      
      // Construct the login URL
      const loginUrl = `${API_URL}/auth/spotify/login`;
      console.log('Redirecting to:', loginUrl);
      
      // Redirect to our login API endpoint which handles PKCE
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  public async handleAuthentication() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      this.clearAuthState();
      window.location.href = `/auth/login?error=${error}`;
      return;
    }

    if (code) {
      try {
        // The token is already exchanged in the callback route handler
        // We just need to redirect to dashboard immediately
        this.setAuthState({
          userId: 'spotify-user', // We'll use a generic user ID for Spotify users
          isAuthenticated: true,
          accessToken: 'spotify-auth', // This is just a placeholder
          expiresIn: Date.now() + 3600 * 1000 // 1 hour
        });

        // Redirect to dashboard directly
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Authentication failed:', error);
        this.clearAuthState();
        window.location.href = '/auth/login?error=auth_failed';
      }
    }
  }

  public async refreshToken() {
    try {
      // If there's already a refresh in progress, wait for it
      if (this.refreshPromise) {
        return await this.refreshPromise;
      }

      this.refreshPromise = (async () => {
        try {
          const response = await fetch(`${API_URL}/auth/spotify/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken: this.getRefreshToken() })
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          
          // Update Spotify service with new token
          this.spotifyService.setAccessToken(data.accessToken);
          
          return true;
        } catch (error) {
          console.error('Token refresh failed:', error);
          this.clearAuthState();
          return false;
        } finally {
          this.refreshPromise = null;
        }
      })();

      return await this.refreshPromise;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuthState();
      return false;
    }
  }

  public isAuthenticated(): boolean {
    return Cookies.get(IS_AUTHENTICATED_COOKIE) === 'true';
  }

  private getRefreshToken(): string | null {
    const authState = this.getAuthState();
    return authState?.refreshToken || null;
  }

  public clearAuthState(redirect: boolean = true): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    // Clear all auth-related cookies
    Cookies.remove(ACCESS_TOKEN_COOKIE);
    Cookies.remove(REFRESH_TOKEN_COOKIE);
    Cookies.remove(AUTH_STATE_COOKIE);
    Cookies.remove(IS_AUTHENTICATED_COOKIE);
    Cookies.remove(CODE_VERIFIER_COOKIE);
    localStorage.removeItem(this.AUTH_STATE_KEY);
    
    if (redirect && window.location.pathname !== '/auth/login') {
      window.location.href = '/auth/login';
    }
  }

  public getAuthState(): AuthState | null {
    const authState = Cookies.get(AUTH_STATE_COOKIE);
    return authState ? JSON.parse(authState) : null;
  }

  public setAuthState(state: AuthState): void {
    try {
      Cookies.set(AUTH_STATE_COOKIE, JSON.stringify(state));
      Cookies.set(IS_AUTHENTICATED_COOKIE, 'true');
      this.spotifyService.setAccessToken(state.accessToken || '');
      localStorage.setItem(this.AUTH_STATE_KEY, JSON.stringify(state));
      this.setupRefreshInterval();
    } catch (error) {
      console.error('Error setting auth state:', error);
    }
  }

  public getUserId(): string | null {
    const authState = this.getAuthState();
    return authState?.userId || null;
  }

  public async handleLoginCallback(code: string): Promise<void> {
    try {
      console.log('Handling login callback with code:', code);
      const response = await fetch(`${API_URL}/callback?code=${code}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json() as AuthResponse;
      
      if (!data.userId || !data.accessToken) {
        throw new Error('Invalid response from server');
      }

      // Set auth state
      Cookies.set(ACCESS_TOKEN_COOKIE, data.accessToken);
      Cookies.set(REFRESH_TOKEN_COOKIE, data.refreshToken || '');
      
      this.setAuthState({
        userId: data.userId,
        isAuthenticated: true,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      });

      console.log('Login successful, user ID:', data.userId);
      
      // Redirect to the stored path or dashboard
      const redirectPath = sessionStorage.getItem('redirect_after_login') || '/dashboard';
      sessionStorage.removeItem('redirect_after_login');
      window.location.href = redirectPath;
    } catch (error) {
      console.error('Login callback error:', error);
      this.clearAuthState(false);
      window.location.href = '/auth/login?error=auth_failed';
    }
  }
}

const authService = AuthService.getInstance();
export default authService;

export type { AuthState }; 