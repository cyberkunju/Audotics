import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketService } from '../websocket.service';
import { Server } from 'socket.io';
import { createServer } from 'http';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let server: Server;
  let httpServer;

  beforeEach(async () => {
    httpServer = createServer();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketService,
        {
          provide: Server,
          useValue: new Server(httpServer, {
            cors: {
              origin: 'http://localhost:3000',
              credentials: true
            }
          })
        }
      ],
    }).compile();

    service = module.get<WebSocketService>(WebSocketService);
    server = module.get<Server>(Server);
  });

  afterEach(() => {
    server.close();
    httpServer.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('broadcastToSession', () => {
    it('should emit event to session room', () => {
      const sessionId = 'test-session';
      const event = {
        type: 'test_event',
        data: { message: 'test' }
      };

      const toSpy = jest.spyOn(server, 'to').mockReturnThis();
      const emitSpy = jest.spyOn(server, 'emit');

      service.broadcastToSession(sessionId, event);

      expect(toSpy).toHaveBeenCalledWith(`session:${sessionId}`);
      expect(emitSpy).toHaveBeenCalledWith('session_event', event);
    });
  });

  describe('notifyUserJoined', () => {
    it('should broadcast user joined event', () => {
      const session = { id: 'test-session' } as any;
      const user = { id: 'test-user' } as any;

      const broadcastSpy = jest.spyOn(service, 'broadcastToSession');

      service.notifyUserJoined(session, user);

      expect(broadcastSpy).toHaveBeenCalledWith(session.id, {
        type: 'user_joined',
        data: { sessionId: session.id, user }
      });
    });
  });

  describe('notifyPlaylistUpdated', () => {
    it('should broadcast to a session when playlist updated', () => {
      const sessionId = 'test-session-id';
      const mockSession = {
        id: sessionId,
        name: 'Test Session',
        createdAt: new Date(),
        updatedAt: new Date(),
        active: true
      };
      const mockPlaylist = {
        id: 'playlist-id',
        name: 'Test Playlist',
        tracks: [],
        totalTracks: 0,
        creatorId: 'user-id',
        sessionId: sessionId
      };
      const broadcastSpy = jest.spyOn(service, 'broadcastToSession');

      service.notifyPlaylistUpdated(mockSession, mockPlaylist);

      expect(broadcastSpy).toHaveBeenCalledWith(sessionId, {
        type: 'playlist_updated',
        sessionId: sessionId,
        data: mockPlaylist
      });
    });
  });
});
