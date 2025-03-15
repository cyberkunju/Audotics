export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images?: Array<{ url: string }>;
}

export interface SpotifyTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface AuthState {
  userId: string;
  isAuthenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: SpotifyUser;
} 