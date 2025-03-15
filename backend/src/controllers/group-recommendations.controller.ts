import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { SpotifyService } from '../services/spotify.service';
import { UserService } from '../services/user.service';
import { DatabaseService } from '../services/database.service';
import { AuthGuard } from '../guards/auth.guard';

@Controller('api/sessions/:sessionId/recommendations')
export class GroupRecommendationsController {
  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly userService: UserService,
    private readonly db: DatabaseService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async getRecommendations(@Param('sessionId') sessionId: string, @Req() req: any) {
    try {
      // Get the session with users
      const session = await this.db.groupSession.findUnique({
        where: { id: sessionId },
        include: {
          users: {
            include: {
              preferences: true
            }
          }
        }
      });

      if (!session) {
        return {
          error: 'Session not found',
          aggregatedPreferences: {}
        };
      }

      // Get the user making the request
      const userId = req.user.id;
      const user = await this.db.user.findUnique({
        where: { id: userId },
        select: { 
          id: true,
          spotifyAccessToken: true,
          spotifyTokenExpiry: true
        }
      });

      if (!user) {
        return {
          error: 'User not found',
          aggregatedPreferences: {}
        };
      }

      // Aggregate user preferences
      const userPreferences = this.aggregateUserPreferences(session.users);

      // Check if the user has a valid Spotify token
      if (!user.spotifyAccessToken) {
        return {
          error: 'Spotify authentication required',
          aggregatedPreferences: userPreferences
        };
      }

      // Format preferences for Spotify API
      const spotifyPreferences = session.users
        .filter(user => user.preferences)
        .map(user => ({
          topArtistIds: user.preferences?.topArtists || [],
          topTrackIds: user.preferences?.topTracks || [],
          favoriteGenres: user.preferences?.genres || [],
          audioFeatures: {
            energy: (user.preferences?.features as any)?.energy || 0.5,
            danceability: (user.preferences?.features as any)?.danceability || 0.5,
            valence: (user.preferences?.features as any)?.valence || 0.5,
            acousticness: (user.preferences?.features as any)?.acousticness || 0.5
          }
        }));

      if (spotifyPreferences.length > 0) {
        const recommendations = await this.spotifyService.getGroupRecommendations(
          user.spotifyAccessToken, 
          spotifyPreferences
        );

        return {
          recommendations: recommendations.tracks,
          aggregatedPreferences: userPreferences
        };
      }

      // Fallback if no user preferences are available
      return {
        recommendations: [],
        aggregatedPreferences: userPreferences
      };
    } catch (error: unknown) {
      console.error('Error getting group recommendations:', error);
      return {
        error: 'Error getting recommendations',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private aggregateUserPreferences(users: any[]): any {
    // Define feature keys with proper typing
    const featureKeys = ['danceability', 'energy', 'valence', 'tempo'] as const;
    type FeatureKey = typeof featureKeys[number];
    
    // Initialize with proper typing
    const featuresSum: Record<FeatureKey, number> = {
      danceability: 0,
      energy: 0,
      valence: 0,
      tempo: 0
    };
    
    const genreCounts: Record<string, number> = {};
    const artistCounts: Record<string, number> = {};
    
    let userCount = 0;

    users.forEach(user => {
      if (user.preferences) {
        userCount++;
        
        // Sum audio features
        featureKeys.forEach(feature => {
          if (user.preferences.features && user.preferences.features[feature] !== undefined) {
            featuresSum[feature] += user.preferences.features[feature];
          }
        });

        // Count genres
        if (user.preferences.genres) {
          user.preferences.genres.forEach((genre: string) => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          });
        }

        // Count artists
        if (user.preferences.topArtists) {
          user.preferences.topArtists.forEach((artist: string) => {
            artistCounts[artist] = (artistCounts[artist] || 0) + 1;
          });
        }
      }
    });

    // Calculate average features
    const avgFeatures: Record<FeatureKey, number> = {} as Record<FeatureKey, number>;
    featureKeys.forEach(feature => {
      avgFeatures[feature] = userCount > 0 ? featuresSum[feature] / userCount : 0;
    });

    // Sort genres and artists by count
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 5)
      .map(([genre]) => genre);

    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 5)
      .map(([artist]) => artist);

    return {
      features: avgFeatures,
      genres: topGenres,
      artists: topArtists
    };
  }
} 