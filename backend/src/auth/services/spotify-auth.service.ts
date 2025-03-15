import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SpotifyWebApi from 'spotify-web-api-node';
import { TokenService } from './token.service';
import { SpotifyTokens, SpotifyUser } from '../interfaces/auth.interface';
import * as crypto from 'crypto';

@Injectable()
export class SpotifyAuthService {
  private readonly spotifyApi: SpotifyWebApi;
  private readonly states: Set<string> = new Set();
  private readonly clientId = process.env.SPOTIFY_CLIENT_ID;
  private readonly clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  private readonly redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3002/auth/spotify/callback';

  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {
    this.spotifyApi = new SpotifyWebApi({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
      redirectUri: this.redirectUri,
    });
    
    console.log('SPOTIFY AUTH SERVICE INITIALIZED:');
    console.log('Client ID:', this.clientId);
    console.log('Redirect URI:', this.redirectUri);
  }

  private generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(values[i] % possible.length);
    }
    return text;
  }

  async getAuthUrl(codeChallenge: string): Promise<{ url: string; state: string }> {
    const state = this.generateRandomString(16);
    this.states.add(state);

    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-library-read',
      'user-library-modify',
      'user-top-read'
    ];

    const params = new URLSearchParams();
    params.append('response_type', 'code');
    params.append('client_id', this.clientId || '');
    params.append('scope', scopes.join(' '));
    params.append('redirect_uri', this.redirectUri || '');
    params.append('state', state);
    params.append('code_challenge_method', 'S256');
    params.append('code_challenge', codeChallenge);

    return { 
      url: `https://accounts.spotify.com/authorize?${params.toString()}`,
      state 
    };
  }

  async getAuthorizationUrl(): Promise<string> {
    const state = this.generateRandomString(16);
    this.states.add(state);
    const scope = 'user-read-private user-read-email playlist-read-private playlist-modify-public playlist-modify-private user-library-read user-library-modify user-top-read';
    
    console.log('SPOTIFY AUTH DEBUG - getAuthorizationUrl():');
    console.log('Client ID:', this.clientId);
    console.log('Redirect URI:', this.redirectUri);
    console.log('State:', state);
    
    const params = new URLSearchParams();
    params.append('response_type', 'code');
    params.append('client_id', this.clientId || '');
    params.append('scope', scope);
    params.append('redirect_uri', this.redirectUri || '');
    params.append('state', state);
    params.append('show_dialog', 'true');
    
    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
    console.log('Generated Auth URL:', authUrl);
    
    return authUrl;
  }

  async handleCallback(code: string, state: string, codeVerifier?: string): Promise<SpotifyTokens> {
    console.log('SPOTIFY AUTH DEBUG - handleCallback():');
    console.log('Code received (first 10 chars):', code.substring(0, 10) + '...');
    console.log('State received:', state);
    console.log('Code verifier provided:', codeVerifier ? 'Yes' : 'No');
    
    const tokens = await this.exchangeCode(code, codeVerifier);
    console.log('Tokens received:', tokens ? 'Success' : 'Failed');
    
    return tokens;
  }

  private async exchangeCode(code: string, codeVerifier?: string): Promise<SpotifyTokens> {
    console.log('SPOTIFY AUTH DEBUG - exchangeCode():');
    console.log('Exchanging code for tokens');
    console.log('Using redirect URI:', this.redirectUri);
    console.log('Using code verifier:', codeVerifier ? 'Yes' : 'No');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', this.redirectUri || '');
    
    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }
    
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      console.log('Token response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Token exchange error:', errorData);
        throw new UnauthorizedException('Failed to exchange code for tokens: ' + errorData);
      }

      const data = await response.json() as SpotifyTokens;
      console.log('Token exchange successful');
      
      return data;
    } catch (error) {
      console.error('Token exchange exception:', error);
      throw new UnauthorizedException('Failed to exchange code for tokens');
    }
  }

  async refreshToken(refreshToken: string): Promise<SpotifyTokens> {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to refresh token');
    }

    const data = await response.json() as SpotifyTokens;
    return data;
  }

  async getUserProfile(accessToken: string): Promise<SpotifyUser> {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('Successfully fetched user profile for:', data.id);
      return {
        id: data.id,
        display_name: data.display_name || data.id,
        email: data.email,
        images: data.images || [],
        product: data.product || 'free',
        uri: data.uri || '',
        followers: data.followers || { total: 0 },
        country: data.country || '',
        external_urls: data.external_urls || { spotify: '' }
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
} 