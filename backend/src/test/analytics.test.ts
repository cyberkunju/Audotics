import { AnalyticsService } from '../services/analytics.service';
import { DatabaseService } from '../services/database.service';
import { PrismaClient } from '@prisma/client';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let db: DatabaseService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    db = DatabaseService.getInstance();
    analyticsService = AnalyticsService.getInstance();
    prisma = new PrismaClient();
  });

  beforeEach(async () => {
    // Clear test data
    await prisma.$executeRaw`TRUNCATE TABLE "PlaylistUpdate" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "TrackInteraction" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Playlist" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "GroupSession" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "UserPreference" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "Track" CASCADE`;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Session Analytics', () => {
    it('should get session analytics', async () => {
      // Create test users
      const user1 = await prisma.user.create({
        data: {
          email: 'user1@test.com',
          spotifyId: 'spotify1',
          name: 'User 1'
        }
      });

      const user2 = await prisma.user.create({
        data: {
          email: 'user2@test.com',
          spotifyId: 'spotify2',
          name: 'User 2'
        }
      });

      // Create sessions
      const session1 = await prisma.groupSession.create({
        data: {
          name: 'Session 1',
          active: true,
          users: {
            connect: [{ id: user1.id }, { id: user2.id }]
          }
        }
      });

      const session2 = await prisma.groupSession.create({
        data: {
          name: 'Session 2',
          active: false,
          users: {
            connect: [{ id: user1.id }]
          }
        }
      });

      const analytics = await analyticsService.getSessionAnalytics();

      expect(analytics.totalSessions).toBe(2);
      expect(analytics.activeSessions).toBe(1);
      expect(analytics.totalUsers).toBe(2);
      expect(analytics.averageUsersPerSession).toBe(1.5);
    });
  });

  describe('Playlist Analytics', () => {
    it('should get playlist analytics', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          email: 'user@test.com',
          spotifyId: 'spotify1',
          name: 'User 1'
        }
      });

      // Create tracks
      const track1 = await prisma.track.create({
        data: {
          spotifyId: 'track1',
          name: 'Track 1',
          artists: ['Artist 1', 'Artist 2'],
          album: 'Album 1',
          popularity: 80
        }
      });

      const track2 = await prisma.track.create({
        data: {
          spotifyId: 'track2',
          name: 'Track 2',
          artists: ['Artist 2', 'Artist 3'],
          album: 'Album 2',
          popularity: 60
        }
      });

      // Create playlist
      await prisma.playlist.create({
        data: {
          name: 'Test Playlist',
          creatorId: user.id,
          tracks: {
            connect: [{ id: track1.id }, { id: track2.id }]
          }
        }
      });

      const analytics = await analyticsService.getPlaylistAnalytics();

      expect(analytics.totalTracks).toBe(2);
      expect(analytics.uniqueTracks).toBe(2);
      expect(analytics.averageTrackPopularity).toBe(70);
      expect(analytics.topGenres).toHaveLength(3);
      expect(analytics.mostAddedTracks).toHaveLength(2);
    });
  });

  describe('User Analytics', () => {
    it('should get user analytics', async () => {
      // Create test user with preferences
      const user = await prisma.user.create({
        data: {
          email: 'user@test.com',
          spotifyId: 'spotify1',
          name: 'User 1',
          preferences: {
            create: {
              genres: ['rock', 'pop'],
              topArtists: ['Artist 1', 'Artist 2'],
              features: {}
            }
          }
        }
      });

      // Create track
      const track = await prisma.track.create({
        data: {
          spotifyId: 'track1',
          name: 'Track 1',
          artists: ['Artist 1'],
          album: 'Album 1'
        }
      });

      // Create interactions
      await prisma.$executeRaw`
        INSERT INTO "TrackInteraction" ("id", "userId", "trackId", "type", "timestamp")
        VALUES (gen_random_uuid(), ${user.id}, ${track.id}, 'like', NOW())
      `;

      await prisma.$executeRaw`
        INSERT INTO "TrackInteraction" ("id", "userId", "trackId", "type", "timestamp")
        VALUES (gen_random_uuid(), ${user.id}, ${track.id}, 'play', NOW())
      `;

      const analytics = await analyticsService.getUserAnalytics();

      expect(analytics.totalUsers).toBe(1);
      expect(analytics.activeUsers).toBe(0);
      expect(analytics.topArtists).toHaveLength(2);
      expect(analytics.topGenres).toHaveLength(2);
      expect(Object.keys(analytics.interactionsByType)).toHaveLength(2);
      expect(analytics.interactionsByType.like).toBe(1);
      expect(analytics.interactionsByType.play).toBe(1);
    });

    it('should filter analytics by time range', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          email: 'user@test.com',
          spotifyId: 'spotify1',
          name: 'User 1'
        }
      });

      // Create sessions in different time ranges
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 2);

      await prisma.groupSession.create({
        data: {
          name: 'Old Session',
          active: false,
          createdAt: pastDate,
          updatedAt: pastDate,
          users: {
            connect: [{ id: user.id }]
          }
        }
      });

      await prisma.groupSession.create({
        data: {
          name: 'Recent Session',
          active: true,
          users: {
            connect: [{ id: user.id }]
          }
        }
      });

      const timeRange = {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        end: new Date()
      };

      const analytics = await analyticsService.getSessionAnalytics(timeRange);

      expect(analytics.totalSessions).toBe(1);
      expect(analytics.activeSessions).toBe(1);
    });
  });
}); 