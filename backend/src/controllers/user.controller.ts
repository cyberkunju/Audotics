import { Request, Response } from 'express';
import { SpotifyService } from '../services/spotify.service';
import { DatabaseService } from '../services/database.service';

export class UserController {
  private spotifyService: SpotifyService;
  private db: DatabaseService;

  constructor(spotifyService: SpotifyService, dbService: DatabaseService) {
    this.spotifyService = spotifyService;
    this.db = dbService;
  }

  public register = async (req: Request, res: Response) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      // Get access token from Spotify
      const tokenData = await this.spotifyService.getTokens(code);
      
      // Get user profile from Spotify
      const profile = await this.spotifyService.getUserProfile(tokenData.access_token);

      // Create or update user in database
      const user = await this.db.user.upsert({
        where: { email: profile.email },
        create: {
          email: profile.email,
          name: profile.display_name,
          spotifyId: profile.id,
          spotifyAccessToken: tokenData.access_token,
          spotifyRefreshToken: tokenData.refresh_token
        },
        update: {
          email: profile.email,
          name: profile.display_name,
          spotifyAccessToken: tokenData.access_token,
          spotifyRefreshToken: tokenData.refresh_token
        }
      });

      return res.json({
        user,
        tokens: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token
        }
      });
    } catch (error: any) {
      console.error('Error in register:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };

  public login = async (req: Request, res: Response) => {
    // For now, just return the Spotify auth URL
    const authUrl = this.spotifyService.getAuthUrl();
    return res.json({ authUrl });
  };

  public getProfile = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await this.db.user.findUnique({
        where: { id: userId },
        include: { preferences: true }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(user);
    } catch (error: any) {
      console.error('Error in getProfile:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };

  public updateProfile = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { displayName } = req.body;

      const user = await this.db.user.update({
        where: { id: userId },
        data: { name: displayName }
      });

      return res.json(user);
    } catch (error: any) {
      console.error('Error in updateProfile:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };

  public getPreferences = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const preferences = await this.db.userPreference.findUnique({
        where: { userId }
      });

      if (!preferences) {
        return res.status(404).json({ error: 'Preferences not found' });
      }

      return res.json(preferences);
    } catch (error: any) {
      console.error('Error in getPreferences:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };

  public updatePreferences = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { genres, features } = req.body;

      const preferences = await this.db.userPreference.upsert({
        where: { userId },
        create: {
          userId,
          genres: genres || [],
          features: features || {},
          topTracks: [],
          topArtists: []
        },
        update: {
          genres: genres || [],
          features: features || {}
        }
      });

      return res.json(preferences);
    } catch (error: any) {
      console.error('Error in updatePreferences:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    }
  };
} 