export interface SpotifyTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string; height: number; width: number }>;
  product: string;
  uri: string;
  followers: { total: number };
  country: string;
  external_urls: { spotify: string };
}

export interface AuthResponse {
  success: boolean;
  access_token: string;
  expires_in: number;
  user?: SpotifyUser;
}

export interface TokenFamily {
  id: string;
  userId: string;
  refreshToken: string;
  createdAt: number;
  lastUsed: number;
} 
