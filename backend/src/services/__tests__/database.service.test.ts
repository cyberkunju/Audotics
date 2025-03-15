import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database.service';
import { clearDatabase, closeConnections } from '../../test/helpers';
import { GroupSession, User } from '@prisma/client';

describe('DatabaseService', () => {
  let dbService: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService],
    }).compile();

    dbService = module.get<DatabaseService>(DatabaseService);
    await dbService.$connect();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeConnections();
    await dbService.$disconnect();
  });

  it('should be defined', () => {
    expect(dbService).toBeDefined();
  });

  describe('User Operations', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        spotifyId: 'spotify_123',
        name: 'Test User',
      };

      const user = await dbService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.spotifyId).toBe(userData.spotifyId);
      expect(user.name).toBe(userData.name);
    });

    it('should find user by Spotify ID', async () => {
      const userData = {
        email: 'test@example.com',
        spotifyId: 'spotify_123',
        name: 'Test User',
      };

      await dbService.createUser(userData);
      const foundUser = await dbService.findUserBySpotifyId(userData.spotifyId);

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(userData.email);
    });

    it('should update user preferences', async () => {
      const userData = {
        email: 'test@example.com',
        spotifyId: 'spotify_123',
        name: 'Test User',
      };

      const user = await dbService.createUser(userData);
      const preferences = {
        genres: ['rock', 'jazz'],
        topArtists: ['artist1', 'artist2'],
        features: {
          danceability: 0.8,
          energy: 0.7,
        },
      };

      const updatedPreferences = await dbService.updateUserPreferences(user.id, preferences);

      expect(updatedPreferences).toBeDefined();
      expect(updatedPreferences.genres).toEqual(preferences.genres);
      expect(updatedPreferences.topArtists).toEqual(preferences.topArtists);
      expect(updatedPreferences.features).toEqual(preferences.features);
    });
  });

  describe('Group Session Operations', () => {
    it('should create a group session', async () => {
      const user1 = await dbService.createUser({
        email: 'user1@example.com',
        spotifyId: 'spotify_1',
        name: 'User 1'
      });

      const user2 = await dbService.createUser({
        email: 'user2@example.com',
        spotifyId: 'spotify_2',
        name: 'User 2'
      });

      const sessionData = {
        name: 'Test Session',
        creatorId: user1.id,
      };

      const session = await dbService.createGroupSession(sessionData);

      // Add user2 to the session
      await dbService.addParticipantToSession(session.id, user2.id);

      // Get the session with users included
      const sessionWithUsers = await dbService.findGroupSession(session.id) as GroupSession & { 
        users: User[] 
      };

      expect(sessionWithUsers).toBeDefined();
      expect(sessionWithUsers.name).toBe(sessionData.name);
      
      // Check that both users are in the session
      expect(sessionWithUsers.users).toHaveLength(2);
      expect(sessionWithUsers.users.map(u => u.id)).toContain(user1.id);
      expect(sessionWithUsers.users.map(u => u.id)).toContain(user2.id);
    });

    it('should find a group session with all related data', async () => {
      const user = await dbService.createUser({
        email: 'test@example.com',
        spotifyId: 'spotify_123',
        name: 'Test User'
      });

      const sessionData = {
        name: 'Test Session',
        creatorId: user.id,
      };

      const session = await dbService.createGroupSession(sessionData);

      const fullSession = await dbService.findGroupSession(session.id) as GroupSession & {
        users: User[]
      };
      
      expect(fullSession).toBeDefined();
      expect(fullSession.name).toBe(sessionData.name);
      expect(fullSession.users).toHaveLength(1);
      expect(fullSession.users[0].id).toBe(user.id);
    });
  });
});
