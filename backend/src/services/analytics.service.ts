import { DatabaseService } from './database.service';
import { CacheService } from './cache.service';
import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

interface SessionAnalytics {
  totalSessions: number;
  activeSessions: number;
  averageSessionDuration: number;
  totalUsers: number;
  averageUsersPerSession: number;
}

interface PlaylistAnalytics {
  totalTracks: number;
  uniqueTracks: number;
  topGenres: Array<{ genre: string; count: number }>;
  averageTrackPopularity: number;
  mostAddedTracks: Array<{
    id: string;
    name: string;
    artists: string[];
    addCount: number;
  }>;
}

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  topArtists: Array<{ artist: string; count: number }>;
  topGenres: Array<{ genre: string; count: number }>;
  interactionsByType: Record<string, number>;
}

@Injectable()
export class AnalyticsService {
  private static instance: AnalyticsService;
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService
  ) {
    // Set the instance for singleton pattern backward compatibility
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = this;
    }
  }

  /**
   * Get singleton instance for backward compatibility
   * @deprecated Use dependency injection instead
   */
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      throw new Error('AnalyticsService not initialized. Use dependency injection instead of getInstance.');
    }
    return AnalyticsService.instance;
  }

  /**
   * Get session analytics
   */
  public async getSessionAnalytics(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<SessionAnalytics> {
    const cacheKey = `session_analytics:${timeRange?.start?.toISOString() || 'all'}:${timeRange?.end?.toISOString() || 'all'}`;

    const result = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const whereClause = timeRange
          ? {
              createdAt: {
                gte: timeRange.start,
                lte: timeRange.end,
              },
            }
          : {};

        const [
          totalSessions,
          activeSessions,
          sessionsWithUsers,
          totalUsers,
        ] = await Promise.all([
          this.databaseService.groupSession.count({
            where: whereClause,
          }),
          this.databaseService.groupSession.count({
            where: {
              ...whereClause,
              active: true,
            },
          }),
          this.databaseService.groupSession.findMany({
            where: whereClause,
            include: {
              _count: {
                select: { users: true },
              },
            },
          }),
          this.databaseService.user.count({
            where: {
              groupSessions: {
                some: whereClause,
              },
            },
          }),
        ]);

        const averageUsersPerSession =
          sessionsWithUsers.reduce(
            (sum, session) => sum + (session._count?.users || 0),
            0
          ) / totalSessions;

        const averageSessionDuration = await this.calculateAverageSessionDuration(
          whereClause
        );

        return {
          totalSessions,
          activeSessions,
          averageSessionDuration,
          totalUsers,
          averageUsersPerSession,
        };
      },
      this.CACHE_TTL
    );

    if (!result) {
      throw new Error('Failed to get session analytics from cache');
    }

    return result;
  }

  /**
   * Get playlist analytics
   */
  public async getPlaylistAnalytics(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<PlaylistAnalytics> {
    const cacheKey = `playlist_analytics:${timeRange?.start?.toISOString() || 'all'}:${timeRange?.end?.toISOString() || 'all'}`;

    const result = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const whereClause = timeRange
          ? {
              createdAt: {
                gte: timeRange.start,
                lte: timeRange.end,
              },
            }
          : {};

        const tracks = await this.databaseService.track.findMany({
          where: {
            playlists: {
              some: whereClause,
            },
          },
          include: {
            _count: {
              select: {
                playlists: true,
              },
            },
          },
        });

        const totalTracks = tracks.reduce(
          (sum, track) => sum + (track._count?.playlists || 0),
          0
        );
        const uniqueTracks = tracks.length;

        const genres = tracks.reduce((acc, track) => {
          track.artists.forEach((genre) => {
            acc[genre] = (acc[genre] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>);

        const topGenres = Object.entries(genres)
          .map(([genre, count]) => ({ genre, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const averageTrackPopularity =
          tracks.reduce((sum, track) => sum + track.popularity, 0) / tracks.length;

        const mostAddedTracks = tracks
          .map((track) => ({
            id: track.id,
            name: track.name,
            artists: track.artists,
            addCount: track._count?.playlists || 0,
          }))
          .sort((a, b) => b.addCount - a.addCount)
          .slice(0, 10);

        return {
          totalTracks,
          uniqueTracks,
          topGenres,
          averageTrackPopularity,
          mostAddedTracks,
        };
      },
      this.CACHE_TTL
    );

    if (!result) {
      throw new Error('Failed to get playlist analytics from cache');
    }

    return result;
  }

  /**
   * Get user analytics
   */
  public async getUserAnalytics(timeRange?: {
    start: Date;
    end: Date;
  }): Promise<UserAnalytics> {
    const cacheKey = `user_analytics:${timeRange?.start?.toISOString() || 'all'}:${timeRange?.end?.toISOString() || 'all'}`;

    const result = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const whereClause = timeRange
          ? {
              createdAt: {
                gte: timeRange.start,
                lte: timeRange.end,
              },
            }
          : {};

        const [
          totalUsers,
          activeUsers,
          userPreferences,
          interactions,
        ] = await Promise.all([
          this.databaseService.user.count({
            where: whereClause,
          }),
          this.databaseService.user.count({
            where: {
              ...whereClause,
              groupSessions: {
                some: {
                  active: true,
                },
              },
            },
          }),
          this.databaseService.userPreference.findMany({
            where: {
              user: whereClause,
            },
          }),
          this.databaseService.trackInteraction.findMany({
            where: {
              user: whereClause,
            },
          }),
        ]);

        const artistCounts = userPreferences.reduce((acc, pref) => {
          pref.topArtists.forEach((artist) => {
            acc[artist] = (acc[artist] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>);

        const topArtists = Object.entries(artistCounts)
          .map(([artist, count]) => ({ artist, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const genreCounts = userPreferences.reduce((acc, pref) => {
          pref.genres.forEach((genre) => {
            acc[genre] = (acc[genre] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>);

        const topGenres = Object.entries(genreCounts)
          .map(([genre, count]) => ({ genre, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const interactionsByType = interactions.reduce((acc, interaction) => {
          acc[interaction.type] = (acc[interaction.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          totalUsers,
          activeUsers,
          topArtists,
          topGenres,
          interactionsByType,
        };
      },
      this.CACHE_TTL
    );

    if (!result) {
      throw new Error('Failed to get user analytics from cache');
    }

    return result;
  }

  /**
   * Calculate average session duration
   */
  private async calculateAverageSessionDuration(
    whereClause: Prisma.GroupSessionWhereInput
  ): Promise<number> {
    const cacheKey = `avg_session_duration:${JSON.stringify(whereClause)}`;

    const result = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const sessions = await this.databaseService.groupSession.findMany({
          where: {
            ...whereClause,
            active: false,
          },
          select: {
            createdAt: true,
            updatedAt: true,
          },
        });

        if (sessions.length === 0) return 0;

        const totalDuration = sessions.reduce(
          (sum, session) =>
            sum + (session.updatedAt.getTime() - session.createdAt.getTime()),
          0
        );

        return totalDuration / sessions.length / 1000;
      },
      this.CACHE_TTL
    );

    return result ?? 0;
  }

  /**
   * Invalidate analytics cache
   */
  public async invalidateCache(): Promise<void> {
    const keys = await this.cacheService.keys('*analytics*');
    await this.cacheService.mdel(keys);
  }
} 