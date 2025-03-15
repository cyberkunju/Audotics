import axios from 'axios';
import { AuthService, type AuthState } from './auth.service';
import { SpotifyTokens, SpotifyUser } from '@/types/spotify';

// Define interfaces for Spotify data
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { id: string; name: string; images: { url: string }[] };
  uri: string;
  duration_ms: number;
  popularity: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: { url: string }[];
  popularity: number;
}

export interface SpotifyAudioFeatures {
  id: string;
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
  duration_ms: number;
  time_signature: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  owner: { id: string; display_name: string };
  tracks: { total: number };
  uri: string;
}

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export class SpotifyService {
  private static instance: SpotifyService;
  private accessToken: string | null = null;

  private constructor() {}

  static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async fetchWithToken(endpoint: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${SPOTIFY_API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, need to refresh
        throw new Error('Token expired');
      }
      throw new Error(`Spotify API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getCurrentUser(): Promise<SpotifyUser> {
    const data = await this.fetchWithToken('/me');
    return {
      id: data.id,
      display_name: data.display_name,
      email: data.email,
      images: data.images,
    };
  }

  async getTopTracks(limit: number = 20): Promise<any> {
    return this.fetchWithToken(`/me/top/tracks?limit=${limit}`);
  }

  async getRecommendations(seedTracks: string[], limit: number = 20): Promise<any> {
    const params = new URLSearchParams({
      seed_tracks: seedTracks.join(','),
      limit: limit.toString(),
    });
    return this.fetchWithToken(`/recommendations?${params.toString()}`);
  }

  async getTrackFeatures(trackId: string): Promise<any> {
    return this.fetchWithToken(`/audio-features/${trackId}`);
  }

  async getPlaylist(playlistId: string): Promise<any> {
    return this.fetchWithToken(`/playlists/${playlistId}`);
  }

  async createPlaylist(userId: string, name: string, description: string): Promise<any> {
    return this.fetchWithToken(`/users/${userId}/playlists`, {
      method: 'POST',
      body: JSON.stringify({
        name,
        description,
        public: false,
      }),
    });
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<any> {
    return this.fetchWithToken(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({
        uris: trackUris,
      }),
    });
  }

  // User's top items
  public async getTopArtists(timeRange = 'medium_term'): Promise<SpotifyArtist[]> {
    const response = await this.fetchWithToken(`/me/top/artists?time_range=${timeRange}`);
    return response.items;
  }

  // User's saved tracks
  public async getSavedTracks(limit = 20, offset = 0): Promise<{ items: { track: SpotifyTrack }[]; total: number }> {
    const response = await this.fetchWithToken(`/me/tracks?limit=${limit}&offset=${offset}`);
    return {
      items: response.items.map((item: any) => ({ track: item.track })),
      total: response.total,
    };
  }

  // Search
  public async search(query: string, type = 'track', limit = 20): Promise<any> {
    const response = await this.fetchWithToken(`/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`);
    return response;
  }

  // Audio features
  public async getAudioFeatures(trackIds: string[]): Promise<{ audio_features: SpotifyAudioFeatures[] }> {
    const response = await this.fetchWithToken(`/audio-features?ids=${trackIds.join(',')}`);
    return { audio_features: response.audio_features };
  }

  // Genres
  public async getAvailableGenres(): Promise<{ genres: string[] }> {
    const response = await this.fetchWithToken('/recommendations/available-genre-seeds');
    return { genres: response.genres };
  }

  // Tracks
  public async getTrack(trackId: string): Promise<SpotifyTrack> {
    const response = await this.fetchWithToken(`/tracks/${trackId}`);
    return response;
  }

  public async getTracks(trackIds: string[]): Promise<{ tracks: SpotifyTrack[] }> {
    const response = await this.fetchWithToken(`/tracks?ids=${trackIds.join(',')}`);
    return { tracks: response.items };
  }

  // Group recommendations
  public async getGroupRecommendations(userPreferences: {
    topArtistIds: string[];
    topTrackIds: string[];
    favoriteGenres: string[];
    audioFeatures: {
      energy: number;
      danceability: number;
      valence: number;
      acousticness: number;
    };
  }[]): Promise<{ tracks: SpotifyTrack[] }> {
    const response = await this.fetchWithToken('/recommendations', {
      method: 'POST',
      body: JSON.stringify({
        userPreferences,
      }),
    });
    return { tracks: response.tracks };
  }
}

// Export a singleton instance
const spotifyService = SpotifyService.getInstance();
export default spotifyService; 