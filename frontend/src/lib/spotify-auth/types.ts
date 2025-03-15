// Spotify authentication types

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

export interface SpotifyUserProfile {
  country: string;
  display_name: string;
  email: string;
  explicit_content: {
    filter_enabled: boolean;
    filter_locked: boolean;
  };
  external_urls: {
    spotify: string;
  };
  followers: {
    href: string | null;
    total: number;
  };
  href: string;
  id: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  product: string;
  type: string;
  uri: string;
}

export interface RefreshResponse {
  success: boolean;
  access_token?: string;
  expires_in?: number;
  error?: string;
  message?: string;
  requireAuth?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SpotifyUserProfile | null;
  error: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
} 