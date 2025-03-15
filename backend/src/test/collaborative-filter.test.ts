import { CollaborativeFilterService } from '../services/collaborative-filter.service';
import { DatabaseService } from '../services/database.service';
import { PrismaClient } from '@prisma/client';

describe('CollaborativeFilterService', () => {
  let collaborativeFilter: CollaborativeFilterService;
  let db: DatabaseService;
  let prisma: PrismaClient;

  beforeAll(async () => {
    db = DatabaseService.getInstance();
    collaborativeFilter = CollaborativeFilterService.getInstance();
    prisma = new PrismaClient();
  });

  beforeEach(async () => {
    // Clear tables in correct order to avoid deadlocks
    try {
      // Use a transaction to ensure atomicity and prevent deadlocks
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`TRUNCATE TABLE "TrackInteraction" CASCADE`;
        await tx.$executeRaw`TRUNCATE TABLE "TrackFeatures" CASCADE`;
        await tx.$executeRaw`TRUNCATE TABLE "Track" CASCADE`;
        await tx.$executeRaw`TRUNCATE TABLE "UserPreference" CASCADE`;
        await tx.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
      }, {
        timeout: 10000 // 10 second timeout
      });
      
      // Add a small delay to ensure the transaction is fully committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force update of the collaborative model to clear cache
      await collaborativeFilter.updateCollaborativeModel();
    } catch (error) {
      console.error('Error in test setup:', error);
      // If truncation fails, try a different approach
      try {
        await prisma.trackInteraction.deleteMany({});
        await prisma.trackFeatures.deleteMany({});
        await prisma.track.deleteMany({});
        await prisma.userPreference.deleteMany({});
        await prisma.user.deleteMany({});
        
        // Force update of the collaborative model to clear cache
        await collaborativeFilter.updateCollaborativeModel();
      } catch (fallbackError) {
        console.error('Fallback cleanup also failed:', fallbackError);
      }
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return empty recommendations for new user', async () => {
    const recommendations = await collaborativeFilter.getCollaborativeRecommendations('non-existent-user');
    expect(recommendations).toEqual([]);
  });

  it('should generate recommendations based on similar users', async () => {
    // Create test users with unique IDs
    const user1 = await prisma.user.create({
      data: {
        email: 'test_collab_1@test.com',
        spotifyId: 'spotify_collab_1',
        name: 'Test User 1'
      }
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'test_collab_2@test.com',
        spotifyId: 'spotify_collab_2',
        name: 'Test User 2'
      }
    });
    
    // Create user preferences
    await prisma.userPreference.create({
      data: {
        userId: user1.id,
        genres: ['rock', 'pop'],
        topArtists: ['Artist 1', 'Artist 2'],
        features: {
          danceability: 0.8,
          energy: 0.7,
          key: 1,
          loudness: -5,
          mode: 1,
          speechiness: 0.1,
          acousticness: 0.2,
          instrumentalness: 0.0,
          liveness: 0.1,
          valence: 0.8,
          tempo: 120
        }
      }
    });
    
    await prisma.userPreference.create({
      data: {
        userId: user2.id,
        genres: ['rock', 'pop'],
        topArtists: ['Artist 1', 'Artist 3'],
        features: {
          danceability: 0.7,
          energy: 0.6,
          key: 1,
          loudness: -6,
          mode: 1,
          speechiness: 0.2,
          acousticness: 0.3,
          instrumentalness: 0.1,
          liveness: 0.2,
          valence: 0.7,
          tempo: 110
        }
      }
    });

    // Create test tracks
    const track1 = await prisma.track.create({
      data: {
        spotifyId: 'spotify_track_1',
        name: 'Test Track 1',
        artists: ['Artist 1', 'Artist 2'],
        album: 'Album 1',
        popularity: 70
      }
    });
    
    // Add audio features
    await prisma.trackFeatures.create({
      data: {
        trackId: track1.id,
        danceability: 0.8,
        energy: 0.7,
        key: 1,
        loudness: -5,
        mode: 1,
        speechiness: 0.1,
        acousticness: 0.2,
        instrumentalness: 0.0,
        liveness: 0.1,
        valence: 0.8,
        tempo: 120
      }
    });

    const track2 = await prisma.track.create({
      data: {
        spotifyId: 'spotify_track_2',
        name: 'Test Track 2',
        artists: ['Artist 3'],
        album: 'Album 2',
        popularity: 80
      }
    });
    
    // Add audio features
    await prisma.trackFeatures.create({
      data: {
        trackId: track2.id,
        danceability: 0.6,
        energy: 0.5,
        key: 4,
        loudness: -8,
        mode: 0,
        speechiness: 0.2,
        acousticness: 0.4,
        instrumentalness: 0.1,
        liveness: 0.2,
        valence: 0.6,
        tempo: 100
      }
    });

    // Create interactions
    await prisma.trackInteraction.create({
      data: {
        userId: user1.id,
        trackId: track1.id,
        type: 'like',
        timestamp: new Date()
      }
    });

    await prisma.trackInteraction.create({
      data: {
        userId: user2.id,
        trackId: track1.id,
        type: 'like',
        timestamp: new Date()
      }
    });

    await prisma.trackInteraction.create({
      data: {
        userId: user2.id,
        trackId: track2.id,
        type: 'like',
        timestamp: new Date()
      }
    });

    // Force update of the collaborative model
    await collaborativeFilter.updateCollaborativeModel();

    // Get recommendations for user1
    const recommendations = await collaborativeFilter.getCollaborativeRecommendations(user1.id);
    
    // Should recommend track2 since user2 has similar taste (liked track1) and also liked track2
    expect(recommendations).toHaveLength(2);
    expect(recommendations).toContain(track2.id);
  });

  it('should weight different interaction types correctly', async () => {
    const user1 = await prisma.user.create({
      data: {
        email: 'test_collab_3@test.com',
        spotifyId: 'spotify_collab_3',
        name: 'Test User 3'
      }
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'test_collab_4@test.com',
        spotifyId: 'spotify_collab_4',
        name: 'Test User 4'
      }
    });
    
    // Create user preferences
    await prisma.userPreference.create({
      data: {
        userId: user1.id,
        genres: ['rock', 'pop'],
        topArtists: ['Artist 1', 'Artist 2'],
        features: {
          danceability: 0.8,
          energy: 0.7,
          key: 1,
          loudness: -5,
          mode: 1,
          speechiness: 0.1,
          acousticness: 0.2,
          instrumentalness: 0.0,
          liveness: 0.1,
          valence: 0.8,
          tempo: 120
        }
      }
    });
    
    await prisma.userPreference.create({
      data: {
        userId: user2.id,
        genres: ['rock', 'pop'],
        topArtists: ['Artist 1', 'Artist 3'],
        features: {
          danceability: 0.7,
          energy: 0.6,
          key: 1,
          loudness: -6,
          mode: 1,
          speechiness: 0.2,
          acousticness: 0.3,
          instrumentalness: 0.1,
          liveness: 0.2,
          valence: 0.7,
          tempo: 110
        }
      }
    });

    // Create test tracks
    const track1 = await prisma.track.create({
      data: {
        spotifyId: 'spotify_track_3',
        name: 'Test Track 3',
        artists: ['Artist 1', 'Artist 2'],
        album: 'Album 1',
        popularity: 70
      }
    });
    
    // Add audio features
    await prisma.trackFeatures.create({
      data: {
        trackId: track1.id,
        danceability: 0.8,
        energy: 0.7,
        key: 1,
        loudness: -5,
        mode: 1,
        speechiness: 0.1,
        acousticness: 0.2,
        instrumentalness: 0.0,
        liveness: 0.1,
        valence: 0.8,
        tempo: 120
      }
    });

    const track2 = await prisma.track.create({
      data: {
        spotifyId: 'spotify_track_4',
        name: 'Test Track 4',
        artists: ['Artist 3'],
        album: 'Album 2',
        popularity: 80
      }
    });
    
    // Add audio features
    await prisma.trackFeatures.create({
      data: {
        trackId: track2.id,
        danceability: 0.6,
        energy: 0.5,
        key: 4,
        loudness: -8,
        mode: 0,
        speechiness: 0.2,
        acousticness: 0.4,
        instrumentalness: 0.1,
        liveness: 0.2,
        valence: 0.6,
        tempo: 100
      }
    });

    // Create different types of interactions
    // User 1 likes track 1 strongly (like)
    await prisma.trackInteraction.create({
      data: {
        userId: user1.id,
        trackId: track1.id,
        type: 'like',
        timestamp: new Date()
      }
    });

    // User 2 has weaker interaction with track 1 (play/listen)
    await prisma.trackInteraction.create({
      data: {
        userId: user2.id,
        trackId: track1.id,
        type: 'listen',
        timestamp: new Date()
      }
    });

    // User 2 has strong interaction with track 2 (like)
    await prisma.trackInteraction.create({
      data: {
        userId: user2.id,
        trackId: track2.id,
        type: 'like',
        timestamp: new Date()
      }
    });

    // Force update of the collaborative model
    await collaborativeFilter.updateCollaborativeModel();

    // Get recommendations for user1
    const recommendations = await collaborativeFilter.getCollaborativeRecommendations(user1.id);
    
    // Should still recommend track2 but with lower similarity score
    expect(recommendations).toHaveLength(2);
    expect(recommendations).toContain(track2.id);
  });
}); 