import { Controller, Get, Post, Query, UseGuards, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { AuthGuard } from '../guards/auth.guard';
import { z } from 'zod';

// Validation schema for time range
const timeRangeSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  range: z.enum(['day', 'week', 'month', 'year']).optional()
});

type TimeRangeQuery = z.infer<typeof timeRangeSchema>;

// Interface definitions for analytics return types
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

interface CacheResponse {
  message: string;
}

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get session analytics
   * GET /api/analytics/sessions
   */
  @Get('sessions')
  async getSessionAnalytics(@Query() query: TimeRangeQuery): Promise<SessionAnalytics> {
    try {
      const timeRange = this.parseTimeRange(query);
      const analytics = await this.analyticsService.getSessionAnalytics(timeRange);
      return analytics;
    } catch (error) {
      console.error('Error getting session analytics:', error);
      throw new InternalServerErrorException('Failed to get session analytics');
    }
  }

  /**
   * Get playlist analytics
   * GET /api/analytics/playlists
   */
  @Get('playlists')
  async getPlaylistAnalytics(@Query() query: TimeRangeQuery): Promise<PlaylistAnalytics> {
    try {
      const timeRange = this.parseTimeRange(query);
      const analytics = await this.analyticsService.getPlaylistAnalytics(timeRange);
      return analytics;
    } catch (error) {
      console.error('Error getting playlist analytics:', error);
      throw new InternalServerErrorException('Failed to get playlist analytics');
    }
  }

  /**
   * Get user analytics
   * GET /api/analytics/users
   */
  @Get('users')
  async getUserAnalytics(@Query() query: TimeRangeQuery): Promise<UserAnalytics> {
    try {
      const timeRange = this.parseTimeRange(query);
      const analytics = await this.analyticsService.getUserAnalytics(timeRange);
      return analytics;
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw new InternalServerErrorException('Failed to get user analytics');
    }
  }

  /**
   * Invalidate analytics cache
   * POST /api/analytics/cache/invalidate
   */
  @Post('cache/invalidate')
  async invalidateCache(): Promise<CacheResponse> {
    try {
      await this.analyticsService.invalidateCache();
      return { message: 'Analytics cache invalidated successfully' };
    } catch (error) {
      console.error('Error invalidating analytics cache:', error);
      throw new InternalServerErrorException('Failed to invalidate analytics cache');
    }
  }

  /**
   * Helper function to parse time range from query parameters
   */
  private parseTimeRange(query: TimeRangeQuery): { start: Date; end: Date } | undefined {
    if (query.start && query.end) {
      return {
        start: new Date(query.start),
        end: new Date(query.end)
      };
    }

    if (query.range) {
      const end = new Date();
      const start = new Date();

      switch (query.range) {
        case 'day':
          start.setDate(end.getDate() - 1);
          break;
        case 'week':
          start.setDate(end.getDate() - 7);
          break;
        case 'month':
          start.setMonth(end.getMonth() - 1);
          break;
        case 'year':
          start.setFullYear(end.getFullYear() - 1);
          break;
        default:
          return undefined;
      }

      return { start, end };
    }

    return undefined;
  }
} 