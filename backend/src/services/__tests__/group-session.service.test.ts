import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database.service';
import { GroupSessionService } from '../group-session.service';
import { SpotifyService } from '../spotify.service';
import { WebSocketService } from '../websocket.service';
import { createTestUser, clearDatabase, closeConnections } from '../../test/helpers';

// Mock the WebSocketService
jest.mock('../websocket.service', () => {
  const mockBroadcastToSession = jest.fn();
  const mockNotifyUserJoined = jest.fn();
  const mockNotifyUserLeft = jest.fn();
  
  return {
    WebSocketService: {
      getInstance: jest.fn().mockImplementation(() => ({
        emitSessionUpdate: jest.fn(),
        emitPlaylistUpdate: jest.fn(),
        notifyUserJoined: mockNotifyUserJoined,
        notifyUserLeft: mockNotifyUserLeft,
        notifySessionEnded: jest.fn(),
        notifyPlaylistUpdated: jest.fn(),
        broadcastToSession: mockBroadcastToSession
      })),
      mockBroadcastToSession,
      mockNotifyUserJoined,
      mockNotifyUserLeft
    }
  };
});

describe('GroupSessionService', () => {
  let dbService: DatabaseService;
  let groupSessionService: GroupSessionService;
  let wsService: WebSocketService;
  let spotifyService: SpotifyService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        GroupSessionService,
        WebSocketService,
        SpotifyService,
      ],
    }).compile();

    dbService = module.get<DatabaseService>(DatabaseService);
    spotifyService = module.get<SpotifyService>(SpotifyService);
    wsService = module.get<WebSocketService>(WebSocketService);
    groupSessionService = module.get<GroupSessionService>(GroupSessionService);

    await dbService.$connect();
  });

  beforeEach(async () => {
    // Clear test data
    await dbService.user.deleteMany();
    await dbService.groupSession.deleteMany();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await dbService.$disconnect();
    await closeConnections();
  });

  it('should be defined', () => {
    expect(groupSessionService).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session and notify via WebSocket', async () => {
      const user = await createTestUser();
      const sessionData = { name: 'Test Session' };

      const session = await groupSessionService.createSession(user.id, sessionData);

      expect(session).toBeDefined();
      expect(session.name).toBe(sessionData.name);
      
      // Check if user is connected to session using a separate query
      const sessionWithUsers = await dbService.groupSession.findUnique({
        where: { id: session.id },
        include: { users: true }
      });
      
      expect(sessionWithUsers?.users).toHaveLength(1);
      expect(sessionWithUsers?.users[0].id).toBe(user.id);

      expect(wsService.broadcastToSession).toHaveBeenCalledWith(
        session.id,
        expect.objectContaining({
          type: 'session_created',
          data: expect.any(Object)
        })
      );
    });
  });

  describe('joinSession', () => {
    it('should allow a user to join an existing session', async () => {
      const creator = await createTestUser();
      const joiner = await createTestUser();
      
      const session = await groupSessionService.createSession(creator.id, { name: 'Test Session' });
      const updatedSession = await groupSessionService.joinSession(session.id, joiner.id);

      // Check if both users are connected to session using a separate query
      const sessionWithUsers = await dbService.groupSession.findUnique({
        where: { id: session.id },
        include: { users: true }
      });
      
      expect(sessionWithUsers?.users).toHaveLength(2);
      expect(sessionWithUsers?.users.map(u => u.id)).toContain(joiner.id);

      expect(wsService.notifyUserJoined).toHaveBeenCalledWith(
        expect.objectContaining({ id: session.id }),
        expect.objectContaining({ id: joiner.id })
      );
    });
  });

  describe('leaveSession', () => {
    it('should allow a user to leave a session', async () => {
      const creator = await createTestUser();
      const session = await groupSessionService.createSession(creator.id, { name: 'Test Session' });

      await groupSessionService.leaveSession(session.id, creator.id);

      const updatedSession = await dbService.groupSession.findUnique({
        where: { id: session.id },
        include: { users: true }
      });

      expect(updatedSession?.users).toHaveLength(0);
      expect(wsService.notifyUserLeft).toHaveBeenCalledWith(
        expect.objectContaining({ id: session.id }),
        expect.objectContaining({ id: creator.id })
      );
    });
  });

  describe('updatePlaylist', () => {
    it('should create and update session playlist', async () => {
      const creator = await createTestUser();
      const session = await groupSessionService.createSession(creator.id, { name: 'Test Session' });

      const trackIds = ['track1'];

      const playlist = await groupSessionService.updatePlaylist(session.id, creator.id, trackIds);

      expect(playlist).toBeDefined();
      
      // Check if tracks are connected to playlist using a separate query
      const playlistWithTracks = await dbService.playlist.findUnique({
        where: { id: playlist.id },
        include: { tracks: true }
      });
      
      expect(playlistWithTracks?.tracks).toHaveLength(1);
      expect(playlistWithTracks?.tracks[0].spotifyId).toBe('track1');

      expect(wsService.broadcastToSession).toHaveBeenCalledWith(
        session.id,
        expect.objectContaining({
          type: 'playlist_updated',
          data: expect.any(Object)
        })
      );
    });
  });

  describe('getRecommendations', () => {
    it('should aggregate user preferences and return recommendations', async () => {
      const user = await createTestUser();
      const session = await groupSessionService.createSession(user.id, { name: 'Test Session' });

      // Add user preferences
      await dbService.userPreference.create({
        data: {
          userId: user.id,
          genres: ['rock', 'jazz'],
          topArtists: ['Artist 1', 'Artist 2'],
          features: {
            danceability: 0.8,
            energy: 0.7
          }
        }
      });

      const recommendations = await groupSessionService.getRecommendations(session.id, user.id);

      expect(recommendations).toBeDefined();
      expect(recommendations.tracks).toBeDefined();
      expect(recommendations.seeds).toBeDefined();
      expect(recommendations.seeds.seed_genres).toContain('rock');
      expect(recommendations.seeds.seed_genres).toContain('jazz');
      expect(recommendations.seeds.seed_artists).toContain('Artist 1');
    });
  });
});
