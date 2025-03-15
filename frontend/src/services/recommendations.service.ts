import { SpotifyService } from './spotify.service';

export interface RecommendationPreferences {
  energy?: number;
  danceability?: number;
  valence?: number;
  acousticness?: number;
  popularity?: number;
}

export class RecommendationsService {
  private static instance: RecommendationsService;
  private spotifyService: SpotifyService;

  private constructor() {
    this.spotifyService = SpotifyService.getInstance();
  }

  static getInstance(): RecommendationsService {
    if (!RecommendationsService.instance) {
      RecommendationsService.instance = new RecommendationsService();
    }
    return RecommendationsService.instance;
  }

  async getPersonalizedRecommendations(preferences?: RecommendationPreferences) {
    try {
      // Get user's top tracks
      const topTracks = await this.spotifyService.getTopTracks(5);
      const seedTracks = topTracks.items.map((track: any) => track.id);

      // Get recommendations based on top tracks and preferences
      const recommendations = await this.spotifyService.getRecommendations(seedTracks, 20);

      // Get audio features for recommended tracks
      const trackIds = recommendations.tracks.map((track: any) => track.id);
      const audioFeatures = await this.spotifyService.getTrackFeatures(trackIds[0]);

      // Process recommendations with our AI engine
      const enhancedRecommendations = await this.processWithAIEngine(
        recommendations.tracks,
        audioFeatures,
        preferences
      );

      return enhancedRecommendations;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      throw error;
    }
  }

  private async processWithAIEngine(tracks: any[], audioFeatures: any, preferences?: RecommendationPreferences) {
    try {
      // Call our AI engine API
      const response = await fetch('/api/recommendations/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tracks,
          audioFeatures,
          preferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process recommendations with AI engine');
      }

      const enhancedRecommendations = await response.json();
      return enhancedRecommendations;
    } catch (error) {
      console.error('Error processing recommendations with AI:', error);
      return tracks; // Fallback to original recommendations if AI processing fails
    }
  }

  async createRecommendationPlaylist(tracks: any[]) {
    try {
      const user = await this.spotifyService.getCurrentUser();
      
      // Create a new playlist
      const playlist = await this.spotifyService.createPlaylist(
        user.id,
        'Audotics Recommendations',
        'Personalized recommendations powered by Audotics AI'
      );

      // Add tracks to the playlist
      const trackUris = tracks.map((track: any) => track.uri);
      await this.spotifyService.addTracksToPlaylist(playlist.id, trackUris);

      return playlist;
    } catch (error) {
      console.error('Error creating recommendation playlist:', error);
      throw error;
    }
  }
} 