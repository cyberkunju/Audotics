import { Controller, Get, Post, Body, Query, Res, UnauthorizedException, Req, Logger } from '@nestjs/common';
import { SpotifyAuthService } from '../auth/services/spotify-auth.service';
import { Response, Request } from 'express';
import { SpotifyTokens, SpotifyUser } from '../auth/interfaces/auth.interface';
import { CookieOptions } from 'express';
import { CODE_VERIFIER_COOKIE } from '../constants/auth';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(private readonly spotifyAuthService: SpotifyAuthService) {}

  // Common cookie settings
  private getCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: true,  // Changed to true for cross-domain cookie sharing
      sameSite: 'none', // Required for cross-domain cookies
      path: '/',
    };
  }
  
  // Clear all auth cookies
  private clearAuthCookies(response: Response): void {
    const cookieOptions = { 
      path: '/',
      secure: true,
      sameSite: 'none' as const,
    };
    
    response.clearCookie('spotify_access_token', cookieOptions);
    response.clearCookie('spotify_refresh_token', cookieOptions);
    response.clearCookie('is_authenticated', cookieOptions);
    response.clearCookie('auth_success', cookieOptions);
    
    this.logger.log('Auth cookies cleared');
  }

  @Get('spotify/login')
  async login(@Query('code_challenge') codeChallenge: string, @Res() response: Response) {
    try {
      this.logger.log('Spotify login initiated');
      this.logger.log('Redirect URI:', process.env.SPOTIFY_REDIRECT_URI);
      
      if (codeChallenge) {
        // PKCE flow
        this.logger.log('Using PKCE flow with challenge:', codeChallenge);
        const { url, state } = await this.spotifyAuthService.getAuthUrl(codeChallenge);
        this.logger.log('Generated Spotify auth URL:', url);
        response.redirect(url);
      } else {
        // Standard flow
        this.logger.log('Using standard OAuth flow');
        const authUrl = await this.spotifyAuthService.getAuthorizationUrl();
        this.logger.log('Generated Spotify auth URL:', authUrl);
        response.redirect(authUrl);
      }
    } catch (error) {
      this.logger.error('Login error:', error);
      throw new UnauthorizedException('Failed to initiate login');
    }
  }

  @Get('spotify/callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    this.logger.log(`Auth callback with code: ${code ? 'provided' : 'missing'}`);
    
    try {
      if (!code) {
        throw new UnauthorizedException('Authorization code is required');
      }

      // Get code verifier from cookies
      const codeVerifier = request.cookies[CODE_VERIFIER_COOKIE];
      this.logger.log(`Code verifier from cookies: ${codeVerifier ? 'found' : 'missing'}`);

      // Exchange code for tokens
      const tokens = await this.spotifyAuthService.handleCallback(code, state, codeVerifier);
      
      if (!tokens || !tokens.access_token || !tokens.refresh_token) {
        this.logger.error('Failed to obtain tokens from code');
        throw new UnauthorizedException('Failed to authenticate with Spotify');
      }
      
      this.logger.log('Successfully obtained tokens from Spotify');

      // Get cookie options
      const cookieOpts = this.getCookieOptions();
      
      // Set cookies - use explicit maxAge settings for development
      response.cookie('spotify_access_token', tokens.access_token, {
        ...cookieOpts,
        maxAge: tokens.expires_in * 1000, // Convert seconds to milliseconds
      });
      
      response.cookie('spotify_refresh_token', tokens.refresh_token, {
        ...cookieOpts,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      
      response.cookie('spotify_token_expiry', new Date(Date.now() + tokens.expires_in * 1000).toISOString(), {
        ...cookieOpts,
        maxAge: tokens.expires_in * 1000,
      });
      
      // Debug info
      this.logger.log('Auth cookies set successfully');
      
      // Redirect to dashboard
      return response.redirect(302, process.env.FRONTEND_URL || 'http://localhost:3000/dashboard');
    } catch (error) {
      this.logger.error(`Auth callback error: ${error.message}`);
      
      // Clear any partial auth cookies
      this.clearAuthCookies(response);
      
      // Redirect to error page
      return response.redirect(302, `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?error=${encodeURIComponent(error.message)}`);
    }
  }

  @Post('spotify/refresh')
  async refresh(@Req() request: Request, @Res() response: Response) {
    const refreshToken = request.cookies['spotify_refresh_token'];
    this.logger.log('Refresh attempt with token:');
    this.logger.log(refreshToken || 'missing');
    
    try {
      if (!refreshToken) {
        this.logger.error('No refresh token found in cookies');
        this.clearAuthCookies(response);
        return response.status(401).json({ error: 'No refresh token found' });
      }
      
      // Attempt to refresh the token
      const tokens = await this.spotifyAuthService.refreshToken(refreshToken);
      
      if (!tokens || !tokens.access_token) {
        this.logger.error('Failed to refresh token');
        this.clearAuthCookies(response);
        return response.status(401).json({ error: 'Failed to refresh token' });
      }
      
      // Get cookie options
      const cookieOpts = this.getCookieOptions();
      
      // Set new access token cookie with explicit cookie options
      response.cookie('spotify_access_token', tokens.access_token, {
        ...cookieOpts,
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: tokens.expires_in * 1000,
      });
      
      // Set is_authenticated flag that JavaScript can read
      response.cookie('is_authenticated', 'true', {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
      
      // Set new expiry time
      response.cookie('spotify_token_expiry', new Date(Date.now() + tokens.expires_in * 1000).toISOString(), {
        ...cookieOpts,
        maxAge: tokens.expires_in * 1000,
      });
      
      // If a new refresh token was provided, update it
      if (tokens.refresh_token) {
        response.cookie('spotify_refresh_token', tokens.refresh_token, {
          ...cookieOpts,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
      }
      
      this.logger.log('Token refreshed successfully');
      return response.status(200).json({ success: true });
    } catch (error) {
      this.logger.error(`Refresh error: ${error.message}`);
      this.clearAuthCookies(response);
      return response.status(401).json({ error: error.message });
    }
  }

  @Get('spotify/user')
  async getUser(@Req() request: Request): Promise<SpotifyUser> {
    try {
      const accessToken = request.cookies['spotify_access_token'];
      
      if (!accessToken) {
        this.logger.error('No access token found in cookies');
        throw new UnauthorizedException('No access token found');
      }

      return await this.spotifyAuthService.getUserProfile(accessToken);
    } catch (error) {
      this.logger.error('Get user error:', error);
      throw new UnauthorizedException('Failed to get user profile');
    }
  }

  @Post('spotify/logout')
  async logout(@Res() response: Response) {
    // Clear all auth cookies
    this.clearAuthCookies(response);
    
    return response.json({ success: true });
  }
}