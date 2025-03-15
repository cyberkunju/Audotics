import { Injectable } from '@nestjs/common';
import axios from 'axios';
import querystring from 'querystring';
import { config } from '../config';
import { DatabaseService } from './database.service';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string };
  uri: string;
}

interface SpotifyAudioFeatures {
  danceability: number;
  energy: number;
  key: number;
  loudness: number;
  mode: number;
  speechiness: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  valence: number;
  tempo: number;
}

@Injectable()
export class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl: string = 'https://api.spotify.com/v1';
  private authUrl: string = 'https://accounts.spotify.com/api/token';
  
  // Singleton instance for backward compatibility
  private static instance: SpotifyService;

  /**
   * Get or create singleton instance for backward compatibility
   * @deprecated Use dependency injection instead
   */
  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      const dbService = DatabaseService.getInstance();
      SpotifyService.instance = new SpotifyService(dbService);
    }
    return SpotifyService.instance;
  }

  constructor(
    private readonly databaseService: DatabaseService
  ) {
    this.clientId = config.spotify.clientId;
    this.clientSecret = config.spotify.clientSecret;
    this.redirectUri = config.spotify.redirectUri;
  }

  /**
   * Generate authorization URL for Spotify OAuth
   */
  public getAuthUrl(): string {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'playlist-modify-public',
      'playlist-modify-private'
    ];

    return 'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: this.clientId,
        scope: scopes.join(' '),
        redirect_uri: this.redirectUri
      });
  }

  /**
   * Alias for getAuthUrl to maintain compatibility with existing code
   */
  public getAuthorizeURL(): string {
    return this.getAuthUrl();
  }

  /**
   * Exchange authorization code for access token
   */
  public async getTokens(code: string): Promise<{ access_token: string, refresh_token: string, expires_in: number }> {
    try {
      const response = await axios({
        method: 'post',
        url: this.authUrl,
        data: querystring.stringify({
          code,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code'
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64')
        }
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      console.error('Error getting tokens from Spotify:', error);
      throw new Error('Failed to get tokens from Spotify');
    }
  }

  /**
   * Refresh an expired access token
   */
  public async refreshAccessToken(refreshToken: string): Promise<{ access_token: string, refresh_token?: string, expires_in: number }> {
    try {
      const response = await axios({
        method: 'post',
        url: this.authUrl,
        data: querystring.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64')
        }
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Make authenticated request to Spotify API
   */
  private async makeApiRequest(endpoint: string, accessToken: string, method = 'GET', data: any = null): Promise<any> {
    try {
      const options: any = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      };

      if (method !== 'GET' && data) {
        options.data = data;
      } else if (method === 'GET' && data) {
        options.params = data;
      }

      const response = await axios(options);
      return response.data;
    } catch (error: any) {
      console.error('Spotify API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  public async getUserProfile(accessToken: string): Promise<any> {
    return this.makeApiRequest('/me', accessToken);
  }

  /**
   * Get current user profile (alias for getUserProfile for backward compatibility)
   */
  public async getCurrentUser(accessToken: string): Promise<any> {
    return this.getUserProfile(accessToken);
  }

  /**
   * Get user's top tracks
   */
  public async getUserTopTracks(accessToken: string, timeRange = 'medium_term', limit = 20): Promise<any> {
    return this.makeApiRequest('/me/top/tracks', accessToken, 'GET', {
      time_range: timeRange,
      limit
    });
  }

  /**
   * Get user's top artists
   */
  public async getUserTopArtists(accessToken: string, timeRange = 'medium_term', limit = 20): Promise<any> {
    return this.makeApiRequest('/me/top/artists', accessToken, 'GET', {
      time_range: timeRange,
      limit
    });
  }

  /**
   * Get recommendations based on seed data
   */
  public async getRecommendations(accessToken: string, options: {
    seed_artists?: string | string[],
    seed_tracks?: string | string[],
    seed_genres?: string | string[],
    limit?: number,
    target_energy?: number,
    target_danceability?: number,
    target_valence?: number,
    target_acousticness?: number,
    target_popularity?: number,
    min_energy?: number,
    max_energy?: number,
    min_danceability?: number,
    max_danceability?: number,
    min_valence?: number,
    max_valence?: number,
    min_acousticness?: number,
    max_acousticness?: number,
    min_popularity?: number,
    max_popularity?: number
  }): Promise<any[]> {
    // Format options for Spotify API
    const apiOptions: Record<string, any> = { ...options };
    
    // Convert seed_artists array to comma-separated string if it exists
    if (apiOptions.seed_artists && Array.isArray(apiOptions.seed_artists)) {
      apiOptions.seed_artists = apiOptions.seed_artists.join(',');
    }
    
    // Convert seed_tracks array to comma-separated string if it exists
    if (apiOptions.seed_tracks && Array.isArray(apiOptions.seed_tracks)) {
      apiOptions.seed_tracks = apiOptions.seed_tracks.join(',');
    }
    
    // Convert seed_genres array to comma-separated string if it exists
    if (apiOptions.seed_genres && Array.isArray(apiOptions.seed_genres)) {
      apiOptions.seed_genres = apiOptions.seed_genres.join(',');
    }

    const response = await this.makeApiRequest('/recommendations', accessToken, 'GET', apiOptions);
    return response.tracks;
  }

  /**
   * Create a new playlist
   */
  public async createPlaylist(accessToken: string, userId: string, name: string, description: string = ''): Promise<any> {
    return this.makeApiRequest(`/users/${userId}/playlists`, accessToken, 'POST', {
      name,
      description,
      public: false,
      collaborative: true
    });
  }

  /**
   * Add tracks to a playlist
   */
  public async addTracksToPlaylist(accessToken: string, playlistId: string, trackUris: string[]): Promise<any> {
    return this.makeApiRequest(`/playlists/${playlistId}/tracks`, accessToken, 'POST', {
      uris: trackUris
    });
  }

  /**
   * Get user's saved tracks
   */
  async getUserSavedTracks(accessToken: string, limit = 20, offset = 0): Promise<any> {
    return this.makeApiRequest('/me/tracks', accessToken, 'GET', {
      limit,
      offset
    });
  }

  /**
   * Search for tracks, artists, albums
   */
  async search(accessToken: string, query: string, type = 'track', limit = 20): Promise<any> {
    return this.makeApiRequest('/search', accessToken, 'GET', {
      q: query,
      type,
      limit,
    });
  }

  /**
   * Get audio features for multiple tracks
   */
  async getAudioFeatures(accessToken: string, trackIds: string[]): Promise<any> {
    return this.makeApiRequest('/audio-features', accessToken, 'GET', {
      ids: trackIds.join(',')
    });
  }

  /**
   * Get available genre seeds
   */
  async getAvailableGenreSeeds(accessToken: string): Promise<any> {
    return this.makeApiRequest('/recommendations/available-genre-seeds', accessToken);
  }

  /**
   * Get a track
   */
  async getTrack(accessToken: string, trackId: string): Promise<any> {
    return this.makeApiRequest(`/tracks/${trackId}`, accessToken);
  }

  /**
   * Get multiple tracks
   */
  async getTracks(accessToken: string, trackIds: string[]): Promise<any> {
    if (!trackIds.length) return { tracks: [] };
    return this.makeApiRequest(`/tracks?ids=${trackIds.join(',')}`, accessToken);
  }

  /**
   * Get group recommendations based on all users' preferences
   */
  async getGroupRecommendations(
    accessToken: string,
    userPreferences: {
      topArtistIds: string[];
      topTrackIds: string[];
      favoriteGenres: string[];
      audioFeatures: {
        energy: number;
        danceability: number;
        valence: number;
        acousticness: number;
      };
    }[]
  ): Promise<any> {
    // Aggregate preferences from all users
    const allArtistIds = userPreferences.flatMap(pref => pref.topArtistIds);
    const allTrackIds = userPreferences.flatMap(pref => pref.topTrackIds);
    const allGenres = userPreferences.flatMap(pref => pref.favoriteGenres);
    
    // Calculate average audio features
    const avgAudioFeatures = {
      energy: 0,
      danceability: 0,
      valence: 0,
      acousticness: 0,
    };
    
    userPreferences.forEach(pref => {
      avgAudioFeatures.energy += pref.audioFeatures.energy;
      avgAudioFeatures.danceability += pref.audioFeatures.danceability;
      avgAudioFeatures.valence += pref.audioFeatures.valence;
      avgAudioFeatures.acousticness += pref.audioFeatures.acousticness;
    });
    
    const userCount = userPreferences.length;
    if (userCount > 0) {
      avgAudioFeatures.energy /= userCount;
      avgAudioFeatures.danceability /= userCount;
      avgAudioFeatures.valence /= userCount;
      avgAudioFeatures.acousticness /= userCount;
    }
    
    // Select seed tracks and artists (up to 5 total)
    const seedArtists = [...new Set(allArtistIds)].slice(0, 2);
    const seedTracks = [...new Set(allTrackIds)].slice(0, 2);
    
    // Select seed genres (up to 1)
    // Count genre frequencies
    const genreFrequency: Record<string, number> = allGenres.reduce((acc, genre) => {
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Sort by frequency
    const sortedGenres = Object.entries(genreFrequency)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([genre]) => genre);
    
    const seedGenres = sortedGenres.slice(0, 1);
    
    // Get recommendations using the aggregated preferences
    return this.getRecommendations(accessToken, {
      seed_artists: seedArtists,
      seed_tracks: seedTracks,
      seed_genres: seedGenres,
      target_energy: avgAudioFeatures.energy,
      target_danceability: avgAudioFeatures.danceability,
      target_valence: avgAudioFeatures.valence,
      target_acousticness: avgAudioFeatures.acousticness,
      limit: 20,
    });
  }

  /**
   * Get a playlist by ID
   */
  async getPlaylist(accessToken: string, playlistId: string): Promise<any> {
    return this.makeApiRequest(`/playlists/${playlistId}`, accessToken);
  }
  
  /**
   * Get a playlist's tracks
   */
  async getPlaylistTracks(accessToken: string, playlistId: string): Promise<any> {
    const response = await this.makeApiRequest(`/playlists/${playlistId}/tracks`, accessToken);
    return response.items.map((item: any) => item.track);
  }
}

